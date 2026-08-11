import express from 'express';
import Lead from '../models/Lead.js';
import LeadDispute from '../models/LeadDispute.js';
import User from '../models/User.js';
import PlatformConfig from '../models/PlatformConfig.js';
import { verifyToken, requireAnyRole } from '../middleware/auth.js';
import { createNotification, logActivity } from '../services/notificationService.js';
import { checkFreeLeadsAvailable, creditLeadBack } from '../services/commissionService.js';
import { execute } from '../config/db.js';

const router = express.Router();
const getIo = (req) => req.app.get('io');

// ── Get leads for a tutor ─────────────────────────────────────────────────────
router.get('/tutor/:tutorId', verifyToken, requireAnyRole(['tutor', 'admin']), async (req, res) => {
  try {
    if (req.user.role === 'tutor' && String(req.user.id) !== String(req.params.tutorId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const filter = { tutor: req.params.tutorId };
    if (status) filter.status = status;

    const leads = await Lead.find(filter);
    for (const l of leads) {
      l.student = await User.findById(l.student);
    }

    const total = await Lead.countDocuments(filter);

    res.json({ leads, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Get lead stats for tutor ──────────────────────────────────────────────────
router.get('/tutor/:tutorId/stats', verifyToken, requireAnyRole(['tutor', 'admin']), async (req, res) => {
  try {
    const tutorId = req.params.tutorId;
    if (req.user.role === 'tutor' && String(req.user.id) !== String(tutorId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const [totalLeads, activeLeads, convertedLeads, disputedLeads] = await Promise.all([
      Lead.countDocuments({ tutor: tutorId }),
      Lead.countDocuments({ tutor: tutorId, status: 'new' }),
      Lead.countDocuments({ tutor: tutorId, status: 'converted' }),
      Lead.countDocuments({ tutor: tutorId, status: 'disputed' }),
    ]);

    const freeLeads = await checkFreeLeadsAvailable(tutorId);

    res.json({
      totalLeads,
      activeLeads,
      convertedLeads,
      disputedLeads,
      freeLeads,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Admin: Create / deliver lead to tutor ─────────────────────────────────────
router.post('/', verifyToken, requireAnyRole(['admin']), async (req, res) => {
  try {
    const { studentId, tutorId, subject, classLevel, board, location, mode, budget, message } = req.body;

    if (!studentId || !tutorId || !subject || !classLevel) {
      return res.status(400).json({ message: 'studentId, tutorId, subject, and classLevel are required' });
    }

    const freeLeads = await checkFreeLeadsAvailable(tutorId);
    const isFreeSlot = freeLeads.canReceiveLead;

    const lead = await Lead.create({
      student: studentId,
      tutor: tutorId,
      subject,
      classLevel,
      board,
      location: location || {},
      mode: mode || 'Home',
      budget,
      message,
      isFreeLeadSlot: isFreeSlot,
      source: 'admin',
      deliveredAt: new Date(),
    });

    if (isFreeSlot) {
      const tutorObj = await User.findById(tutorId);
      if (tutorObj) {
        await User.findByIdAndUpdate(tutorId, { freeLeadsUsed: (tutorObj.freeLeadsUsed || 0) + 1 });
      }
    }

    lead.student = await User.findById(studentId);

    const io = getIo(req);
    await createNotification(io, {
      recipientId: tutorId,
      title: 'New Lead Received',
      message: `New ${subject} lead for ${classLevel}`,
      type: 'lead',
      link: '/dashboard/tutor',
      icon: '📋',
    });

    io?.emit('lead:new', { tutorId, lead });

    await logActivity({
      userId: req.user.id,
      action: 'Lead delivered',
      category: 'lead',
      details: `Lead ${lead.leadDisplayId} delivered to tutor`,
      metadata: { leadId: lead.id, tutorId },
      req,
    });

    res.status(201).json(lead);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Update lead status (tutor) ────────────────────────────────────────────────
router.patch('/:id/status', verifyToken, requireAnyRole(['tutor', 'admin']), async (req, res) => {
  try {
    const { status } = req.body;
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    if (req.user.role === 'tutor' && String(lead.tutor) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const validTransitions = {
      new: ['contacted', 'disputed'],
      contacted: ['responded', 'disputed'],
      responded: ['converted', 'disputed'],
    };

    if (validTransitions[lead.status] && !validTransitions[lead.status].includes(status)) {
      return res.status(400).json({ message: `Cannot transition from ${lead.status} to ${status}` });
    }

    const updates = { status };
    if (status === 'contacted') updates.contactedAt = new Date();
    if (status === 'responded') updates.respondedAt = new Date();
    if (status === 'converted') updates.convertedAt = new Date();

    const updated = await Lead.findByIdAndUpdate(req.params.id, updates);

    const io = getIo(req);
    io?.emit('lead:statusChange', { leadId: updated.id, status });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Dispute a lead ────────────────────────────────────────────────────────────
router.post('/:id/dispute', verifyToken, requireAnyRole(['tutor']), async (req, res) => {
  try {
    const { reason, description } = req.body;
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    if (String(lead.tutor) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const config = await PlatformConfig.getConfig();
    const windowMs = config.leadDisputeWindowHours * 60 * 60 * 1000;
    const timeSinceDelivery = Date.now() - new Date(lead.deliveredAt).getTime();

    if (timeSinceDelivery > windowMs) {
      return res.status(400).json({
        message: `Dispute window of ${config.leadDisputeWindowHours} hours has expired`
      });
    }

    const disputeData = {
      lead: lead.id,
      tutor: req.user.id,
      reason,
      description,
    };

    if (config.autoReplacementEnabled) {
      disputeData.status = 'auto-resolved';
      disputeData.autoResolved = true;
      disputeData.autoResolvedAt = new Date();
      disputeData.resolutionAction = 'credited';

      await creditLeadBack(req.user.id);
      await Lead.findByIdAndUpdate(lead.id, { status: 'disputed', disputeReason: reason, disputedAt: new Date() });
    } else {
      disputeData.status = 'pending-review';
      await Lead.findByIdAndUpdate(lead.id, { status: 'disputed', disputeReason: reason, disputedAt: new Date() });
    }

    const dispute = await LeadDispute.create(disputeData);

    const io = getIo(req);
    io?.emit('lead:disputed', { leadId: lead.id, disputeId: dispute.id });

    await createNotification(io, {
      recipientId: null,
      title: 'Lead Disputed',
      message: `Tutor disputed lead ${lead.leadDisplayId}: ${reason}`,
      type: 'lead_dispute',
      icon: '⚠️',
    });

    await logActivity({
      userId: req.user.id,
      action: 'Lead disputed',
      category: 'dispute',
      details: `Lead ${lead.leadDisplayId} disputed: ${reason}`,
      metadata: { leadId: lead.id, disputeId: dispute.id },
      req,
    });

    res.json({
      dispute,
      autoResolved: dispute.autoResolved,
      message: dispute.autoResolved
        ? 'Lead has been auto-resolved and credited back to your free leads.'
        : 'Dispute submitted. Admin will review within 48 hours.',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Admin: Get all leads ──────────────────────────────────────────────────────
router.get('/', verifyToken, requireAnyRole(['admin']), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const leads = await Lead.find(filter);
    for (const l of leads) {
      l.student = await User.findById(l.student);
      l.tutor = await User.findById(l.tutor);
    }

    const total = await Lead.countDocuments(filter);

    res.json({ leads, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Admin: Get lead disputes ──────────────────────────────────────────────────
router.get('/disputes', verifyToken, requireAnyRole(['admin']), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const disputes = await LeadDispute.find(filter);
    for (const d of disputes) {
      d.lead = await Lead.findById(d.lead);
      d.tutor = await User.findById(d.tutor);
    }

    const total = await LeadDispute.countDocuments(filter);

    const [autoResolved, pendingReview, escalated, resolved] = await Promise.all([
      LeadDispute.countDocuments({ status: 'auto-resolved' }),
      LeadDispute.countDocuments({ status: 'pending-review' }),
      LeadDispute.countDocuments({ status: 'escalated' }),
      LeadDispute.countDocuments({ status: 'resolved' }),
    ]);

    res.json({
      disputes,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      stats: { autoResolved, pendingReview, escalated, resolved },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Admin: Resolve dispute ────────────────────────────────────────────────────
router.patch('/disputes/:id/resolve', verifyToken, requireAnyRole(['admin']), async (req, res) => {
  try {
    const { resolution, resolutionAction } = req.body;
    const dispute = await LeadDispute.findById(req.params.id);
    if (!dispute) return res.status(404).json({ message: 'Dispute not found' });

    const updated = await LeadDispute.findByIdAndUpdate(req.params.id, {
      status: 'resolved',
      adminResolvedBy: req.user.id,
      adminResolvedAt: new Date(),
      resolution,
      resolutionAction,
    });

    if (resolutionAction === 'credited' || resolutionAction === 'replaced') {
      await creditLeadBack(updated.tutor);
    }

    const io = getIo(req);
    await createNotification(io, {
      recipientId: updated.tutor,
      title: 'Dispute Resolved',
      message: `Your lead dispute has been resolved: ${resolution}`,
      type: 'lead_dispute',
      icon: '✅',
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
