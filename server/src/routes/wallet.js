import express from 'express';
import { User } from '../models/User.js';
import { Withdrawal } from '../models/Withdrawal.js';
import { Payment } from '../models/Payment.js';
import { verifyToken, requireAnyRole, requireRole } from '../middleware/auth.js';
import { createNotification, logActivity, emitWalletUpdate } from '../services/notificationService.js';

const router = express.Router();
const getIo = (req) => req.app.get('io');

// ── Get wallet balance ────────────────────────────────────────────────────────
router.get('/', verifyToken, requireAnyRole(['tutor']), async (req, res) => {
  try {
    const tutor = await User.findById(req.user.id).select('wallet bankDetails upiId');
    if (!tutor) return res.status(404).json({ message: 'User not found' });

    res.json({
      wallet: tutor.wallet,
      bankDetails: tutor.bankDetails,
      upiId: tutor.upiId,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Get transaction history ───────────────────────────────────────────────────
router.get('/transactions', verifyToken, requireAnyRole(['tutor']), async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;

    // Get payments (earnings)
    const payments = await Payment.find({ tutor: req.user.id, status: 'Completed' })
      .populate('student', 'name')
      .populate('booking', 'subject')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments({ tutor: req.user.id, status: 'Completed' });

    // Calculate totals
    const allPayments = await Payment.find({ tutor: req.user.id, status: 'Completed' });
    const totalEarnings = allPayments.reduce((sum, p) => sum + p.tutorShare, 0);
    const totalCommission = allPayments.reduce((sum, p) => sum + p.adminShare, 0);

    res.json({
      transactions: payments,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      summary: {
        totalEarnings,
        totalCommission,
        netEarnings: totalEarnings,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Request withdrawal ────────────────────────────────────────────────────────
router.post('/withdraw', verifyToken, requireAnyRole(['tutor']), async (req, res) => {
  try {
    const { amount, payoutMethod } = req.body;
    const tutor = await User.findById(req.user.id);
    if (!tutor) return res.status(404).json({ message: 'User not found' });

    if (amount > tutor.wallet.availableBalance) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    if (amount < 500) {
      return res.status(400).json({ message: 'Minimum withdrawal amount is ₹500' });
    }

    // Check for pending withdrawal
    const pendingWithdrawal = await Withdrawal.findOne({ tutor: req.user.id, status: 'pending' });
    if (pendingWithdrawal) {
      return res.status(400).json({ message: 'You already have a pending withdrawal request' });
    }

    const withdrawal = new Withdrawal({
      tutor: req.user.id,
      amount,
      payoutMethod: payoutMethod || 'bank',
      bankDetails: tutor.bankDetails,
      upiId: tutor.upiId,
    });
    await withdrawal.save();

    // Move amount from available to pending
    tutor.wallet.availableBalance -= amount;
    tutor.wallet.pendingBalance += amount;
    await tutor.save();

    const io = getIo(req);
    emitWalletUpdate(io, req.user.id, tutor.wallet);

    await createNotification(io, {
      recipientId: null, // admin
      title: 'New Withdrawal Request',
      message: `Tutor ${tutor.name} requested ₹${amount} withdrawal`,
      type: 'payout',
      icon: '💰',
    });

    await logActivity({
      userId: req.user.id,
      action: 'Withdrawal requested',
      category: 'payout',
      details: `Withdrawal of ₹${amount} requested`,
      metadata: { withdrawalId: withdrawal._id, amount },
      req,
    });

    res.status(201).json(withdrawal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Get withdrawal history ────────────────────────────────────────────────────
router.get('/withdrawals', verifyToken, requireAnyRole(['tutor']), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const withdrawals = await Withdrawal.find({ tutor: req.user.id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Withdrawal.countDocuments({ tutor: req.user.id });

    res.json({ withdrawals, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Update bank details ───────────────────────────────────────────────────────
router.put('/bank-details', verifyToken, requireAnyRole(['tutor']), async (req, res) => {
  try {
    const { bankDetails, upiId } = req.body;
    const tutor = await User.findByIdAndUpdate(req.user.id, {
      ...(bankDetails && { bankDetails }),
      ...(upiId && { upiId }),
    }, { new: true });

    res.json({ bankDetails: tutor.bankDetails, upiId: tutor.upiId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Admin: Get all withdrawal requests ────────────────────────────────────────
router.get('/admin/withdrawals', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const withdrawals = await Withdrawal.find(filter)
      .populate('tutor', 'name email avatar bankDetails upiId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Withdrawal.countDocuments(filter);
    const pendingCount = await Withdrawal.countDocuments({ status: 'pending' });
    const pendingAmount = (await Withdrawal.aggregate([
      { $match: { status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]))[0]?.total || 0;

    res.json({
      withdrawals, total, pendingCount, pendingAmount,
      page: parseInt(page), pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Admin: Process withdrawal ─────────────────────────────────────────────────
router.patch('/admin/withdrawals/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { status, transactionId, rejectionReason } = req.body;
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' });

    const tutor = await User.findById(withdrawal.tutor);

    if (status === 'paid') {
      withdrawal.status = 'paid';
      withdrawal.processedAt = new Date();
      withdrawal.processedBy = req.user.id;
      withdrawal.transactionId = transactionId;

      // Move from pending to paid
      tutor.wallet.pendingBalance -= withdrawal.amount;
      tutor.wallet.paidBalance += withdrawal.amount;
      await tutor.save();
    } else if (status === 'rejected') {
      withdrawal.status = 'rejected';
      withdrawal.processedAt = new Date();
      withdrawal.processedBy = req.user.id;
      withdrawal.rejectionReason = rejectionReason;

      // Move back from pending to available
      tutor.wallet.pendingBalance -= withdrawal.amount;
      tutor.wallet.availableBalance += withdrawal.amount;
      await tutor.save();
    }

    await withdrawal.save();

    const io = getIo(req);
    emitWalletUpdate(io, withdrawal.tutor.toString(), tutor.wallet);

    await createNotification(io, {
      recipientId: withdrawal.tutor,
      title: status === 'paid' ? 'Payout Completed' : 'Payout Rejected',
      message: status === 'paid'
        ? `₹${withdrawal.amount} has been transferred to your bank account`
        : `Your withdrawal request was rejected: ${rejectionReason}`,
      type: 'payout',
      icon: status === 'paid' ? '✅' : '❌',
    });

    res.json(withdrawal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Admin: Payout summary ─────────────────────────────────────────────────────
router.get('/admin/payout-summary', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [totalPayouts, paidPayouts, pendingPayouts, avgPayoutTime] = await Promise.all([
      Withdrawal.aggregate([
        { $match: { createdAt: { $gte: thisMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Withdrawal.aggregate([
        { $match: { status: 'paid', createdAt: { $gte: thisMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Withdrawal.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Withdrawal.aggregate([
        { $match: { status: 'paid', processedAt: { $exists: true } } },
        {
          $project: {
            processingTime: { $subtract: ['$processedAt', '$createdAt'] },
          },
        },
        { $group: { _id: null, avgTime: { $avg: '$processingTime' } } },
      ]),
    ]);

    const avgDays = avgPayoutTime[0]?.avgTime
      ? (avgPayoutTime[0].avgTime / (1000 * 60 * 60 * 24)).toFixed(1)
      : '0';

    res.json({
      totalPayouts: totalPayouts[0]?.total || 0,
      paidPayouts: paidPayouts[0]?.total || 0,
      pendingPayouts: pendingPayouts[0]?.total || 0,
      pendingCount: pendingPayouts[0]?.count || 0,
      avgPayoutDays: parseFloat(avgDays),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
