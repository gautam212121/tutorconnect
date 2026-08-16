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
    const tutorId = req.user.id;
    const { studentId, ...rest } = req.body;
    if (studentId === 'all') {
      const bookings = await Booking.find({ tutor: tutorId });
      const studentIds = [...new Set(bookings.map(b => String(b.student)).filter(sid => sid && sid !== 'undefined'))];
      
      const created = [];
      for (const sid of studentIds) {
        const a = await Assignment.create({ ...rest, studentId: Number(sid), tutorId });
        created.push(a);
      }
      return res.status(201).json(created[0] || { message: 'No students to assign' });
    } else {
      const assignment = await Assignment.create({ ...req.body, tutorId });
      return res.status(201).json(assignment);
    }
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
    const tutorId = req.user.id;
    const { studentId, ...rest } = req.body;
    if (studentId === 'all') {
      const bookings = await Booking.find({ tutor: tutorId });
      const studentIds = [...new Set(bookings.map(b => String(b.student)).filter(sid => sid && sid !== 'undefined'))];
      
      const created = [];
      for (const sid of studentIds) {
        const m = await StudyMaterial.create({ ...rest, studentId: Number(sid), tutorId });
        created.push(m);
      }
      return res.status(201).json(created[0] || { message: 'No students to share with' });
    } else {
      const material = await StudyMaterial.create({ ...req.body, tutorId });
      return res.status(201).json(material);
    }
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
        // Aggregate subjects from bookings
        const subjects = [...new Set(sBookings.map(b => b.subject).filter(Boolean))].join(', ');
        // Get address from user profile or latest booking
        const latestBooking = sBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        const address = s.address?.full || s.address?.area || latestBooking?.address?.full || latestBooking?.address?.area || '';
        
        const isPaid = latestBooking?.paymentStatus === 'Paid';

        students.push({
          id: s.id || s._id,
          name: isPaid ? s.name : 'Name Hidden (Payment Pending)',
          email: isPaid ? s.email : 'Hidden',
          mobile: isPaid ? s.mobile : 'Hidden (Payment Pending)',
          grade: s.grade || latestBooking?.grade || '',
          avatar: isPaid ? s.avatar : null,
          totalBookings: sBookings.length,
          lastBookingDate: sBookings.length ? new Date(Math.max(...sBookings.map(b => new Date(b.createdAt)))) : null,
          status: 'Active',
          subjects: subjects || 'General',
          address: isPaid ? address : 'Hidden',
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
    const tutorReviews = reviews.filter(r => String(r.tutor) === String(req.user.id));
    const populated = [];
    for (const r of tutorReviews) {
      const student = await User.findById(r.student);
      populated.push({
        ...r,
        studentName: student ? student.name : 'Anonymous Student'
      });
    }
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- PROFILE & SETTINGS ---
router.put('/profile', async (req, res) => {
  try {
    const allowedFields = [
      'avatar', 'bio', 'headline', 'dob', 'gender', 'grade', 'board', 'school',
      'medium', 'address', 'subjects', 'classesTaught', 'languages', 'experience',
      'price', 'priceMax', 'feeType', 'availableDays', 'availableTimeSlots',
      'mode', 'schedule', 'learningGoal', 'specialRequirements', 'budget',
      'preferredTutorGender', 'qualification', 'demoVideoUrl', 'location',
      'education', 'availability', 'bankDetails'
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    if (user && user.password) delete user.password;
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

// --- DASHBOARD ---
router.get('/dashboard', async (req, res) => {
  try {
    const tutorUser = await User.findById(req.user.id);
    if (!tutorUser) return res.status(404).json({ message: 'Tutor not found' });

    const bookings = await Booking.find({ tutor: req.user.id });
    const upcomingSessions = bookings.filter(b => ['Tutor Assigned', 'Admin Approved', 'Payment Completed'].includes(b.status));
    const completedSessions = bookings.filter(b => b.status === 'Payment Completed').length;
    
    // Get unique assigned students
    const assignedStudents = [];
    const studentIds = [...new Set(bookings.map(b => String(b.student)))];
    for (const sid of studentIds) {
      if (!sid || sid === 'undefined') continue;
      const s = await User.findById(sid);
      if (s) {
        const sBookings = bookings.filter(b => String(b.student) === String(sid));
        const subjects = [...new Set(sBookings.map(b => b.subject).filter(Boolean))];
        const latestBooking = sBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        
        const isPaid = latestBooking?.paymentStatus === 'Paid';
        assignedStudents.push({
          studentName: isPaid ? s.name : 'Name Hidden (Payment Pending)',
          selectedSubjects: subjects,
          status: latestBooking?.status || 'Active',
          classLevel: s.grade || latestBooking?.grade || '',
          location: s.address?.area || latestBooking?.address?.area || 'Home',
          schedule: latestBooking?.scheduledAt,
          contact: isPaid ? s.mobile : 'Hidden (Payment Pending)',
          amount: latestBooking?.amount || 0,
          paymentStatus: isPaid ? 'Paid' : (latestBooking?.paymentStatus || 'Pending')
        });
      }
    }

    const totalEarnings = bookings.filter(b => b.status === 'Payment Completed').reduce((sum, b) => sum + (b.tutorEarning || 0), 0);
    const freeLeadsUsed = Number(tutorUser.freeLeadsUsed || 0);
    const freeLeadsLimit = 5;
    const freeLeadsRemaining = Math.max(0, freeLeadsLimit - freeLeadsUsed);

    const hourlyRate = Number(tutorUser.price || 250);
    const monthlyRate = hourlyRate * 8;

    const dashboardData = {
      stats: {
        activeLeads: 0,
        respondedLeads: 0,
        upcomingSessions: upcomingSessions.length,
        totalEarnings: totalEarnings,
        walletBalance: totalEarnings,
        freeLeads: { used: freeLeadsUsed, limit: freeLeadsLimit, remaining: freeLeadsRemaining }
      },
      commission: {
        rate: Number(tutorUser.currentCommissionRate || 0.15),
        tier: completedSessions > 100 ? '100+ Sessions' : completedSessions > 20 ? '21 – 100 Sessions' : '0 – 20 Sessions'
      },
      leads: [],
      upcomingSessions: upcomingSessions.slice(0, 3).map(session => {
        const isPaid = session.paymentStatus === 'Paid';
        return {
          ...session,
          student: {
            name: isPaid ? (session.studentSnapshot?.name || 'Student') : 'Hidden (Payment Pending)'
          }
        };
      }),
      assignedStudents: assignedStudents,
      monthlyEarnings: [
        { month: 'Jan', earnings: 0 },
        { month: 'Feb', earnings: totalEarnings }
      ],
      recentPayouts: [],
      completedSessions: completedSessions,
      hourlyRate: hourlyRate,
      monthlyRate: monthlyRate
    };

    res.json(dashboardData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
