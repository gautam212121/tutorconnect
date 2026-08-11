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
    for (const m of messages) {
      m.from = await User.findById(m.from);
      m.to = await User.findById(m.to);
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
        const partner = await User.findById(partnerId);
        msg.from = await User.findById(msg.from);
        msg.to = await User.findById(msg.to);
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
    const msg = await Message.create({
      from, to,
      booking: bookingId || undefined,
      type: type || 'text',
      content,
      meetUrl: meetUrl || undefined,
    });
    msg.from = await User.findById(from);
    msg.to = await User.findById(to);
    getIo(req)?.emit('newMessage', msg);
    res.status(201).json(msg);
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
