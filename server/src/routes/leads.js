import express from 'express';
import { Lead } from '../models/Lead.js';
import { LeadDispute } from '../models/LeadDispute.js';
import { User } from '../models/User.js';
import { PlatformConfig } from '../models/PlatformConfig.js';
import { verifyToken, requireAnyRole } from '../middleware/auth.js';
import { createNotification, logActivity } from '../services/notificationService.js';
import { checkFreeLeadsAvailable, creditLeadBack } from '../services/commissionService.js';

const router = express.Router();
const getIo = (req) => req.app.get('io');

// ── Get leads for a tutor ─────────────────────────────────────────────────────
router.get('/tutor/:tutorId', verifyToken, requireAnyRole(['tutor', 'admin']), async (req, res) => {
  try {
    if (req.user.role === 'tutor' && req.user.id !== req.params.tutorId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const filter = { tutor: req.params.tutorId };
    if (status) filter.status = status;

    const leads = await Lead.find(filter)
      .populate('student', 'name email mobile avatar grade board address')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

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
    if (req.user.role === 'tutor' && req.user.id !== tutorId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const [totalLeads, activeLeads, convertedLeads, disputedLeads] = await Promise.all([
      Lead.countDocuments({ tutor: tutorId }),
      Lead.countDocuments({ tutor: tutorId, status: { $in: ['new', 'contacted', 'responded'] } }),
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

    // Check if tutor can receive lead
    const freeLeads = await checkFreeLeadsAvailable(tutorId);
    const isFreeSlot = freeLeads.canReceiveLead;

    const lead = new Lead({
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

    await lead.save();

    // Increment tutor's free leads used
    if (isFreeSlot) {
      await User.findByIdAndUpdate(tutorId, { $inc: { freeLeadsUsed: 1 } });
    }

    await lead.populate('student', 'name email mobile avatar');

    // Notify tutor
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
      metadata: { leadId: lead._id, tutorId },
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

    if (req.user.role === 'tutor' && lead.tutor.toString() !== req.user.id) {
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

    lead.status = status;
    if (status === 'contacted') lead.contactedAt = new Date();
    if (status === 'responded') lead.respondedAt = new Date();
    if (status === 'converted') lead.convertedAt = new Date();

    await lead.save();

    const io = getIo(req);
    io?.emit('lead:statusChange', { leadId: lead._id, status });

    res.json(lead);
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
    if (lead.tutor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check 48-hour dispute window
    const config = await PlatformConfig.getConfig();
    const windowMs = config.leadDisputeWindowHours * 60 * 60 * 1000;
    const timeSinceDelivery = Date.now() - new Date(lead.deliveredAt).getTime();

    if (timeSinceDelivery > windowMs) {
      return res.status(400).json({
        message: `Dispute window of ${config.leadDisputeWindowHours} hours has expired`
      });
    }

    // Create dispute
    const dispute = new LeadDispute({
      lead: lead._id,
      tutor: req.user.id,
      reason,
      description,
    });

    // Auto-resolve if auto-replacement is enabled
    if (config.autoReplacementEnabled) {
      dispute.status = 'auto-resolved';
      dispute.autoResolved = true;
      dispute.autoResolvedAt = new Date();
      dispute.resolutionAction = 'credited';

      // Credit back the lead
      await creditLeadBack(req.user.id);

      lead.status = 'disputed';
      lead.disputeReason = reason;
      lead.disputedAt = new Date();
      await lead.save();
    } else {
      dispute.status = 'pending-review';
      lead.status = 'disputed';
      lead.disputeReason = reason;
      lead.disputedAt = new Date();
      await lead.save();
    }

    await dispute.save();

    const io = getIo(req);
    io?.emit('lead:disputed', { leadId: lead._id, disputeId: dispute._id });

    // Notify admin
    await createNotification(io, {
      recipientId: null, // broadcast to admins
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
      metadata: { leadId: lead._id, disputeId: dispute._id },
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

    const leads = await Lead.find(filter)
      .populate('student', 'name email mobile')
      .populate('tutor', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

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

    const disputes = await LeadDispute.find(filter)
      .populate('lead')
      .populate('tutor', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await LeadDispute.countDocuments(filter);

    // Get dispute stats
    const [autoResolved, pendingReview, escalated, resolved] = await Promise.all([
      LeadDispute.countDocuments({ status: 'auto-resolved', createdAt: { $gte: new Date(new Date().setDate(1)) } }),
      LeadDispute.countDocuments({ status: 'pending-review' }),
      LeadDispute.countDocuments({ status: 'escalated' }),
      LeadDispute.countDocuments({ status: 'resolved', createdAt: { $gte: new Date(new Date().setDate(1)) } }),
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
    const dispute = await LeadDispute.findById(req.params.id).populate('lead tutor');
    if (!dispute) return res.status(404).json({ message: 'Dispute not found' });

    dispute.status = 'resolved';
    dispute.adminResolvedBy = req.user.id;
    dispute.adminResolvedAt = new Date();
    dispute.resolution = resolution;
    dispute.resolutionAction = resolutionAction;

    if (resolutionAction === 'credited' || resolutionAction === 'replaced') {
      await creditLeadBack(dispute.tutor._id);
    }

    await dispute.save();

    const io = getIo(req);
    await createNotification(io, {
      recipientId: dispute.tutor._id,
      title: 'Dispute Resolved',
      message: `Your lead dispute has been resolved: ${resolution}`,
      type: 'lead_dispute',
      icon: '✅',
    });

    res.json(dispute);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
