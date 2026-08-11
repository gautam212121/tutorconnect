import express from 'express';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import { verifyToken, requireAnyRole, requireRole } from '../middleware/auth.js';
import { createNotification, logActivity } from '../services/notificationService.js';
import Razorpay from 'razorpay';
import { execute } from '../config/db.js';

const router = express.Router();
const getIo = (req) => req.app.get('io');

const getRazorpay = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder',
});

// ── Get all active subscription plans (public) ────────────────────────────────
router.get('/plans', async (_req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ status: 'active' });
    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Admin: CRUD subscription plans ────────────────────────────────────────────
router.post('/plans', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const inserted = await SubscriptionPlan.insertMany([req.body]);
    const plan = inserted[0];
    getIo(req)?.emit('subscription:planCreated', plan);
    res.status(201).json(plan);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/plans/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    const { name, price, duration, durationLabel, leadLimit, leadLimitLabel, commissionRate, searchBoost, priorityBadge, premiumSupport, features, status, sortOrder } = req.body;
    await execute(
      'UPDATE subscription_plans SET name = COALESCE(?, name), price = COALESCE(?, price), duration = COALESCE(?, duration), durationLabel = COALESCE(?, durationLabel), leadLimit = COALESCE(?, leadLimit), leadLimitLabel = COALESCE(?, leadLimitLabel), commissionRate = COALESCE(?, commissionRate), searchBoost = COALESCE(?, searchBoost), priorityBadge = COALESCE(?, priorityBadge), premiumSupport = COALESCE(?, premiumSupport), features = COALESCE(?, features), status = COALESCE(?, status), sortOrder = COALESCE(?, sortOrder) WHERE id = ?',
      [name || null, price || null, duration || null, durationLabel || null, leadLimit || null, leadLimitLabel || null, commissionRate || null, searchBoost != null ? (searchBoost ? 1 : 0) : null, priorityBadge != null ? (priorityBadge ? 1 : 0) : null, premiumSupport != null ? (premiumSupport ? 1 : 0) : null, features ? JSON.stringify(features) : null, status || null, sortOrder || null, req.params.id]
    );
    const updated = await SubscriptionPlan.findById(req.params.id);
    getIo(req)?.emit('subscription:planUpdated', updated);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/plans/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    await execute('UPDATE subscription_plans SET status = "archived" WHERE id = ?', [req.params.id]);
    res.json({ message: 'Plan archived' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Get tutor's active subscription ───────────────────────────────────────────
router.get('/my', verifyToken, requireAnyRole(['tutor']), async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      tutor: req.user.id,
      status: 'active',
    });
    if (subscription) {
      subscription.plan = await SubscriptionPlan.findById(subscription.plan);
    }

    res.json(subscription || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Subscribe to a plan ───────────────────────────────────────────────────────
router.post('/subscribe', verifyToken, requireAnyRole(['tutor']), async (req, res) => {
  try {
    const { planId } = req.body;
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || plan.status !== 'active') {
      return res.status(404).json({ message: 'Plan not found or inactive' });
    }

    const existing = await Subscription.findOne({
      tutor: req.user.id,
      status: 'active',
    });
    if (existing) {
      return res.status(400).json({ message: 'You already have an active subscription' });
    }

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: plan.price * 100,
      currency: 'INR',
      receipt: `sub_${req.user.id}_${Date.now()}`,
      notes: { planId: String(plan.id), tutorId: String(req.user.id) },
    });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + plan.duration);

    const subscription = await Subscription.create({
      tutor: req.user.id,
      plan: plan.id,
      startDate,
      endDate,
      amount: plan.price,
      leadLimit: plan.leadLimit,
      commissionRate: plan.commissionRate,
      status: 'pending',
      razorpayOrderId: order.id,
    });

    res.json({
      subscription,
      order: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Verify subscription payment ───────────────────────────────────────────────
router.post('/verify-payment', verifyToken, requireAnyRole(['tutor']), async (req, res) => {
  try {
    const { subscriptionId, razorpayPaymentId, razorpaySignature } = req.body;
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) return res.status(404).json({ message: 'Subscription not found' });
    if (String(subscription.tutor) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updated = await Subscription.findByIdAndUpdate(subscriptionId, {
      status: 'active',
      razorpayPaymentId,
    });
    updated.plan = await SubscriptionPlan.findById(updated.plan);

    await User.findByIdAndUpdate(req.user.id, {
      activeSubscription: updated.id,
      currentCommissionRate: updated.commissionRate,
    });

    const io = getIo(req);
    io?.emit('subscription:activated', { tutorId: req.user.id, subscription: updated });

    await createNotification(io, {
      recipientId: req.user.id,
      title: 'Subscription Activated',
      message: `Your ${updated.plan ? updated.plan.name : ''} plan is now active!`,
      type: 'subscription',
      icon: '🎉',
    });

    await logActivity({
      userId: req.user.id,
      action: 'Subscription activated',
      category: 'subscription',
      details: `${updated.plan ? updated.plan.name : ''} plan activated`,
      metadata: { subscriptionId: updated.id },
      req,
    });

    res.json({ message: 'Subscription activated successfully', subscription: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Cancel subscription ───────────────────────────────────────────────────────
router.post('/cancel', verifyToken, requireAnyRole(['tutor']), async (req, res) => {
  try {
    const { reason } = req.body;
    const subscription = await Subscription.findOne({
      tutor: req.user.id,
      status: 'active',
    });
    if (!subscription) {
      return res.status(404).json({ message: 'No active subscription found' });
    }

    const updated = await Subscription.findByIdAndUpdate(subscription.id, {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelReason: reason,
    });

    await User.findByIdAndUpdate(req.user.id, { activeSubscription: null });

    const io = getIo(req);
    io?.emit('subscription:cancelled', { tutorId: req.user.id });

    res.json({ message: 'Subscription cancelled', subscription: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Admin: Get all subscriptions ──────────────────────────────────────────────
router.get('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const subscriptions = await Subscription.find(filter);
    for (const sub of subscriptions) {
      sub.tutor = await User.findById(sub.tutor);
      sub.plan = await SubscriptionPlan.findById(sub.plan);
    }

    const total = subscriptions.length;
    const activeCount = subscriptions.filter(s => s.status === 'active').length;

    res.json({ subscriptions, total, activeCount, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
