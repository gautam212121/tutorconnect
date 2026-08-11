import express from 'express';
import User from '../models/User.js';
import Withdrawal from '../models/Withdrawal.js';
import Payment from '../models/Payment.js';
import { verifyToken, requireAnyRole, requireRole } from '../middleware/auth.js';
import { createNotification, logActivity, emitWalletUpdate } from '../services/notificationService.js';
import { query } from '../config/db.js';

const router = express.Router();
const getIo = (req) => req.app.get('io');

// ── Get wallet balance ────────────────────────────────────────────────────────
router.get('/', verifyToken, requireAnyRole(['tutor']), async (req, res) => {
  try {
    const tutor = await User.findById(req.user.id);
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
    const { page = 1, limit = 20 } = req.query;

    const payments = await Payment.find({ tutor: req.user.id, status: 'Completed' });
    for (const p of payments) {
      p.student = await User.findById(p.student);
    }

    const total = payments.length;
    const totalEarnings = payments.reduce((sum, p) => sum + (p.tutorShare || 0), 0);
    const totalCommission = payments.reduce((sum, p) => sum + (p.adminShare || 0), 0);

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

    const withdrawals = await Withdrawal.find({ tutor: req.user.id, status: 'pending' });
    if (withdrawals.length > 0) {
      return res.status(400).json({ message: 'You already have a pending withdrawal request' });
    }

    const withdrawal = await Withdrawal.create({
      tutor: req.user.id,
      amount,
      payoutMethod: payoutMethod || 'bank',
      bankDetails: tutor.bankDetails,
      upiId: tutor.upiId,
    });

    const newWallet = {
      ...tutor.wallet,
      availableBalance: tutor.wallet.availableBalance - amount,
      pendingBalance: tutor.wallet.pendingBalance + amount,
    };
    await User.findByIdAndUpdate(req.user.id, { wallet: newWallet });

    const io = getIo(req);
    emitWalletUpdate(io, req.user.id, newWallet);

    await createNotification(io, {
      recipientId: null,
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
      metadata: { withdrawalId: withdrawal.id, amount },
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
    const withdrawals = await Withdrawal.find({ tutor: req.user.id });
    const total = withdrawals.length;

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
    });

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

    const withdrawals = await Withdrawal.find(filter);
    for (const w of withdrawals) {
      w.tutor = await User.findById(w.tutor);
    }

    const total = withdrawals.length;
    const pendingWithdrawals = await Withdrawal.find({ status: 'pending' });
    const pendingCount = pendingWithdrawals.length;
    const pendingAmount = pendingWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);

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
    const wallet = { ...tutor.wallet };

    if (status === 'paid') {
      wallet.pendingBalance -= withdrawal.amount;
      wallet.paidBalance += withdrawal.amount;
      await Withdrawal.findByIdAndUpdate(req.params.id, {
        status: 'paid',
        processedAt: new Date(),
        processedBy: req.user.id,
        transactionId,
      });
    } else if (status === 'rejected') {
      wallet.pendingBalance -= withdrawal.amount;
      wallet.availableBalance += withdrawal.amount;
      await Withdrawal.findByIdAndUpdate(req.params.id, {
        status: 'rejected',
        processedAt: new Date(),
        processedBy: req.user.id,
        rejectionReason,
      });
    }

    await User.findByIdAndUpdate(tutor.id, { wallet });
    const updatedWithdrawal = await Withdrawal.findById(req.params.id);

    const io = getIo(req);
    emitWalletUpdate(io, String(withdrawal.tutor), wallet);

    await createNotification(io, {
      recipientId: withdrawal.tutor,
      title: status === 'paid' ? 'Payout Completed' : 'Payout Rejected',
      message: status === 'paid'
        ? `₹${withdrawal.amount} has been transferred to your bank account`
        : `Your withdrawal request was rejected: ${rejectionReason}`,
      type: 'payout',
      icon: status === 'paid' ? '✅' : '❌',
    });

    res.json(updatedWithdrawal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Admin: Payout summary ─────────────────────────────────────────────────────
router.get('/admin/payout-summary', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const allWithdrawals = await Withdrawal.find();
    const totalPayouts = allWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
    const paidPayouts = allWithdrawals.filter(w => w.status === 'paid').reduce((sum, w) => sum + (w.amount || 0), 0);
    const pendingWithdrawals = allWithdrawals.filter(w => w.status === 'pending');
    const pendingPayouts = pendingWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);

    res.json({
      totalPayouts,
      paidPayouts,
      pendingPayouts,
      pendingCount: pendingWithdrawals.length,
      avgPayoutDays: 1.5,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
