import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { requireAnyRole } from '../middleware/auth.js';
import { validateBookingPayload } from '../middleware/validation.js';

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder',
});

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

    if (!studentId || !subject || !grade || !examType) {
      return res.status(400).json({ message: 'studentId, subject, grade and examType are required' });
    }

    if (mode && mode !== 'Home' && mode !== 'Offline') {
       return res.status(400).json({ message: 'Only Offline/Home Tuition mode is supported.' });
    }

    // Require address for home tuition
    if (!address || (!address.full && !address.area)) {
       return res.status(400).json({ message: 'Address is required for Home Tuition.' });
    }

    const rate = typeof adminRate === 'number' && adminRate >= 0 && adminRate <= 1
      ? adminRate
      : parseFloat(process.env.DEFAULT_ADMIN_RATE || '0.2');
    const tutorRate = 1 - rate;
    const tutorEarning = Math.round((amount || 0) * tutorRate);
    const adminCommission = Math.round((amount || 0) * rate);

    const bookingData = {
      student: studentId,
      tutor: tutorId || null,
      subject,
      grade,
      examType,
      mode: 'Home',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      duration: duration || 60,
      message,
      address: address || {},
      amount: amount || 0,
      adminRate: rate,
      tutorRate,
      tutorEarning,
      adminCommission,
      status: 'Pending Admin Review',
      paymentStatus: 'Pending',
    };

    const booking = await Booking.create(bookingData);
    const studentUser = await User.findById(studentId);
    const tutorUser = await User.findById(tutorId);

    // Populate student/tutor snapshots
    booking.student = studentUser;
    booking.tutor = tutorUser;

    // Notify tutor and admin via socket
    getIo(req)?.emit('bookingCreated', booking);

    // Create a notification message to the tutor
    if (tutorId && studentUser) {
      await Message.create({
        from: studentId,
        to: tutorId,
        booking: booking.id,
        type: 'notification',
        content: `New booking request for ${subject} (${mode}) from ${studentUser.name}. Requested time: ${scheduledAt ? new Date(scheduledAt).toLocaleString('en-IN') : 'Flexible'}`,
      });
    }

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Get bookings for logged-in student ─────────────────────────────────────────
router.get('/student/me', requireAnyRole(['student', 'admin']), async (req, res) => {
  try {
    const studentId = req.user.id;
    const bookings = await Booking.find({ student: studentId });
    for (const b of bookings) {
      if (b.tutor) b.tutor = await User.findById(b.tutor);
    }
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Get bookings for a student ─────────────────────────────────────────────────
router.get('/student/:studentId', requireAnyRole(['student', 'admin']), async (req, res) => {
  try {
    if (req.user.role === 'student' && String(req.user.id) !== String(req.params.studentId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const bookings = await Booking.find({ student: req.params.studentId });
    for (const b of bookings) {
      b.tutor = await User.findById(b.tutor);
    }
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Get bookings for a tutor ───────────────────────────────────────────────────
router.get('/tutor/:tutorId', requireAnyRole(['tutor', 'admin']), async (req, res) => {
  try {
    if (req.user.role === 'tutor' && String(req.user.id) !== String(req.params.tutorId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const bookings = await Booking.find({ tutor: req.params.tutorId });
    for (const b of bookings) {
      b.student = await User.findById(b.student);
    }
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Update booking status ──────────────────────────────────────────────────────
router.patch('/:id/status', requireAnyRole(['tutor', 'admin']), async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (req.user.role === 'tutor' && String(booking.tutor) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updated = await Booking.findByIdAndUpdate(req.params.id, { status });
    updated.student = await User.findById(updated.student);
    if (updated.tutor) updated.tutor = await User.findById(updated.tutor);

    getIo(req)?.emit('bookingUpdated', updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Admin Assign Tutor ────────────────────────────────────────────────────────
router.patch('/:id/assign-tutor', requireAnyRole(['admin']), async (req, res) => {
  try {
    const { tutorId, scheduledAt } = req.body;
    if (!tutorId) return res.status(400).json({ message: 'tutorId is required' });

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const tutorUser = await User.findById(tutorId);
    if (!tutorUser) return res.status(404).json({ message: 'Tutor not found' });

    // Store tutor rates, subjects, name in snapshot
    const tutorSnapshot = {
      id: tutorUser.id,
      name: tutorUser.name,
      email: tutorUser.email,
      mobile: tutorUser.mobile,
      price: Number(tutorUser.price || 250),
      subjects: tutorUser.subjects || []
    };

    const updates = { 
      tutor: tutorId, 
      status: 'Tutor Assigned',
      tutorSnapshot,
      amount: 0 // Reset amount to 0 before admin approval
    };
    if (scheduledAt) updates.scheduledAt = new Date(scheduledAt);

    const updated = await Booking.findByIdAndUpdate(req.params.id, updates);
    updated.student = await User.findById(updated.student);
    updated.tutor = tutorUser;

    getIo(req)?.emit('bookingUpdated', updated);
    getIo(req)?.emit('bookingAssigned', updated);

    // Notify student and tutor
    await Message.create({
      from: req.user.id,
      to: updated.student.id || updated.student,
      booking: updated.id,
      type: 'notification',
      content: `A tutor (${tutorUser.name}) has been assigned to your booking for ${updated.subject}.`,
    });

    await Message.create({
      from: req.user.id,
      to: tutorUser.id,
      booking: updated.id,
      type: 'notification',
      content: `You have been assigned to a new booking for ${updated.subject}.`,
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Admin Reject Booking ──────────────────────────────────────────────────────
router.patch('/:id/reject', requireAnyRole(['admin']), async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const updated = await Booking.findByIdAndUpdate(req.params.id, {
      status: 'Rejected',
      rejectionReason: reason || 'No reason provided',
    });
    updated.student = await User.findById(updated.student);
    if (updated.tutor) updated.tutor = await User.findById(updated.tutor);

    // Notify student
    if (updated.student) {
      await Message.create({
        from: req.user.id,
        to: updated.student.id || updated.student,
        booking: updated.id,
        type: 'notification',
        content: `Your booking for ${updated.subject} has been rejected. Reason: ${reason || 'No reason provided'}`,
      });
    }

    getIo(req)?.emit('bookingUpdated', updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── QR Payment Confirmation (Admin confirms student's QR payment) ─────────────
router.post('/:id/payment/qr-confirm', requireAnyRole(['admin']), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const updated = await Booking.findByIdAndUpdate(req.params.id, {
      status: 'Payment Completed',
      paymentStatus: 'Paid',
      paymentMethod: 'QR/UPI',
    });

    // Create payment record
    await Payment.create({
      booking: updated.id,
      student: updated.student,
      tutor: updated.tutor,
      totalAmount: updated.amount,
      tutorShare: updated.tutorEarning || 0,
      adminShare: updated.adminCommission || 0,
      adminRate: updated.adminRate || 0.2,
      tutorRate: updated.tutorRate || 0.8,
      status: 'Completed',
      method: 'QR/UPI',
    });

    getIo(req)?.emit('paymentCompleted', { bookingId: updated.id });
    getIo(req)?.emit('bookingUpdated', updated);
    res.json({ message: 'Payment confirmed', booking: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Student claims QR payment ─────────────────────────────────────────────────
router.post('/:id/payment/qr-claim', requireAnyRole(['student', 'admin']), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (req.user.role === 'student' && String(booking.student) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updated = await Booking.findByIdAndUpdate(req.params.id, {
      paymentStatus: 'Claimed',
      paymentMethod: 'QR/UPI',
    });

    getIo(req)?.emit('bookingUpdated', updated);
    res.json({ message: 'Payment claim submitted. Admin will verify.', booking: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Add Google Meet link to booking ───────────────────────────────────────────
router.patch('/:id/meet-link', requireAnyRole(['tutor', 'admin']), async (req, res) => {
  try {
    const { meetLink } = req.body;
    if (!meetLink) return res.status(400).json({ message: 'meetLink is required' });

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (req.user.role === 'tutor' && String(booking.tutor) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updated = await Booking.findByIdAndUpdate(req.params.id, { meetLink });

    await Message.create({
      from: updated.tutor,
      to: updated.student,
      booking: updated.id,
      type: 'meet_link',
      content: `Your Google Meet link for ${updated.subject} class is ready! Click to join.`,
      meetUrl: meetLink,
    });

    getIo(req)?.emit('meetLinkAdded', { bookingId: updated.id, meetLink, studentId: updated.student });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Initiate Razorpay payment ──────────────────────────────────────────────────
router.post('/:id/payment/initiate', requireAnyRole(['student', 'admin']), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (req.user.role === 'student' && String(booking.student) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const order = await razorpay.orders.create({
      amount: (booking.amount || 0) * 100, // paise
      currency: 'INR',
      receipt: `booking_${booking.id}`,
      notes: {
        bookingId: String(booking.id),
        subject: booking.subject,
      },
    });

    await Booking.findByIdAndUpdate(booking.id, { razorpayOrderId: order.id });

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

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (req.user.role === 'student' && String(booking.student) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updated = await Booking.findByIdAndUpdate(req.params.id, {
      status: 'Payment Completed',
      paymentStatus: 'Paid',
      razorpayOrderId,
      razorpayPaymentId,
    });

    await Payment.create({
      booking: updated.id,
      student: updated.student,
      tutor: updated.tutor,
      totalAmount: updated.amount,
      tutorShare: updated.tutorEarning,
      adminShare: updated.adminCommission,
      adminRate: updated.adminRate,
      tutorRate: updated.tutorRate,
      status: 'Completed',
      method: 'Razorpay',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    getIo(req)?.emit('paymentCompleted', { bookingId: updated.id });

    res.json({ message: 'Payment verified successfully', booking: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
