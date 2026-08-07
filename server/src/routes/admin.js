import express from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Course } from '../models/Course.js';
import { Booking } from '../models/Booking.js';
import { Review } from '../models/Review.js';
import { Notification } from '../models/Notification.js';
import { Settings } from '../models/Settings.js';
import { Category } from '../models/Category.js';

const router = express.Router();

// Get io instance from app
const getIo = (req) => req.app.get('io');

// ── Settings ──
router.get('/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    getIo(req)?.emit('settingsUpdated', settings);
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Categories ──
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    // In a real scenario, aggregate counts from Courses and Users. For now, returning standard data.
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    getIo(req)?.emit('categoryCreated', category);
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    getIo(req)?.emit('categoryUpdated', category);
    res.json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    getIo(req)?.emit('categoryDeleted', req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Admin Stats ──
router.get('/stats', async (req, res) => {
  try {
    const [totalTutors, totalStudents, activeCourses, totalBookings, todaysBookings, pendingApprovals] = await Promise.all([
      User.countDocuments({ role: 'tutor' }),
      User.countDocuments({ role: 'student' }),
      Course.countDocuments({ status: 'active' }),
      Booking.countDocuments(),
      Booking.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) } }),
      User.countDocuments({ role: 'tutor', status: 'pending' }),
    ]);
    res.json({
      totalTutors, totalStudents, activeCourses,
      totalRevenue: 0,
      todaysBookings, pendingApprovals,
      tutorChange: '+0%', studentChange: '+0%',
      courseChange: '+0%', revenueChange: '+0%', bookingChange: '+0%',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Recent Activity ──
router.get('/recent-activity', async (req, res) => {
  try {
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(10);
    const activity = recentUsers.map(u => ({
      icon: u.role === 'tutor' ? '👨‍🏫' : u.role === 'student' ? '👨‍🎓' : '🛡️',
      text: `${u.name} joined as ${u.role}`,
      time: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : 'Recently',
    }));
    res.json(activity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Tutor Approval ──
router.patch('/tutors/:id/approve', async (req, res) => {
  try {
    const { action } = req.body;
    const status = action === 'approve' ? 'verified' : 'rejected';
    const user = await User.findByIdAndUpdate(req.params.id, { status, verified: action === 'approve' }, { new: true });
    if (!user) return res.status(404).json({ message: 'Tutor not found' });
    getIo(req)?.emit('userUpdated', user);
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Users (Students & Tutors) ──
router.get('/users', async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/users', async (req, res) => {
  try {
    const userData = { ...req.body };
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }
    const user = new User(userData);
    await user.save();
    getIo(req)?.emit('userCreated', user);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    getIo(req)?.emit('userUpdated', user);
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    getIo(req)?.emit('userDeleted', req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Courses ──
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find().populate('tutor', 'name email').sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/courses', async (req, res) => {
  try {
    const course = new Course(req.body);
    await course.save();
    getIo(req)?.emit('courseCreated', course);
    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/courses/:id', async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('tutor', 'name email');
    getIo(req)?.emit('courseUpdated', course);
    res.json(course);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/courses/:id', async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    getIo(req)?.emit('courseDeleted', req.params.id);
    res.json({ message: 'Course deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Bookings ──
router.get('/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find().populate('student tutor course').sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/bookings/:id', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('student tutor course');
    getIo(req)?.emit('bookingUpdated', booking);
    res.json(booking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
