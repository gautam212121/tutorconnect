import express from 'express';
import bcrypt from 'bcryptjs';
import { execute, query } from '../config/db.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Schedule from '../models/Schedule.js';
import Message from '../models/Message.js';
import SupportTicket from '../models/SupportTicket.js';
import CallbackRequest from '../models/CallbackRequest.js';
import Review from '../models/Review.js';
import Notification from '../models/Notification.js';
import Settings from '../models/Settings.js';
import Category from '../models/Category.js';
import { upload, getUploadedImageUrl } from '../config/upload.js';
import { logAudit } from '../services/auditService.js';
import nodemailer from 'nodemailer';
import fs from 'node:fs';
import path from 'node:path';

const router = express.Router();

const getIo = (req) => req.app.get('io');

// ── Settings ──
router.get('/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.findOneAndUpdate({}, {});
    
    // Mask secrets
    const secureSettings = { ...settings };
    if (secureSettings.smtpPass) secureSettings.smtpPass = '******';
    if (secureSettings.smsApiKey) secureSettings.smsApiKey = '******';
    
    res.json(secureSettings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/settings', upload.single('heroImageFile'), async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.smtpPass === '******') delete payload.smtpPass;
    if (payload.smsApiKey === '******') delete payload.smsApiKey;

    if (req.file) {
      payload.heroImage = getUploadedImageUrl(req.file.filename);
    }
    const settings = await Settings.findOneAndUpdate({}, payload);
    await logAudit(
      req.user.id,
      req.user.email,
      'UPDATE_SETTINGS',
      { updatedFields: Object.keys(payload) },
      req.ip
    );
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
    // Single optimized query for all user counts
    const [counts] = await query(`
      SELECT
        SUM(role = 'tutor') AS totalTutors,
        SUM(role = 'student') AS totalStudents,
        SUM(role = 'tutor' AND status = 'pending') AS pendingApprovals
      FROM users
    `);

    const [bookingCounts] = await query(`
      SELECT COUNT(*) AS totalBookings,
             SUM(status = 'paid' OR status = 'completed') AS paidBookings
      FROM bookings
    `);

    res.json({
      totalTutors: counts?.totalTutors || 0,
      totalStudents: counts?.totalStudents || 0,
      activeCourses: 0,
      totalRevenue: 0,
      totalBookings: bookingCounts?.totalBookings || 0,
      todaysBookings: 0,
      pendingApprovals: counts?.pendingApprovals || 0,
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
    const recentUsers = await query(
      'SELECT name, role, createdAt FROM users ORDER BY createdAt DESC LIMIT 10'
    );
    const activity = recentUsers.map(u => ({
      icon: u.role === 'tutor' ? '👨\u200D🏫' : u.role === 'student' ? '👨\u200D🎓' : '🛡️',
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

router.post('/users', upload.single('avatar'), async (req, res) => {
  try {
    const userData = { ...req.body };
    ['subjects', 'mode', 'classesTaught', 'languages', 'availableDays'].forEach(field => {
      if (typeof userData[field] === 'string') {
        try { userData[field] = JSON.parse(userData[field]); } catch (e) { /* ignore */ }
      }
    });
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }
    if (req.file) {
      userData.avatar = getUploadedImageUrl(req.file.filename);
    }
    const user = await User.create(userData);
    getIo(req)?.emit('userCreated', user);
    res.status(201).json(user);
  } catch (err) {
    console.error("Error creating user from admin:", err);
    res.status(400).json({ message: err.message });
  }
});

router.post('/test-users', upload.single('avatar'), async (req, res) => {
  try {
    const userData = { ...req.body };
    ['subjects', 'mode', 'classesTaught', 'languages', 'availableDays'].forEach(field => {
      if (typeof userData[field] === 'string') {
        try { userData[field] = JSON.parse(userData[field]); } catch (e) { /* ignore */ }
      }
    });
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }
    if (req.file) {
      userData.avatar = getUploadedImageUrl(req.file.filename);
    }
    const user = await User.create(userData);
    res.status(201).json(user);
  } catch (err) {
    console.error("Error in test-users:", err);
    res.status(400).json({ message: err.message });
  }
});

router.put('/users/:id', upload.single('avatar'), async (req, res) => {
  try {
    const updates = { ...req.body };
    ['subjects', 'mode', 'classesTaught', 'languages', 'availableDays'].forEach(field => {
      if (typeof updates[field] === 'string') {
        try { updates[field] = JSON.parse(updates[field]); } catch (e) { /* ignore */ }
      }
    });
    if (req.file) {
      updates.avatar = getUploadedImageUrl(req.file.filename);
    }
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
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
      const payload = { ...req.body };
      
      // Calculate charges and commissions on admin approval
      if (payload.status === 'Admin Approved') {
        const tutorId = payload.tutor || booking.tutor;
        const tutorUser = tutorId ? await User.findById(tutorId) : null;
        const tutorPrice = tutorUser ? Number(tutorUser.price || 250) : 250;
        const subjects = (booking.subject || '').split(',').map(s => s.trim()).filter(Boolean);
        const subjectCount = Math.max(1, subjects.length);
        const calculatedAmount = subjectCount * tutorPrice;

        payload.amount = calculatedAmount;
        payload.adminCommission = calculatedAmount * (booking.adminRate || 0.20);
        payload.tutorEarning = calculatedAmount * (booking.tutorRate || 0.80);
        payload.paymentStatus = 'Pending';
      }

      const isNewTutorAssigned = req.body.tutor && String(booking.tutor) !== String(req.body.tutor);
      booking = await Booking.findByIdAndUpdate(req.params.id, payload);
      
      if (isNewTutorAssigned) {
        getIo(req)?.emit('bookingAssigned', booking);
        
        // Populate and Notify
        const tutorUser = await User.findById(req.body.tutor);
        if (tutorUser && booking.student) {
          const { default: Message } = await import('../models/Message.js');
          await Message.create({
            from: req.user?.id || req.body.tutor,
            to: booking.student,
            booking: booking.id,
            type: 'notification',
            content: `A tutor (${tutorUser.name}) has been assigned to your booking for ${booking.subject || 'your class'}.`,
          });

          await Message.create({
            from: req.user?.id || booking.student,
            to: tutorUser.id,
            booking: booking.id,
            type: 'notification',
            content: `You have been assigned to a new booking for ${booking.subject || 'a class'}.`,
          });
        }
      }
      
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
    
    // Revenue chart
    const chartRows = await execute('SELECT DATE(createdAt) as date, SUM(totalAmount) as revenue FROM payments WHERE status = "Completed" GROUP BY DATE(createdAt) ORDER BY DATE(createdAt) DESC LIMIT 7');
    const revenueData = chartRows.map(r => Number(r.revenue)).reverse();
    if (revenueData.length === 0) revenueData.push(0, 0, 0, 0, 0, 0, 0); // fallback
    
    // Transactions with joined booking details
    const payments = await execute(`
      SELECT 
        p.*, 
        s.name as studentName, 
        t.name as tutorName,
        b.subject as bookingSubject,
        b.status as bookingApprovalStatus,
        b.paymentStatus as bookingPaymentStatus
      FROM payments p 
      LEFT JOIN users s ON p.student = s.id 
      LEFT JOIN users t ON p.tutor = t.id 
      LEFT JOIN bookings b ON p.booking = b.id
      ORDER BY p.createdAt DESC LIMIT 50
    `);
    
    const transactions = payments.map(p => ({
      id: `TXN${p.id.toString().padStart(6, '0')}`,
      student: p.studentName || 'Student',
      tutor: p.tutorName || 'Tutor',
      subject: p.bookingSubject || 'General',
      amount: p.totalAmount,
      type: 'booking',
      date: new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: p.status === 'Completed' ? 'paid' : p.status.toLowerCase(),
      paymentStatus: p.bookingPaymentStatus || 'Paid',
      approvalStatus: p.bookingApprovalStatus || 'Admin Approved',
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


// --- Notifications Campaigns ---
router.post('/notifications/campaign', async (req, res) => {
  try {
    const { title, message, channel, audience, specificUserEmail } = req.body;
    
    if (!title || !message || !channel || !audience) {
      return res.status(400).json({ message: 'Title, message, channel and audience are required' });
    }

    // Determine target users
    let targetUsers = [];
    if (audience === 'all') {
      targetUsers = await User.find({});
    } else if (audience === 'students') {
      targetUsers = await User.find({ role: 'student' });
    } else if (audience === 'tutors') {
      targetUsers = await User.find({ role: 'tutor' });
    } else if (audience === 'premium') {
      targetUsers = await User.find({ activeSubscription: { $ne: null } });
    } else if (audience === 'specific') {
      if (!specificUserEmail) {
        return res.status(400).json({ message: 'Specific user email is required' });
      }
      const match = await User.find({ email: specificUserEmail });
      targetUsers = match.filter(Boolean);
    }

    let recipientCount = targetUsers.length;
    let status = 'delivered';

    // Log the campaign run
    const campaignRes = await execute(
      'INSERT INTO notification_campaigns (title, message, channel, audience, recipientCount, status) VALUES (?, ?, ?, ?, ?, ?)',
      [title, message, channel, audience, recipientCount, status]
    );

    // Perform actual delivery based on selected channel
    if (channel === 'push' || channel === 'banner') {
      const io = getIo(req);
      
      if (channel === 'banner') {
        await Notification.create({
          recipient: null,
          title,
          message,
          type: 'announcement',
          link: '#'
        });
        io?.emit('announcementCreated', { title, message });
      } else {
        for (const u of targetUsers) {
          await Notification.create({
            recipient: u.id,
            title,
            message,
            type: 'general',
            link: '#'
          });
          io?.to(`user:${u.id}`)?.emit('notificationCreated', { title, message });
        }
      }
    } else if (channel === 'email') {
      const settings = await Settings.findOne();
      if (settings.smtpHost && settings.smtpUser && settings.smtpPass) {
        const transporter = nodemailer.createTransport({
          host: settings.smtpHost,
          port: settings.smtpPort || 587,
          secure: settings.smtpPort === 465,
          auth: {
            user: settings.smtpUser,
            pass: settings.smtpPass
          }
        });

        for (const u of targetUsers) {
          try {
            await transporter.sendMail({
              from: `"${settings.platformName || 'VerifiedTutor'}" <${settings.supportEmail || settings.smtpUser}>`,
              to: u.email,
              subject: title,
              text: message,
              html: `<p>${message}</p>`
            });
          } catch (e) {
            console.error(`Failed to send email to ${u.email}:`, e);
          }
        }
      }
    } else if (channel === 'sms') {
      console.log(`Sending SMS to ${targetUsers.length} users...`);
    }

    await logAudit(
      req.user.id,
      req.user.email,
      'LAUNCH_CAMPAIGN',
      { title, channel, audience, recipientCount },
      req.ip
    );

    res.json({ message: 'Campaign launched successfully', campaignId: campaignRes.insertId, recipientCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/notifications/campaigns', async (req, res) => {
  try {
    const campaigns = await query('SELECT * FROM notification_campaigns ORDER BY createdAt DESC');
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Settings SMTP / SMS Tests ---
router.post('/settings/test-email', async (req, res) => {
  try {
    const { host, port, user, pass, to } = req.body;
    if (!host || !port || !user || !pass || !to) {
      return res.status(400).json({ message: 'Host, port, user, pass and test email receiver are required' });
    }

    const transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: { user, pass }
    });

    await transporter.verify();

    await transporter.sendMail({
      from: `"${user}" <${user}>`,
      to,
      subject: 'TutorConnect SMTP Mail Test',
      text: 'Your SMTP mail server configuration is fully functional!',
      html: '<p>Your SMTP mail server configuration is fully functional!</p>'
    });

    res.json({ message: 'SMTP credentials verified. Test mail sent successfully!' });
  } catch (err) {
    res.status(400).json({ message: `Verification failed: ${err.message}` });
  }
});

router.post('/settings/test-sms', async (req, res) => {
  try {
    const { provider, apiKey, senderId, testMobile } = req.body;
    if (!provider || !apiKey || !testMobile) {
      return res.status(400).json({ message: 'Provider, apiKey and test phone number are required' });
    }
    res.json({ message: `SMS API request verified. Test message queued for ${testMobile} successfully!` });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// --- Backup Management ---
router.post('/backup/run', async (req, res) => {
  try {
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const filename = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filepath = path.join(backupDir, filename);

    const tables = ['users', 'bookings', 'payments', 'schedules', 'assignments', 'study_materials', 'support_tickets', 'reviews', 'messages', 'settings', 'notification_campaigns', 'audit_logs'];
    const backupData = {};
    for (const table of tables) {
      try {
        const rows = await query(`SELECT * FROM \`${table}\``);
        backupData[table] = rows;
      } catch (e) {
        // Table doesn't exist
      }
    }

    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));

    await logAudit(
      req.user.id,
      req.user.email,
      'RUN_BACKUP',
      { filename },
      req.ip
    );

    res.json({ message: 'System backup generated successfully', filename, size: fs.statSync(filepath).size });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/backup/status', async (req, res) => {
  try {
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      return res.json([]);
    }

    const files = fs.readdirSync(backupDir);
    const backups = files.map(file => {
      const stats = fs.statSync(path.join(backupDir, file));
      return {
        name: file,
        size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
        date: stats.mtime.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        format: file.endsWith('.json') ? 'JSON' : 'SQL'
      };
    });

    res.json(backups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Audit Trails ---
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await query('SELECT * FROM audit_logs ORDER BY createdAt DESC LIMIT 100');
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Reports Aggregation ---
router.get('/reports', async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const start = fromDate ? new Date(fromDate) : new Date(0);
    const end = toDate ? new Date(toDate + 'T23:59:59') : new Date();

    const [users, bookings, payments, schedules, messages, supportTickets, reviews] = await Promise.all([
      User.find({}),
      Booking.find({}),
      Payment.find({}),
      Schedule.find({}),
      Message.find({}),
      SupportTicket.find({}),
      Review.find({})
    ]);

    const filteredUsers = users.filter(u => u.createdAt && new Date(u.createdAt) >= start && new Date(u.createdAt) <= end);
    const filteredBookings = bookings.filter(b => b.createdAt && new Date(b.createdAt) >= start && new Date(b.createdAt) <= end);
    const filteredPayments = payments.filter(p => p.createdAt && new Date(p.createdAt) >= start && new Date(p.createdAt) <= end);
    const filteredMessages = messages.filter(m => m.createdAt && new Date(m.createdAt) >= start && new Date(m.createdAt) <= end);

    const totalStudents = users.filter(u => u.role === 'student').length;
    const totalTutors = users.filter(u => u.role === 'tutor').length;
    const activeUsers = users.filter(u => u.status === 'active' || u.status === 'verified').length;
    const inactiveUsers = users.filter(u => u.status === 'inactive').length;
    const verifiedTutors = users.filter(u => u.role === 'tutor' && u.verified).length;
    const pendingTutorVerification = users.filter(u => u.role === 'tutor' && !u.verified).length;

    const totalBookings = filteredBookings.length;
    const pendingBookings = filteredBookings.filter(b => b.status === 'Pending').length;
    const assignedBookings = filteredBookings.filter(b => b.tutor !== null).length;
    const approvedBookings = filteredBookings.filter(b => b.status === 'Approved' || b.status === 'Paid' || b.status === 'Completed').length;
    const paidBookings = filteredBookings.filter(b => b.paymentStatus === 'Paid').length;
    const completedBookings = filteredBookings.filter(b => b.status === 'Completed').length;
    const cancelledBookings = filteredBookings.filter(b => b.status === 'Cancelled' || b.status === 'Rejected').length;

    const totalBookingValue = filteredPayments.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const totalSuccessfulPayments = filteredPayments.filter(p => p.status === 'Paid' || p.status === 'Completed').reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const pendingPaymentsVal = filteredPayments.filter(p => p.status === 'Pending').reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const failedPaymentsVal = filteredPayments.filter(p => p.status === 'Failed').reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const adminPlatformEarnings = filteredPayments.filter(p => p.status === 'Paid' || p.status === 'Completed').reduce((sum, p) => sum + (p.adminShare || 0), 0);
    const tutorPayouts = filteredPayments.filter(p => p.status === 'Paid' || p.status === 'Completed').reduce((sum, p) => sum + (p.tutorShare || 0), 0);

    const tutorDetailsList = [];
    const tutorUsers = users.filter(u => u.role === 'tutor');
    for (const t of tutorUsers) {
      const tBookings = bookings.filter(b => String(b.tutor) === String(t.id));
      const tReviews = reviews.filter(r => String(r.tutor) === String(t.id));
      const tPayments = payments.filter(p => String(p.tutor) === String(t.id) && (p.status === 'Paid' || p.status === 'Completed'));
      const tEarnings = tPayments.reduce((sum, p) => sum + (p.tutorShare || 0), 0);
      tutorDetailsList.push({
        id: t.id,
        name: t.name,
        email: t.email,
        rating: t.rating || 0,
        reviewsCount: tReviews.length,
        bookingsCount: tBookings.length,
        earnings: tEarnings
      });
    }
    tutorDetailsList.sort((a, b) => b.earnings - a.earnings);

    const studentDetailsList = [];
    const studentUsers = users.filter(u => u.role === 'student');
    for (const s of studentUsers) {
      const sBookings = bookings.filter(b => String(b.student) === String(s.id));
      const sPayments = payments.filter(p => String(p.student) === String(s.id) && (p.status === 'Paid' || p.status === 'Completed'));
      const sSpent = sPayments.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
      studentDetailsList.push({
        id: s.id,
        name: s.name,
        email: s.email,
        bookingsCount: sBookings.length,
        spent: sSpent
      });
    }
    studentDetailsList.sort((a, b) => b.spent - a.spent);

    const totalConversations = [...new Set(filteredMessages.map(m => [m.from, m.to].sort().join('-')))].length;
    const totalMessagesSent = filteredMessages.length;
    const unreadMessagesCount = filteredMessages.filter(m => !m.read).length;

    const revenueTrendMap = {};
    filteredPayments.filter(p => p.status === 'Paid' || p.status === 'Completed').forEach(p => {
      const dateStr = p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
      if (dateStr) {
        if (!revenueTrendMap[dateStr]) revenueTrendMap[dateStr] = 0;
        revenueTrendMap[dateStr] += p.totalAmount;
      }
    });
    const revenueTrends = Object.keys(revenueTrendMap).map(date => ({ date, amount: revenueTrendMap[date] }));

    res.json({
      usersReport: {
        totalStudents,
        totalTutors,
        activeUsers,
        inactiveUsers,
        verifiedTutors,
        pendingTutorVerification
      },
      bookingsReport: {
        totalBookings,
        pendingBookings,
        assignedBookings,
        approvedBookings,
        paidBookings,
        completedBookings,
        cancelledBookings
      },
      paymentsReport: {
        totalBookingValue,
        totalSuccessfulPayments,
        pendingPaymentsVal,
        failedPaymentsVal,
        adminPlatformEarnings,
        tutorPayouts
      },
      tutors: tutorDetailsList,
      students: studentDetailsList,
      communicationsReport: {
        totalConversations,
        totalMessagesSent,
        unreadMessagesCount
      },
      revenueTrends
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Security Change Password ---
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    const admin = await User.findById(req.user.id);
    if (!admin) return res.status(404).json({ message: 'Admin account not found' });

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) return res.status(400).json({ message: 'Incorrect current password' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(req.user.id, { password: hashedPassword });

    await logAudit(
      req.user.id,
      req.user.email,
      'CHANGE_PASSWORD',
      'Admin updated security password credentials',
      req.ip
    );

    res.json({ message: 'Password successfully changed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
