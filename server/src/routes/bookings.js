import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';
import { Message } from '../models/Message.js';

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder',
});

const ADMIN_COMMISSION = parseFloat(process.env.ADMIN_COMMISSION_PERCENT || '20') / 100;

const getIo = (req) => req.app.get('io');

// ── Create Booking Request ─────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      studentId, tutorId, subject, mode,
      scheduledAt, duration, message,
      address, amount
    } = req.body;

    if (!studentId || !tutorId || !subject) {
      return res.status(400).json({ message: 'studentId, tutorId and subject are required' });
    }

    const tutorEarning = Math.round(amount * (1 - ADMIN_COMMISSION));
    const adminCommission = Math.round(amount * ADMIN_COMMISSION);

    const booking = new Booking({
      student: studentId,
      tutor: tutorId,
      subject,
      mode: mode || 'Home',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      duration: duration || 60,
      message,
      address: address || {},
      amount: amount || 0,
      tutorEarning,
      adminCommission,
      status: 'Pending',
      paymentStatus: 'Pending',
    });

    await booking.save();
    await booking.populate('student tutor', 'name email');

    // Notify tutor and admin via socket
    getIo(req)?.emit('bookingCreated', booking);

    // Create a notification message to the tutor
    if (booking.tutor?._id) {
      await Message.create({
        from: booking.student._id,
        to: booking.tutor._id,
        booking: booking._id,
        type: 'notification',
        content: `New booking request for ${subject} (${mode}) from ${booking.student.name}. Requested time: ${scheduledAt ? new Date(scheduledAt).toLocaleString('en-IN') : 'Flexible'}`,
      });
    }

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Get bookings for a student ─────────────────────────────────────────────────
router.get('/student/:studentId', async (req, res) => {
  try {
    const bookings = await Booking.find({ student: req.params.studentId })
      .populate('tutor', 'name email avatar location subjects price rating')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Get bookings for a tutor ───────────────────────────────────────────────────
router.get('/tutor/:tutorId', async (req, res) => {
  try {
    const bookings = await Booking.find({ tutor: req.params.tutorId })
      .populate('student', 'name email avatar address mobile')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Update booking status ──────────────────────────────────────────────────────
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate('student tutor', 'name email');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    getIo(req)?.emit('bookingUpdated', booking);
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Add Google Meet link to booking ───────────────────────────────────────────
router.patch('/:id/meet-link', async (req, res) => {
  try {
    const { meetLink } = req.body;
    if (!meetLink) return res.status(400).json({ message: 'meetLink is required' });

    const booking = await Booking.findByIdAndUpdate(
      req.params.id, { meetLink }, { new: true }
    ).populate('student tutor', 'name email');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Send meet link as a message to the student
    await Message.create({
      from: booking.tutor._id,
      to: booking.student._id,
      booking: booking._id,
      type: 'meet_link',
      content: `Your Google Meet link for ${booking.subject} class is ready! Click to join.`,
      meetUrl: meetLink,
    });

    getIo(req)?.emit('meetLinkAdded', { bookingId: booking._id, meetLink, studentId: booking.student._id });

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Initiate Razorpay payment ──────────────────────────────────────────────────
router.post('/:id/payment/initiate', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const order = await razorpay.orders.create({
      amount: booking.amount * 100, // paise
      currency: 'INR',
      receipt: `booking_${booking._id}`,
      notes: {
        bookingId: booking._id.toString(),
        subject: booking.subject,
      },
    });

    await Booking.findByIdAndUpdate(booking._id, { razorpayOrderId: order.id });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Razorpay error:', err);
    res.status(500).json({ message: 'Payment initiation failed: ' + err.message });
  }
});

// ── Verify Razorpay payment ────────────────────────────────────────────────────
router.post('/:id/payment/verify', async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'placeholder')
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSig !== razorpaySignature) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: 'Paid', razorpayOrderId, razorpayPaymentId },
      { new: true }
    ).populate('student tutor', 'name email');

    // Create Payment record
    await Payment.create({
      booking: booking._id,
      student: booking.student._id,
      tutor: booking.tutor._id,
      totalAmount: booking.amount,
      tutorShare: booking.tutorEarning,
      adminShare: booking.adminCommission,
      status: 'Completed',
      method: 'Razorpay',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    getIo(req)?.emit('paymentCompleted', { bookingId: booking._id });

    res.json({ message: 'Payment verified successfully', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
