import express from 'express';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { requireAnyRole } from '../middleware/auth.js';

const router = express.Router();
const getIo = (req) => req.app.get('io');

// ── Get messages for a booking ──────────────────────────────────────────────
router.get('/booking/:bookingId', requireAnyRole(['student', 'tutor', 'admin']), async (req, res) => {
  try {
    const messages = await Message.find({ booking: req.params.bookingId });
    for (const m of messages) {
      m.from = await User.findById(m.from);
      m.to = await User.findById(m.to);
    }
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Get all messages between two users ────────────────────────────────────────
router.get('/conversation/:userId1/:userId2', requireAnyRole(['student', 'tutor', 'admin']), async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    if (req.user.role !== 'admin' && String(req.user.id) !== String(userId1) && String(req.user.id) !== String(userId2)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const messages = await Message.find({
      $or: [
        { from: userId1, to: userId2 },
        { from: userId2, to: userId1 },
      ]
    });

    const isTutor = req.user.role === 'tutor';
    let isPaid = true;
    if (isTutor) {
      const studentId = String(req.user.id) === String(userId1) ? userId2 : userId1;
      const Booking = (await import('../models/Booking.js')).default;
      const bookings = await Booking.find({ student: studentId, tutor: req.user.id });
      const latestBooking = bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      isPaid = latestBooking?.paymentStatus === 'Paid';
    }

    for (const m of messages) {
      let fromUser = await User.findById(m.from);
      let toUser = await User.findById(m.to);
      if (fromUser && isTutor && fromUser.role === 'student' && !isPaid) {
        fromUser = { ...fromUser, id: fromUser.id, name: 'Name Hidden (Payment Pending)', email: 'Hidden', mobile: 'Hidden', avatar: null };
      }
      if (toUser && isTutor && toUser.role === 'student' && !isPaid) {
        toUser = { ...toUser, id: toUser.id, name: 'Name Hidden (Payment Pending)', email: 'Hidden', mobile: 'Hidden', avatar: null };
      }
      m.from = fromUser;
      m.to = toUser;
    }
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Get all conversations for a user ──────────────────────────────────────────
router.get('/inbox/:userId', requireAnyRole(['student', 'tutor', 'admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user.role !== 'admin' && String(req.user.id) !== String(userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const messages = await Message.find({ from: userId });
    const received = await Message.find({ to: userId });
    const allMessages = [...messages, ...received];
    allMessages.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const conversations = {};
    for (const msg of allMessages) {
      const fromId = String(msg.from);
      const toId = String(msg.to);
      const partnerId = fromId === String(userId) ? toId : fromId;

      if (!conversations[partnerId]) {
        let partner = await User.findById(partnerId);
        if (partner && req.user.role === 'tutor' && partner.role === 'student') {
          const Booking = (await import('../models/Booking.js')).default;
          const bookings = await Booking.find({ student: partner.id, tutor: req.user.id });
          const latestBooking = bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
          const isPaid = latestBooking?.paymentStatus === 'Paid';
          if (!isPaid) {
            partner = {
              ...partner,
              id: partner.id,
              name: 'Name Hidden (Payment Pending)',
              email: 'Hidden',
              mobile: 'Hidden (Payment Pending)',
              avatar: null
            };
          }
        }

        let fromUser = await User.findById(msg.from);
        let toUser = await User.findById(msg.to);
        if (fromUser && req.user.role === 'tutor' && fromUser.role === 'student' && partner?.name?.includes('Hidden')) {
          fromUser = { ...fromUser, id: fromUser.id, name: 'Name Hidden (Payment Pending)', email: 'Hidden', mobile: 'Hidden', avatar: null };
        }
        if (toUser && req.user.role === 'tutor' && toUser.role === 'student' && partner?.name?.includes('Hidden')) {
          toUser = { ...toUser, id: toUser.id, name: 'Name Hidden (Payment Pending)', email: 'Hidden', mobile: 'Hidden', avatar: null };
        }

        msg.from = fromUser;
        msg.to = toUser;

        conversations[partnerId] = {
          partner,
          lastMessage: msg,
          unread: 0,
        };
      }
      if (!msg.read && toId === String(userId)) {
        conversations[partnerId].unread++;
      }
    }

    res.json(Object.values(conversations));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Send a message ─────────────────────────────────────────────────────────────
router.post('/', requireAnyRole(['student', 'tutor', 'admin']), async (req, res) => {
  try {
    const { from, to, bookingId, type, content, meetUrl } = req.body;
    if (req.user.role !== 'admin' && String(req.user.id) !== String(from)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const sender = await User.findById(from);
    const recipients = new Set();
    if (to) recipients.add(String(to));

    if (sender?.role === 'tutor' || sender?.role === 'student') {
      const otherParty = to && String(to) !== String(from) ? to : null;
      if (otherParty) recipients.add(String(otherParty));
      const adminUser = await User.findOne({ role: 'admin' });
      if (adminUser) recipients.add(String(adminUser._id || adminUser.id));
    }

    const createdMessages = [];
    for (const recipientId of recipients) {
      if (!recipientId || String(recipientId) === String(from)) continue;
      const msg = await Message.create({
        from, to: recipientId,
        booking: bookingId || undefined,
        type: type || 'text',
        content,
        meetUrl: meetUrl || undefined,
      });
      const populated = msg ? { ...msg } : null;
      if (populated) {
        populated.from = await User.findById(from);
        populated.to = await User.findById(recipientId);
        createdMessages.push(populated);
        getIo(req)?.emit('newMessage', populated);
      }
    }

    const primaryMessage = createdMessages[0] || {
      from: sender,
      to: to ? await User.findById(to) : null,
      content,
      type: type || 'text',
    };
    res.status(201).json(primaryMessage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Mark messages as read ──────────────────────────────────────────────────────
router.patch('/read/:userId/:partnerId', requireAnyRole(['student', 'tutor', 'admin']), async (req, res) => {
  try {
    if (req.user.role !== 'admin' && String(req.user.id) !== String(req.params.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    await Message.updateMany(
      { from: req.params.partnerId, to: req.params.userId, read: false },
      { read: true }
    );
    res.json({ message: 'Messages marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
