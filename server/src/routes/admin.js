import express from 'express';
import bcrypt from 'bcryptjs';
import { execute } from '../config/db.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Booking from '../models/Booking.js';
import CallbackRequest from '../models/CallbackRequest.js';
import Review from '../models/Review.js';
import Notification from '../models/Notification.js';
import Settings from '../models/Settings.js';
import Category from '../models/Category.js';
import { upload, getUploadedImageUrl } from '../config/upload.js';

const router = express.Router();

const getIo = (req) => req.app.get('io');

// ── Settings ──
router.get('/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.findOneAndUpdate({}, {});
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/settings', upload.single('heroImageFile'), async (req, res) => {
  try {
    const payload = { ...req.body };
    if (req.file) {
      payload.heroImage = getUploadedImageUrl(req.file.filename);
    }
    const settings = await Settings.findOneAndUpdate({}, payload);
    getIo(req)?.emit('settingsUpdated', settings);
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Categories ──
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/categories', upload.single('image'), async (req, res) => {
  try {
    const payload = { ...req.body };
    if (req.file) {
      payload.image = getUploadedImageUrl(req.file.filename);
    }
    const category = await Category.create(payload);
    getIo(req)?.emit('categoryCreated', category);
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/categories/:id', upload.single('image'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    const payload = { ...req.body };
    if (req.file) {
      payload.image = getUploadedImageUrl(req.file.filename);
    }
    const { name, image, description, priority, status, type, curriculum } = payload;
    await execute(
      'UPDATE categories SET name = COALESCE(?, name), image = COALESCE(?, image), description = COALESCE(?, description), priority = COALESCE(?, priority), status = COALESCE(?, status), type = COALESCE(?, type), curriculum = COALESCE(?, curriculum) WHERE id = ?',
      [name || null, image || null, description || null, priority || null, status || null, type || null, curriculum ? JSON.stringify(curriculum) : null, req.params.id]
    );
    const updated = await Category.findById(req.params.id);
    getIo(req)?.emit('categoryUpdated', updated);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    await execute('DELETE FROM categories WHERE id = ?', [req.params.id]);
    getIo(req)?.emit('categoryDeleted', req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Admin Stats ──
router.get('/stats', async (req, res) => {
  try {
    const [totalTutors, totalStudents, activeCourses, totalBookings, pendingApprovals] = await Promise.all([
      User.countDocuments({ role: 'tutor' }),
      User.countDocuments({ role: 'student' }),
      Course.find({ status: 'active' }).then(res => res.length),
      Booking.countDocuments(),
      User.countDocuments({ role: 'tutor', status: 'pending' }),
    ]);
    res.json({
      totalTutors, totalStudents, activeCourses,
      totalRevenue: 0,
      todaysBookings: 0, pendingApprovals,
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
    const recentUsers = await User.find();
    const activity = recentUsers.slice(0, 10).map(u => ({
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
const handleTutorApprove = async (req, res) => {
  try {
    const { action } = req.body;
    const status = action === 'approve' ? 'verified' : 'rejected';
    const user = await User.findByIdAndUpdate(req.params.id, { status, verified: action === 'approve' });
    if (!user) return res.status(404).json({ message: 'Tutor not found' });
    getIo(req)?.emit('userUpdated', user);
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
router.patch('/tutors/:id/approve', handleTutorApprove);
router.put('/tutors/:id/approve', handleTutorApprove);

// ── Users (Students & Tutors) ──
router.get('/users', async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Also aggregate booking and schedule info for student/tutor if needed
    let bookings = [];
    let assignedTutors = [];
    let assignedStudents = [];
    
    if (user.role === 'student') {
      bookings = await Booking.find({ student: user._id });
      const tutorIds = [...new Set(bookings.filter(b => b.tutor).map(b => b.tutor))];
      assignedTutors = await Promise.all(tutorIds.map(id => User.findById(id)));
      assignedTutors = assignedTutors.filter(Boolean);
    } else if (user.role === 'tutor') {
      bookings = await Booking.find({ tutor: user._id });
      const studentIds = [...new Set(bookings.filter(b => b.student).map(b => b.student))];
      assignedStudents = await Promise.all(studentIds.map(id => User.findById(id)));
      assignedStudents = assignedStudents.filter(Boolean);
    }
    
    res.json({ user, bookings, assignedTutors, assignedStudents });
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
    const user = await User.create(userData);
    getIo(req)?.emit('userCreated', user);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body);
    getIo(req)?.emit('userUpdated', user);
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    getIo(req)?.emit('userDeleted', req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Courses ──
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/courses', async (req, res) => {
  try {
    const course = await Course.create(req.body);
    getIo(req)?.emit('courseCreated', course);
    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/courses/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    const { title, description, subject, classLevel, price, duration, mode, status, thumbnail } = req.body;
    await execute(
      'UPDATE courses SET title = COALESCE(?, title), description = COALESCE(?, description), subject = COALESCE(?, subject), classLevel = COALESCE(?, classLevel), price = COALESCE(?, price), duration = COALESCE(?, duration), mode = COALESCE(?, mode), status = COALESCE(?, status), thumbnail = COALESCE(?, thumbnail) WHERE id = ?',
      [title || null, description || null, subject || null, classLevel || null, price || null, duration || null, mode || null, status || null, thumbnail || null, req.params.id]
    );
    const updated = await Course.findById(req.params.id);
    getIo(req)?.emit('courseUpdated', updated);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/courses/:id', async (req, res) => {
  try {
    await execute('DELETE FROM courses WHERE id = ?', [req.params.id]);
    getIo(req)?.emit('courseDeleted', req.params.id);
    res.json({ message: 'Course deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Bookings & Consultation Callbacks ──
router.get('/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find();
    const callbacks = await CallbackRequest.find();

    // Populate student user data into each booking's studentSnapshot
    const populatedBookings = await Promise.all(bookings.map(async (b) => {
      let snapshot = b.studentSnapshot || {};

      // If name or phone is missing in snapshot, fetch from users table
      if (!snapshot.name || !snapshot.phone) {
        const studentUser = b.student ? await User.findById(b.student) : null;
        if (studentUser) {
          snapshot = {
            name: snapshot.name || studentUser.name || 'Unknown',
            phone: snapshot.phone || studentUser.mobile || 'N/A',
            email: snapshot.email || studentUser.email || '',
            grade: snapshot.grade || snapshot.classLevel || studentUser.grade || '',
            classLevel: snapshot.classLevel || snapshot.grade || studentUser.grade || '',
            subject: snapshot.subject || b.subject || '',
            location: snapshot.location || studentUser.address?.city || studentUser.address?.full || studentUser.location || '',
            mode: snapshot.mode || b.mode || 'Home',
            address: snapshot.address || studentUser.address?.full || studentUser.address?.city || '',
            role: 'student',
          };
        }
      }

      return { ...b, studentSnapshot: snapshot };
    }));

    const formattedCallbacks = (callbacks || []).map(c => ({
      _id: c._id,
      id: c._id ? c._id.toString() : c.id,
      requestType: 'consultation',
      source: 'callback-form',
      studentSnapshot: {
        name: c.name,
        phone: c.phone,
        role: c.role || 'student',
        classLevel: c.classLevel,
        grade: c.classLevel,
        subject: c.subject,
        location: c.location || 'Lucknow',
        mode: c.mode || 'Home',
      },
      subject: c.subject,
      grade: c.classLevel,
      location: c.location || 'Lucknow',
      examType: 'Free Consultation',
      mode: c.mode || 'Home',
      tutor: c.tutor,
      status: c.status || 'Pending',
      amount: 0,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      isCallback: true,
    }));

    const combined = [...populatedBookings, ...formattedCallbacks];
    combined.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    res.json(combined);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/bookings/:id', async (req, res) => {
  try {
    let booking = await Booking.findById(req.params.id);
    if (booking) {
      booking = await Booking.findByIdAndUpdate(req.params.id, req.body);
      getIo(req)?.emit('bookingUpdated', booking);
      return res.json(booking);
    }

    let callback = await CallbackRequest.findById(req.params.id);
    if (callback) {
      const updateData = {};
      if (req.body.status) updateData.status = req.body.status;
      if (req.body.tutor) updateData.tutor = req.body.tutor;

      callback = await CallbackRequest.findByIdAndUpdate(req.params.id, updateData);
      const formatted = {
        _id: callback.id,
        id: String(callback.id),
        requestType: 'consultation',
        studentSnapshot: {
          name: callback.name,
          phone: callback.phone,
          role: callback.role || 'student',
          classLevel: callback.classLevel,
          grade: callback.classLevel,
          subject: callback.subject,
          location: callback.location || 'Lucknow',
          mode: callback.mode || 'Home',
        },
        subject: callback.subject,
        grade: callback.classLevel,
        location: callback.location || 'Lucknow',
        examType: 'Free Consultation',
        mode: callback.mode || 'Home',
        tutor: callback.tutor,
        status: callback.status,
        createdAt: callback.createdAt,
        updatedAt: callback.updatedAt,
        isCallback: true,
      };
      getIo(req)?.emit('bookingUpdated', formatted);
      return res.json(formatted);
    }

    res.status(404).json({ message: 'Booking or Callback request not found' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── Callbacks Specific Endpoints ──
router.get('/callbacks', async (req, res) => {
  try {
    const callbacks = await CallbackRequest.find();
    res.json(callbacks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/callbacks/:id', async (req, res) => {
  try {
    const callback = await CallbackRequest.findByIdAndUpdate(req.params.id, req.body);
    getIo(req)?.emit('callbackUpdated', callback);
    res.json(callback);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── Payments Dashboard Data ──
router.get('/payments-data', async (req, res) => {
  try {
    // Basic stats
    const statsRow = await execute('SELECT SUM(totalAmount) as totalRevenue, SUM(tutorShare) as tutorPayouts, SUM(adminShare) as commission FROM payments WHERE status = "Completed"');
    const refundsRow = await execute('SELECT SUM(totalAmount) as totalRefunds FROM payments WHERE status = "Refunded"');
    
    // Revenue chart (last 7 days dummy or real if possible)
    const chartRows = await execute('SELECT DATE(createdAt) as date, SUM(totalAmount) as revenue FROM payments WHERE status = "Completed" GROUP BY DATE(createdAt) ORDER BY DATE(createdAt) DESC LIMIT 7');
    const revenueData = chartRows.map(r => Number(r.revenue)).reverse();
    if (revenueData.length === 0) revenueData.push(0, 0, 0, 0, 0, 0, 0); // fallback
    
    // Transactions
    const payments = await execute('SELECT p.*, s.name as studentName, t.name as tutorName FROM payments p LEFT JOIN users s ON p.student = s.id LEFT JOIN users t ON p.tutor = t.id ORDER BY p.createdAt DESC LIMIT 50');
    const transactions = payments.map(p => ({
      id: `TXN${p.id.toString().padStart(6, '0')}`,
      student: p.studentName || 'Student',
      tutor: p.tutorName || 'Tutor',
      amount: p.totalAmount,
      type: 'booking', // default for payments
      date: new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: p.status === 'Completed' ? 'paid' : p.status.toLowerCase(),
    }));

    res.json({
      stats: {
        totalRevenue: statsRow[0]?.totalRevenue || 0,
        tutorPayouts: statsRow[0]?.tutorPayouts || 0,
        commission: statsRow[0]?.commission || 0,
        refunds: refundsRow[0]?.totalRefunds || 0,
      },
      revenueData,
      transactions,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
