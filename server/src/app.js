import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import { ensureMongoConnection } from './dataStore.js';
import adminRouter from './routes/admin.js';
import authRouter from './routes/auth.js';
import bookingsRouter from './routes/bookings.js';
import messagesRouter from './routes/messages.js';

// Models
import { User } from './models/User.js';
import { Course } from './models/Course.js';
import { Booking } from './models/Booking.js';
import { Review } from './models/Review.js';
import { Notification } from './models/Notification.js';
import { Category } from './models/Category.js';
import { Career } from './models/Career.js';
import { Payment } from './models/Payment.js';
import { Message } from './models/Message.js';

dotenv.config();

const getIo = (req) => req.app.get('io');

const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
  app.use(morgan('dev'));
  app.use(express.json());

  app.use('/api/v1/admin-new', adminRouter);
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/bookings', bookingsRouter);
  app.use('/api/v1/messages', messagesRouter);

  // ── Health ──────────────────────────────────────────────────────────────────
  app.get('/health', async (_req, res) => {
    const isDbConnected = await ensureMongoConnection();
    res.json({
      status: 'ok',
      service: 'tutorconnect-server',
      database: isDbConnected ? 'connected (MongoDB)' : 'fallback (local file store)',
    });
  });

  // ── Users ───────────────────────────────────────────────────────────────────
  app.get('/api/v1/users', async (_req, res) => {
    try {
      const users = await User.find().sort({ createdAt: -1 });
      res.json(users);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });


  // ── Analytics ────────────────────────────────────────────────────────────────
  app.get('/api/v1/admin/analytics', async (_req, res) => {
    try {
      res.json({
        revenueChart: [150000, 230000, 180000, 340000, 245000, 290000, 320000],
        tutorGrowth: [200, 350, 280, 450, 380, 520, 420],
        studentGrowth: [500, 800, 650, 1050, 850, 1200, 980],
        labels: ['May 12', 'May 13', 'May 14', 'May 15', 'May 16', 'May 17', 'May 18']
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Platform Stats ───────────────────────────────────────────────────────────
  app.get('/api/v1/stats/platform', async (_req, res) => {
    try {
      const totalTutors = await User.countDocuments({ role: 'tutor', status: 'active', verified: true });
      const activeStudents = await User.countDocuments({ role: 'student', status: 'active' });
      const demoBookings = await Booking.countDocuments();
      res.json({
        totalTutors,
        activeStudents,
        verifiedInstitutes: 0,
        demoBookings,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Categories & Subjects ─────────────────────────────────────────────────────
  app.get('/api/v1/categories', async (_req, res) => {
    try {
      const categories = await Category.find({ status: 'active' }).sort({ createdAt: -1 });
      res.json(categories);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get('/api/v1/subjects', async (_req, res) => {
    try {
      const categories = await Category.find({ status: 'active' });
      const subjects = categories.map(c => ({ id: c._id, name: c.name }));
      res.json(subjects);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Featured & Search Tutors ──────────────────────────────────────────────────
  app.get('/api/v1/tutors/featured', async (_req, res) => {
    try {
      const tutors = await User.find({ role: 'tutor', verified: true, status: 'active' })
                               .sort({ rating: -1, reviews: -1 })
                               .limit(3);
      // Format tutors to match frontend expectations
      const formatted = tutors.map(t => ({
        id: t._id,
        name: t.name,
        headline: t.headline || 'Tutor',
        price: t.price || 500,
        rating: t.rating || 0,
        reviews: t.reviews || 0,
        experience: t.experience || '1 year',
        location: t.location || 'Online',
        subjects: t.subjects && t.subjects.length > 0 ? t.subjects : ['General'],
        mode: t.mode && t.mode.length > 0 ? t.mode : ['Online'],
        verified: t.verified,
        image: t.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      }));
      res.json(formatted);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get('/api/v1/tutors/search', async (req, res) => {
    try {
      const { subject, area, mode, q } = req.query;
      const searchTerm = q?.trim() || '';

      const query = { role: 'tutor', verified: true, status: 'active' };

      if (subject) {
        query.subjects = { $regex: new RegExp(subject, 'i') };
      }

      if (area) {
        query.$or = [
          { location: { $regex: new RegExp(area, 'i') } },
          { 'address.city': { $regex: new RegExp(area, 'i') } },
          { 'address.area': { $regex: new RegExp(area, 'i') } },
        ];
      }

      if (mode) {
        query.mode = { $in: [mode] };
      }

      if (searchTerm && !area) {
        query.$or = [
          { name: { $regex: searchTerm, $options: 'i' } },
          { headline: { $regex: searchTerm, $options: 'i' } },
          { location: { $regex: searchTerm, $options: 'i' } },
          { subjects: { $regex: searchTerm, $options: 'i' } },
        ];
      }

      const tutors = await User.find(query).sort({ rating: -1 });
      const formatted = tutors.map(t => ({
        id: t._id,
        name: t.name,
        headline: t.headline || 'Home Tutor',
        bio: t.bio || '',
        price: t.price || 500,
        priceMax: t.priceMax || t.price || 500,
        feeType: t.feeType || 'Hourly',
        rating: t.rating || 0,
        reviews: t.reviews || 0,
        experience: t.experience || '1 year',
        location: t.location || 'Online',
        subjects: t.subjects && t.subjects.length > 0 ? t.subjects : ['General'],
        mode: t.mode && t.mode.length > 0 ? t.mode : ['Online'],
        classesTaught: t.classesTaught || [],
        verified: t.verified,
        mobile: t.mobile,
        availableDays: t.availableDays || [],
        image: t.avatar || null,
      }));

      res.json({ tutors: formatted, count: formatted.length });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });


  app.get('/api/v1/tutors/recommended', async (_req, res) => {
    try {
      const tutors = await User.find({ role: 'tutor', verified: true, status: 'active' })
                               .sort({ createdAt: -1 })
                               .limit(3);
      const formatted = tutors.map(t => ({
        id: t._id,
        name: t.name,
        headline: t.headline || 'Tutor',
        price: t.price || 500,
        rating: t.rating || 0,
        reviews: t.reviews || 0,
        experience: t.experience || '1 year',
        location: t.location || 'Online',
        subjects: t.subjects && t.subjects.length > 0 ? t.subjects : ['General'],
        mode: t.mode && t.mode.length > 0 ? t.mode : ['Online'],
        verified: t.verified,
        image: t.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      }));
      res.json(formatted);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get('/api/v1/tutors/:id', async (req, res) => {
    try {
      const t = await User.findById(req.params.id);
      if (!t || t.role !== 'tutor') return res.status(404).json({ message: 'Tutor not found' });
      
      const formatted = {
        id: t._id,
        name: t.name,
        headline: t.headline || 'Tutor',
        price: t.price || 500,
        rating: t.rating || 0,
        reviews: t.reviews || 0,
        experience: t.experience || '1 year',
        location: t.location || 'Online',
        subjects: t.subjects && t.subjects.length > 0 ? t.subjects : ['General'],
        mode: t.mode && t.mode.length > 0 ? t.mode : ['Online'],
        verified: t.verified,
        image: t.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      };
      return res.json(formatted);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Auth ──────────────────────────────────────────────────────────────────────
  app.post('/api/v1/auth/register', async (req, res) => {
    try {
      const { 
        name, email, password, role = 'student',
        mobile, dob, gender, grade, board, school, medium,
        address, schedule
      } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email and password are required' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const existing = await User.findOne({ email: cleanEmail });
      if (existing) {
        return res.status(409).json({ message: 'An account with this email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
        name: name.trim(),
        email: cleanEmail,
        role,
        password: hashedPassword,
        mobile: mobile || '',
        dob: dob || '',
        gender: gender || '',
        grade: grade || '',
        board: board || '',
        school: school || '',
        medium: medium || '',
        address: address || { country: 'India', state: '', city: '', area: '', pincode: '' },
        schedule: schedule || { days: [], slots: [], startDate: '', classesPerWeek: 3, duration: '1 Hour' },
        status: 'active'
      });
      await user.save();

      getIo(req)?.emit('userCreated', user);

      const token = jwt.sign(
        { sub: user._id, role: user.role, email: user.email, name: user.name },
        process.env.JWT_SECRET || 'demo-secret',
        { expiresIn: '7d' }
      );
      return res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post('/api/v1/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const token = jwt.sign(
        { sub: user._id, role: user.role, email: user.email, name: user.name },
        process.env.JWT_SECRET || 'demo-secret',
        { expiresIn: '7d' }
      );
      return res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get('/api/v1/auth/me', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentication token missing' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'demo-secret');
      
      const user = await User.findById(decoded.sub);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      return res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  });

  // ── Bookings ──────────────────────────────────────────────────────────────────
  app.get('/api/v1/bookings', async (req, res) => {
    try {
      // Admin gets all, others get theirs
      const authHeader = req.headers.authorization;
      let filter = {};
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'demo-secret');
        if (decoded.role === 'student') filter = { student: decoded.sub };
        else if (decoded.role === 'tutor') filter = { tutor: decoded.sub };
      }

      const bookings = await Booking.find(filter).populate('student tutor course').sort({ createdAt: -1 });
      res.json(bookings);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post('/api/v1/bookings', async (req, res) => {
    try {
      const booking = new Booking(req.body);
      await booking.save();
      const populated = await Booking.findById(booking._id).populate('student tutor course');
      getIo(req)?.emit('bookingCreated', populated);
      res.status(201).json(populated);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

  app.patch('/api/v1/bookings/:id', async (req, res) => {
    try {
      const booking = await Booking.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }).populate('student tutor course');
      if (!booking) return res.status(404).json({ message: 'Booking not found' });
      
      getIo(req)?.emit('bookingUpdated', booking);
      return res.json(booking);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

  // ── Student Dashboard ─────────────────────────────────────────────────────────
  app.get('/api/v1/student/dashboard', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'demo-secret');
      
      const bookings = await Booking.find({ student: decoded.sub }).populate('tutor course').sort({ createdAt: -1 });
      
      res.json({
        stats: {
          totalBookings: bookings.length,
          upcoming: bookings.filter(b => b.status === 'Confirmed').length
        },
        bookings: bookings.slice(0, 5)
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Tutor Dashboard ───────────────────────────────────────────────────────────
  app.get('/api/v1/tutor/dashboard', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'demo-secret');
      
      const bookings = await Booking.find({ tutor: decoded.sub }).populate('student course').sort({ createdAt: -1 });
      
      res.json({
        metrics: {
          totalStudents: new Set(bookings.map(b => b.student._id.toString())).size,
          activeCourses: 0,
          avgRating: 0,
          monthlyEarnings: bookings.filter(b => b.status === 'Completed').reduce((acc, b) => acc + (b.amount || 0), 0),
          todayClasses: 0,
          newEnquiries: bookings.filter(b => b.status === 'Pending').length,
          profileViews: 0,
          unreadMessages: 0,
        },
        recentBookings: bookings.slice(0, 5),
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Notifications ──────────────────────────────────────────────────────────────
  app.get('/api/v1/notifications', async (req, res) => {
    try {
      const notifications = await Notification.find().sort({ createdAt: -1 }).limit(10);
      res.json(notifications);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post('/api/v1/notifications/mark-read', async (_req, res) => {
    res.json({ success: true, message: 'Notifications marked as read' });
  });

  // ── Careers ──────────────────────────────────────────────────────────────────
  app.post('/api/v1/careers', async (req, res) => {
    try {
      const {
        name, email, phone, gender, dob, address,
        education, teaching, experienceDetails, availability,
        fees, skills, documents
      } = req.body;

      if (!name || !email || !phone) {
        return res.status(400).json({ message: 'Name, email, and phone are required' });
      }
      
      const career = new Career({
        name, email, phone, gender, dob, address,
        education, teaching, experienceDetails, availability,
        fees, skills, documents
      });
      await career.save();
      res.status(201).json({ message: 'Application submitted successfully', data: career });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get('/api/v1/admin/careers', async (req, res) => {
    try {
      const careers = await Career.find().sort({ createdAt: -1 });
      res.json(careers);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch('/api/v1/admin/careers/:id', async (req, res) => {
    try {
      const { status } = req.body;
      const career = await Career.findByIdAndUpdate(req.params.id, { status }, { new: true });
      if (!career) return res.status(404).json({ message: 'Career application not found' });

      if (status === 'approved') {
        const existingUser = await User.findOne({ email: career.email });
        if (!existingUser) {
          const defaultPassword = await bcrypt.hash('tutor123', 10);
          const newUser = new User({
            name: career.name,
            email: career.email,
            password: defaultPassword,
            role: 'tutor',
            mobile: career.phone,
            qualification: career.education?.highestQualification,
            location: career.address?.city || career.address?.state || 'Online',
            subjects: career.teaching?.subjects && career.teaching.subjects.length > 0 ? career.teaching.subjects : ['General'],
            mode: career.teaching?.mode,
            price: career.fees?.hourly || 500,
            experience: career.experienceDetails?.totalExperience || '1 year',
            status: 'active',
            verified: true,
            rating: 5,
            reviews: 0
          });
          await newUser.save();
        }
      }

      res.json(career);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Error handler ────────────────────────────────────────────────────────────
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  });

  return app;
};

export { createApp };
