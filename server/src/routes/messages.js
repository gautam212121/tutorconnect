import express from 'express';
import { Message } from '../models/Message.js';
import { requireAnyRole } from '../middleware/auth.js';

const router = express.Router();
const getIo = (req) => req.app.get('io');

// ── Get messages for a booking ──────────────────────────────────────────────
router.get('/booking/:bookingId', requireAnyRole(['student', 'tutor', 'admin']), async (req, res) => {
  try {
    const messages = await Message.find({ booking: req.params.bookingId })
      .populate('from to', 'name avatar role')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Get all messages between two users ────────────────────────────────────────
router.get('/conversation/:userId1/:userId2', requireAnyRole(['student', 'tutor', 'admin']), async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    if (req.user.role !== 'admin' && req.user.id !== userId1 && req.user.id !== userId2) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const messages = await Message.find({
      $or: [
        { from: userId1, to: userId2 },
        { from: userId2, to: userId1 },
      ]
    }).populate('from to', 'name avatar role').sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Get all conversations for a user ──────────────────────────────────────────
router.get('/inbox/:userId', requireAnyRole(['student', 'tutor', 'admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const messages = await Message.find({
      $or: [{ from: userId }, { to: userId }]
    })
      .populate('from to', 'name avatar role')
      .populate('booking', 'subject mode status')
      .sort({ createdAt: -1 });

    // Group by conversation partner
    const conversations = {};
    for (const msg of messages) {
      const partnerId = msg.from._id.toString() === userId ? msg.to._id.toString() : msg.from._id.toString();
      if (!conversations[partnerId]) {
        const partner = msg.from._id.toString() === userId ? msg.to : msg.from;
        conversations[partnerId] = {
          partner,
          lastMessage: msg,
          unread: 0,
        };
      }
      if (!msg.read && msg.to._id.toString() === userId) {
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
    if (req.user.role !== 'admin' && req.user.id !== from) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const msg = await Message.create({
      from, to,
      booking: bookingId || undefined,
      type: type || 'text',
      content,
      meetUrl: meetUrl || undefined,
    });
    await msg.populate('from to', 'name avatar role');
    getIo(req)?.emit('newMessage', msg);
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Mark messages as read ──────────────────────────────────────────────────────
router.patch('/read/:userId/:partnerId', requireAnyRole(['student', 'tutor', 'admin']), async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.id !== req.params.userId) {
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
