import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';
import { Message } from '../models/Message.js';
import { requireAnyRole } from '../middleware/auth.js';
import { validateBookingPayload } from '../middleware/validation.js';
import mongoose from 'mongoose';
import { addBooking as storeAddBooking } from '../dataStore.js';

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder',
});

const ADMIN_COMMISSION = parseFloat(process.env.ADMIN_COMMISSION_PERCENT || '20') / 100;

const getIo = (req) => req.app.get('io');

// ── Create Booking Request ─────────────────────────────────────────────────────
router.post('/', requireAnyRole(['student', 'admin']), validateBookingPayload, async (req, res) => {
  try {
    const {
      tutorId, subject, grade, examType, mode,
      scheduledAt, duration, message,
      address, amount, adminRate
    } = req.body;

    let studentId = req.body.studentId;
    if (req.user.role === 'student') {
      studentId = req.user.id;
    }

    if (!studentId || !tutorId || !subject || !grade || !examType) {
      return res.status(400).json({ message: 'studentId, tutorId, subject, grade and examType are required' });
    }

    const rate = typeof adminRate === 'number' && adminRate >= 0 && adminRate <= 1
      ? adminRate
      : parseFloat(process.env.DEFAULT_ADMIN_RATE || '0.2');
    const tutorRate = 1 - rate;
    const tutorEarning = Math.round(amount * tutorRate);
    const adminCommission = Math.round(amount * rate);

    const bookingData = {
      student: studentId,
      tutor: tutorId,
      subject,
      grade,
      examType,
      mode: mode || 'Home',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      duration: duration || 60,
      message,
      address: address || {},
      amount: amount || 0,
      adminRate: rate,
      tutorRate,
      tutorEarning,
      adminCommission,
      status: 'Pending',
      paymentStatus: 'Pending',
    };

    let booking;
    if (mongoose.connection.readyState === 1) {
      booking = new Booking(bookingData);
      await booking.save();
      await booking.populate('student tutor', 'name email');
    } else {
      booking = await storeAddBooking({
        ...bookingData,
        student: { id: studentId },
        tutor: { id: tutorId },
      });
    }

    // Notify tutor and admin via socket
    getIo(req)?.emit('bookingCreated', booking);

    // Create a notification message to the tutor
    if (mongoose.connection.readyState === 1 && (booking.tutor?._id || booking.tutor?.id || booking.tutor)) {
      const tutorIdForMessage = booking.tutor?._id || booking.tutor?.id || booking.tutor;
      const studentIdForMessage = booking.student?._id || booking.student?.id || booking.student;
      await Message.create({
        from: studentIdForMessage,
        to: tutorIdForMessage,
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
router.get('/student/:studentId', requireAnyRole(['student', 'admin']), async (req, res) => {
  try {
    if (req.user.role === 'student' && req.user.id !== req.params.studentId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const bookings = await Booking.find({ student: req.params.studentId })
      .populate('tutor', 'name email avatar location subjects price rating')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Get bookings for a tutor ───────────────────────────────────────────────────
router.get('/tutor/:tutorId', requireAnyRole(['tutor', 'admin']), async (req, res) => {
  try {
    if (req.user.role === 'tutor' && req.user.id !== req.params.tutorId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const bookings = await Booking.find({ tutor: req.params.tutorId })
      .populate('student', 'name email avatar address mobile')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Update booking status ──────────────────────────────────────────────────────
router.patch('/:id/status', requireAnyRole(['tutor', 'admin']), async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id).populate('student tutor', 'name email');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (req.user.role === 'tutor' && booking.tutor._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    booking.status = status;
    await booking.save();
    getIo(req)?.emit('bookingUpdated', booking);
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Add Google Meet link to booking ───────────────────────────────────────────
router.patch('/:id/meet-link', requireAnyRole(['tutor', 'admin']), async (req, res) => {
  try {
    const { meetLink } = req.body;
    if (!meetLink) return res.status(400).json({ message: 'meetLink is required' });

    const booking = await Booking.findById(req.params.id).populate('student tutor', 'name email');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (req.user.role === 'tutor' && booking.tutor._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    booking.meetLink = meetLink;
    await booking.save();

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
router.post('/:id/payment/initiate', requireAnyRole(['student', 'admin']), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (req.user.role === 'student' && booking.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

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
router.post('/:id/payment/verify', requireAnyRole(['student', 'admin']), async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'placeholder')
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSig !== razorpaySignature) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    const booking = await Booking.findById(req.params.id).populate('student tutor', 'name email');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (req.user.role === 'student' && booking.student._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    booking.paymentStatus = 'Paid';
    booking.razorpayOrderId = razorpayOrderId;
    booking.razorpayPaymentId = razorpayPaymentId;
    await booking.save();

    await Payment.create({
      booking: booking._id,
      student: booking.student._id,
      tutor: booking.tutor._id,
      totalAmount: booking.amount,
      tutorShare: booking.tutorEarning,
      adminShare: booking.adminCommission,
      adminRate: booking.adminRate,
      tutorRate: booking.tutorRate,
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
