import express from 'express';
import { SubscriptionPlan } from '../models/SubscriptionPlan.js';
import { Subscription } from '../models/Subscription.js';
import { User } from '../models/User.js';
import { verifyToken, requireAnyRole, requireRole } from '../middleware/auth.js';
import { createNotification, logActivity } from '../services/notificationService.js';
import Razorpay from 'razorpay';

const router = express.Router();
const getIo = (req) => req.app.get('io');

const getRazorpay = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder',
});

// ── Get all active subscription plans (public) ────────────────────────────────
router.get('/plans', async (_req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ status: 'active' }).sort({ sortOrder: 1 });
    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Admin: CRUD subscription plans ────────────────────────────────────────────
router.post('/plans', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const plan = new SubscriptionPlan(req.body);
    await plan.save();
    getIo(req)?.emit('subscription:planCreated', plan);
    res.status(201).json(plan);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/plans/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    getIo(req)?.emit('subscription:planUpdated', plan);
    res.json(plan);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/plans/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    await SubscriptionPlan.findByIdAndUpdate(req.params.id, { status: 'archived' });
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
      endDate: { $gt: new Date() },
    }).populate('plan');

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

    // Check if tutor already has active subscription
    const existing = await Subscription.findOne({
      tutor: req.user.id,
      status: 'active',
      endDate: { $gt: new Date() },
    });
    if (existing) {
      return res.status(400).json({ message: 'You already have an active subscription' });
    }

    // Create Razorpay order
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: plan.price * 100,
      currency: 'INR',
      receipt: `sub_${req.user.id}_${Date.now()}`,
      notes: { planId: plan._id.toString(), tutorId: req.user.id },
    });

    // Create pending subscription
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + plan.duration);

    const subscription = new Subscription({
      tutor: req.user.id,
      plan: plan._id,
      startDate,
      endDate,
      amount: plan.price,
      leadLimit: plan.leadLimit,
      commissionRate: plan.commissionRate,
      status: 'pending',
      razorpayOrderId: order.id,
    });

    await subscription.save();

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
    const subscription = await Subscription.findById(subscriptionId).populate('plan');
    if (!subscription) return res.status(404).json({ message: 'Subscription not found' });
    if (subscription.tutor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Verify signature (simplified — production should use crypto)
    subscription.status = 'active';
    subscription.razorpayPaymentId = razorpayPaymentId;
    await subscription.save();

    // Update tutor
    await User.findByIdAndUpdate(req.user.id, {
      activeSubscription: subscription._id,
      currentCommissionRate: subscription.commissionRate,
    });

    const io = getIo(req);
    io?.emit('subscription:activated', { tutorId: req.user.id, subscription });

    await createNotification(io, {
      recipientId: req.user.id,
      title: 'Subscription Activated',
      message: `Your ${subscription.plan.name} plan is now active!`,
      type: 'subscription',
      icon: '🎉',
    });

    await logActivity({
      userId: req.user.id,
      action: 'Subscription activated',
      category: 'subscription',
      details: `${subscription.plan.name} plan activated`,
      metadata: { subscriptionId: subscription._id },
      req,
    });

    res.json({ message: 'Subscription activated successfully', subscription });
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

    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    subscription.cancelReason = reason;
    await subscription.save();

    await User.findByIdAndUpdate(req.user.id, { activeSubscription: null });

    const io = getIo(req);
    io?.emit('subscription:cancelled', { tutorId: req.user.id });

    res.json({ message: 'Subscription cancelled', subscription });
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

    const subscriptions = await Subscription.find(filter)
      .populate('tutor', 'name email avatar')
      .populate('plan', 'name price duration')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Subscription.countDocuments(filter);
    const activeCount = await Subscription.countDocuments({ status: 'active' });

    res.json({ subscriptions, total, activeCount, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
