import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import Course from '../models/Course.js';
import Assignment from '../models/Assignment.js';
import StudyMaterial from '../models/StudyMaterial.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Review from '../models/Review.js';

const router = express.Router();

router.use(verifyToken, requireRole('tutor'));

// --- COURSES ---
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find({ tutor: req.user.id });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/courses', async (req, res) => {
  try {
    const course = await Course.create({ ...req.body, tutor: req.user.id });
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Since Course doesn't have an update/delete method in the model, let's just implement basic API handling that might throw if missing, but we'll stick to what we can. 
// For Assignment & Study Material, we wrote update/delete.

// --- ASSIGNMENTS ---
router.get('/assignments', async (req, res) => {
  try {
    const assignments = await Assignment.find({ tutorId: req.user.id });
    // Join course titles conceptually if needed, or send raw
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/assignments', async (req, res) => {
  try {
    const assignment = await Assignment.create({ ...req.body, tutorId: req.user.id });
    res.status(201).json(assignment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/assignments/:id', async (req, res) => {
  try {
    const assignment = await Assignment.update(req.params.id, req.body);
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/assignments/:id', async (req, res) => {
  try {
    await Assignment.delete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- STUDY MATERIALS ---
router.get('/study-materials', async (req, res) => {
  try {
    const materials = await StudyMaterial.find({ tutorId: req.user.id });
    res.json(materials);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/study-materials', async (req, res) => {
  try {
    const material = await StudyMaterial.create({ ...req.body, tutorId: req.user.id });
    res.status(201).json(material);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/study-materials/:id', async (req, res) => {
  try {
    const material = await StudyMaterial.update(req.params.id, req.body);
    res.json(material);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/study-materials/:id', async (req, res) => {
  try {
    await StudyMaterial.delete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- LIVE CLASSES ---
router.get('/live-classes', async (req, res) => {
  try {
    // Mode online bookings
    const bookings = await Booking.find({ tutor: req.user.id });
    const liveClasses = bookings.filter(b => b.mode === 'Online');
    
    // populate student
    for (const b of liveClasses) {
      if (b.student) {
        b.student = await User.findById(b.student);
      }
    }
    res.json(liveClasses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- STUDENTS ---
router.get('/students', async (req, res) => {
  try {
    const bookings = await Booking.find({ tutor: req.user.id });
    const studentIds = [...new Set(bookings.map(b => String(b.student)))];
    
    const students = [];
    for (const sid of studentIds) {
      if (!sid || sid === 'undefined') continue;
      const s = await User.findById(sid);
      if (s) {
        // Find their bookings for stats
        const sBookings = bookings.filter(b => String(b.student) === String(sid));
        students.push({
          id: s.id || s._id,
          name: s.name,
          email: s.email,
          mobile: s.mobile,
          grade: s.grade,
          avatar: s.avatar,
          totalBookings: sBookings.length,
          lastBookingDate: sBookings.length ? new Date(Math.max(...sBookings.map(b => new Date(b.createdAt)))) : null,
          status: 'Active'
        });
      }
    }
    
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- REVIEWS ---
router.get('/reviews', async (req, res) => {
  try {
    const reviews = await Review.find();
    // In db fallback we might just get all or filter manually
    const tutorReviews = reviews.filter(r => String(r.tutor) === String(req.user.id));
    res.json(tutorReviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- PROFILE & SETTINGS ---
router.put('/profile', async (req, res) => {
  try {
    const data = req.body;
    // Simple update in memory
    const user = await User.findByIdAndUpdate(req.user.id, data);
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- NOTIFICATIONS ---
router.get('/notifications', async (req, res) => {
  try {
    const { Notification } = await import('../models/Notification.js');
    const notifications = await Notification.find();
    const myNotifications = notifications.filter(n => String(n.user) === String(req.user.id));
    res.json(myNotifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
