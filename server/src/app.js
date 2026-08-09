import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';

import { ensureMongoConnection } from './dataStore.js';
import { createUser as storeCreateUser, findUserByEmail as storeFindUserByEmail, addBooking as storeAddBooking, getBookings as storeGetBookings } from './dataStore.js';
import { verifyToken, optionalAuth, requireRole, requireAnyRole } from './middleware/auth.js';

// Route imports
import adminRouter from './routes/admin.js';
import authRouter from './routes/auth.js';
import bookingsRouter from './routes/bookings.js';
import messagesRouter from './routes/messages.js';
import publicRouter from './routes/public.js';
import leadsRouter from './routes/leads.js';
import subscriptionsRouter from './routes/subscriptions.js';
import walletRouter from './routes/wallet.js';
import platformConfigRouter from './routes/platformConfig.js';

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
import { Lead } from './models/Lead.js';
import { Subscription } from './models/Subscription.js';
import { Withdrawal } from './models/Withdrawal.js';
import { PlatformConfig } from './models/PlatformConfig.js';

dotenv.config();

const getIo = (req) => req.app.get('io');
const getJwtSecret = () => process.env.JWT_SECRET || 'tutorconnect-dev-secret';
const hasMongoConnection = () => mongoose.connection.readyState === 1;

const createApp = () => {
  const app = express();

  const getMailer = () => {
    if (globalThis.__tutorsMailTransport) {
      return globalThis.__tutorsMailTransport;
    }
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
    return null;
  };

  // ── Security & Middleware ────────────────────────────────────────────────────
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  }));
  app.use(morgan('dev'));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ── API Routes ──────────────────────────────────────────────────────────────
  // Admin routes
  app.use('/api/v1/admin-new', verifyToken, requireRole('admin'), adminRouter);
  app.use('/api/v1/admin', verifyToken, requireRole('admin'), adminRouter);

  // Auth routes
  app.use('/api/v1/auth', authRouter);

  // Protected routes
  app.use('/api/v1/bookings', verifyToken, bookingsRouter);
  app.use('/api/v1/messages', verifyToken, messagesRouter);
  app.use('/api/v1/leads', leadsRouter); // has its own auth per-route
  app.use('/api/v1/subscriptions', subscriptionsRouter); // has its own auth per-route
  app.use('/api/v1/wallet', walletRouter); // has its own auth per-route

  // Public routes
  app.use('/api/v1', publicRouter);
  app.use('/api/v1/config', platformConfigRouter);

  // ── Health ──────────────────────────────────────────────────────────────────
  app.get('/health', async (_req, res) => {
    const isDbConnected = await ensureMongoConnection();
    res.json({
      status: 'ok',
      service: 'tutorconnect-server',
      database: isDbConnected ? 'connected (MongoDB)' : 'fallback (local file store)',
      timestamp: new Date().toISOString(),
    });
  });

  // ── Users (Admin) ──────────────────────────────────────────────────────────
  app.get('/api/v1/users', verifyToken, requireRole('admin'), async (_req, res) => {
    try {
      const users = await User.find().sort({ createdAt: -1 });
      res.json(users);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Analytics ──────────────────────────────────────────────────────────────
  app.get('/api/v1/admin/analytics', verifyToken, requireRole('admin'), async (_req, res) => {
    try {
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      // Revenue this month
      const revenueThisMonth = await Payment.aggregate([
        { $match: { status: 'Completed', createdAt: { $gte: thisMonth } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, commission: { $sum: '$adminShare' } } },
      ]);

      // Count stats
      const [totalTutors, totalStudents, totalBookings, leadsThisMonth, activeSubscriptions] = await Promise.all([
        User.countDocuments({ role: 'tutor' }),
        User.countDocuments({ role: 'student' }),
        Booking.countDocuments(),
        Lead.countDocuments({ createdAt: { $gte: thisMonth } }),
        Subscription.countDocuments({ status: 'active' }),
      ]);

      // Daily revenue for chart (last 7 days)
      const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
      const dailyRevenue = await Payment.aggregate([
        { $match: { status: 'Completed', createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%b %d', date: '$createdAt' } },
            revenue: { $sum: '$totalAmount' },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      res.json({
        revenue: revenueThisMonth[0]?.total || 0,
        commission: revenueThisMonth[0]?.commission || 0,
        totalTutors,
        totalStudents,
        totalBookings,
        leadsThisMonth,
        activeSubscriptions,
        revenueChart: dailyRevenue.map(d => d.revenue),
        labels: dailyRevenue.map(d => d._id),
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Admin Monetization Dashboard Stats ─────────────────────────────────────
  app.get('/api/v1/admin/monetization', verifyToken, requireRole('admin'), async (_req, res) => {
    try {
      const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);

      const [
        totalTutors, totalTutorsLastMonth,
        activeSubscriptions, activeSubscriptionsLastMonth,
        leadsThisMonth, leadsLastMonth,
        commissionThisMonth, commissionLastMonth,
        pendingPayouts,
      ] = await Promise.all([
        User.countDocuments({ role: 'tutor' }),
        User.countDocuments({ role: 'tutor', createdAt: { $lt: thisMonth } }),
        Subscription.countDocuments({ status: 'active' }),
        Subscription.countDocuments({ status: 'active', createdAt: { $lt: thisMonth } }),
        Lead.countDocuments({ createdAt: { $gte: thisMonth } }),
        Lead.countDocuments({ createdAt: { $gte: lastMonth, $lt: thisMonth } }),
        Payment.aggregate([
          { $match: { status: 'Completed', createdAt: { $gte: thisMonth } } },
          { $group: { _id: null, total: { $sum: '$adminShare' } } },
        ]),
        Payment.aggregate([
          { $match: { status: 'Completed', createdAt: { $gte: lastMonth, $lt: thisMonth } } },
          { $group: { _id: null, total: { $sum: '$adminShare' } } },
        ]),
        Withdrawal.aggregate([
          { $match: { status: 'pending' } },
          { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ]),
      ]);

      const calcGrowth = (current, prev) => {
        if (prev === 0) return current > 0 ? '+100%' : '0%';
        const pct = ((current - prev) / prev * 100).toFixed(1);
        return pct >= 0 ? `+${pct}%` : `${pct}%`;
      };

      res.json({
        totalTutors,
        tutorGrowth: calcGrowth(totalTutors, totalTutorsLastMonth),
        activeSubscriptions,
        subscriptionGrowth: calcGrowth(activeSubscriptions, activeSubscriptionsLastMonth),
        leadsThisMonth,
        leadsGrowth: calcGrowth(leadsThisMonth, leadsLastMonth),
        commissionCollected: commissionThisMonth[0]?.total || 0,
        commissionGrowth: calcGrowth(commissionThisMonth[0]?.total || 0, commissionLastMonth[0]?.total || 0),
        pendingPayouts: pendingPayouts[0]?.total || 0,
        pendingPayoutCount: pendingPayouts[0]?.count || 0,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Tutors (Public) ─────────────────────────────────────────────────────────
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
        image: t.avatar || null,
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

      // Get reviews
      const reviews = await Review.find({ tutor: t._id, status: 'visible' })
        .populate('student', 'name avatar')
        .sort({ createdAt: -1 })
        .limit(10);

      const formatted = {
        id: t._id,
        name: t.name,
        headline: t.headline || 'Tutor',
        bio: t.bio || '',
        price: t.price || 500,
        priceMax: t.priceMax || t.price || 500,
        feeType: t.feeType || 'Hourly',
        rating: t.rating || 0,
        reviews: t.reviews || 0,
        experience: t.experience || '1 year',
        location: t.location || 'Online',
        subjects: t.subjects && t.subjects.length > 0 ? t.subjects : ['General'],
        classesTaught: t.classesTaught || [],
        mode: t.mode && t.mode.length > 0 ? t.mode : ['Online'],
        languages: t.languages || [],
        qualification: t.qualification || '',
        verified: t.verified,
        idVerified: t.idVerified,
        addressVerified: t.addressVerified,
        experienceVerified: t.experienceVerified,
        referenceVerified: t.referenceVerified,
        availableDays: t.availableDays || [],
        availableTimeSlots: t.availableTimeSlots || '',
        image: t.avatar || null,
        demoVideoUrl: t.demoVideoUrl || null,
        completedSessions: t.completedSessions || 0,
        reviewsList: reviews,
      };
      return res.json(formatted);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Auth (keeping existing inline routes for backwards compatibility) ───────
  app.post('/api/v1/auth/register', async (req, res) => {
    try {
      const {
        name, email, password,
        mobile, dob, gender, grade, board, school, medium,
        address, schedule
      } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email and password are required' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const mongoReady = hasMongoConnection();
      const existing = mongoReady
        ? await User.findOne({ email: cleanEmail })
        : await storeFindUserByEmail(cleanEmail);
      if (existing) {
        return res.status(409).json({ message: 'An account with this email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate referral code
      const referralCode = `TC${name.substring(0, 2).toUpperCase()}${Date.now().toString(36).toUpperCase()}`;

      const userPayload = {
        name: name.trim(),
        email: cleanEmail,
        role: req.body.role || 'student',
        password: hashedPassword,
        mobile: mobile || '',
        dob: dob || '',
        gender: gender || '',
        grade: grade || '',
        board: board || '',
        school: school || '',
        medium: medium || '',
        address: address || { city: '', area: '', pincode: '', state: '' },
        schedule: schedule || { days: [], slots: [], startDate: '', classesPerWeek: 3, duration: '1 Hour' },
        status: 'active',
        referralCode,
      };

      const user = mongoReady ? new User(userPayload) : await storeCreateUser(userPayload);
      if (mongoReady) {
        await user.save();
      }

      getIo(req)?.emit('userCreated', user);

      const token = jwt.sign(
        { sub: user._id || user.id, role: user.role, email: user.email, name: user.name },
        getJwtSecret(),
        { expiresIn: '7d' }
      );

      // Send Welcome Email
      try {
        const mailer = getMailer();
        if (mailer && process.env.SMTP_USER) {
          await mailer.sendMail({
            from: `"TutorConnect" <${process.env.SMTP_USER}>`,
            to: cleanEmail,
            subject: 'Welcome to TutorConnect!',
            html: `
              <div style="font-family: sans-serif; max-width: 560px; margin: auto; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0; background: #fff;">
                <h2 style="color: #056852; margin-bottom: 8px;">Welcome to TutorConnect, ${name}!</h2>
                <p>Your account has been created successfully.</p>
                <p><strong>Login ID (Email):</strong> ${cleanEmail}</p>
                <p><strong>Account Type:</strong> ${user.role.toUpperCase()}</p>
                <p>You can sign in to your dashboard at <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}">TutorConnect</a>.</p>
              </div>
            `,
          });
        }
      } catch (mailErr) {
        console.error('Welcome email failed to send:', mailErr);
      }

      return res.status(201).json({ token, user: { id: user._id || user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post('/api/v1/auth/student-register', async (req, res) => {
    try {
      const { name, phone, email, grade, address } = req.body;
      if (!name || !phone || !email) {
        return res.status(400).json({ message: 'Name, phone and email are required' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const mongoReady = hasMongoConnection();
      const existing = mongoReady
        ? await User.findOne({ email: cleanEmail })
        : await storeFindUserByEmail(cleanEmail);
      if (existing) {
        return res.status(409).json({ message: 'An account with this email already exists' });
      }

      const tempPassword = `${name.replace(/\s+/g, '').toLowerCase()}@${Math.floor(1000 + Math.random() * 9000)}`;
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      const referralCode = `TC${name.substring(0, 2).toUpperCase()}${Date.now().toString(36).toUpperCase()}`;

      const userPayload = {
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        role: 'student',
        mobile: phone || '',
        grade: grade || '',
        address: {
          city: address || '',
          area: '',
          pincode: '',
          state: '',
          full: address || '',
        },
        status: 'pending',
        referralCode,
        emailVerified: false,
      };

      const user = mongoReady ? new User(userPayload) : await storeCreateUser(userPayload);
      if (mongoReady) {
        await user.save();
        await Booking.create({
          requestType: 'registration',
          source: 'student-registration',
          student: user._id,
          studentSnapshot: {
            name: user.name,
            phone: user.mobile,
            email: user.email,
            grade: user.grade,
            address: typeof address === 'string' ? address : user.address?.full || '',
          },
          subject: grade || 'Student Registration',
          grade: grade || '',
          examType: 'New Student Registration',
          mode: 'Home',
          duration: 0,
          message: `New student registration from ${name}`,
          amount: 0,
          status: 'Pending',
          paymentStatus: 'Pending',
        });
      } else {
        await storeAddBooking({
          requestType: 'registration',
          source: 'student-registration',
          student: { id: user.id, name: user.name, email: user.email },
          studentSnapshot: {
            name: user.name,
            phone: user.mobile,
            email: user.email,
            grade: user.grade,
            address: typeof address === 'string' ? address : user.address?.full || '',
          },
          subject: grade || 'Student Registration',
          grade: grade || '',
          examType: 'New Student Registration',
          mode: 'Home',
          duration: 0,
          message: `New student registration from ${name}`,
          amount: 0,
          status: 'Pending',
          paymentStatus: 'Pending',
        });
      }

      getIo(req)?.emit('userCreated', user);

      try {
        const mailer = getMailer();
        if (mailer && process.env.SMTP_USER) {
          await mailer.sendMail({
            from: `"TutorConnect" <${process.env.SMTP_USER}>`,
            to: cleanEmail,
            subject: 'TutorConnect — Your Student Portal Login Credentials',
            html: `
              <div style="font-family: sans-serif; max-width: 560px; margin: auto; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0; background: #fff;">
                <h2 style="color: #056852; margin-bottom: 8px;">Welcome to TutorConnect</h2>
                <p>Your student account has been created successfully.</p>
                <p><strong>Email:</strong> ${cleanEmail}</p>
                <p><strong>Password:</strong> ${tempPassword}</p>
                <p>You can sign in at <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}">TutorConnect</a>.</p>
              </div>
            `,
          });
        }
      } catch (mailErr) {
        console.error('Student registration credentials email failed to send:', mailErr);
      }

      return res.status(201).json({
        success: true,
        message: 'Student registered successfully. Login credentials have been prepared.',
        tempPassword,
        user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status },
      });
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
      const mongoReady = hasMongoConnection();
      const user = mongoReady ? await User.findOne({ email: cleanEmail }) : await storeFindUserByEmail(cleanEmail);
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      if (user.status === 'blocked') {
        return res.status(403).json({ message: 'Your account has been blocked. Contact support.' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Update last login
      user.lastLoginAt = new Date();
      user.isOnline = true;
      await user.save();

      const token = jwt.sign(
        { sub: user._id, role: user.role, email: user.email, name: user.name },
        getJwtSecret(),
        { expiresIn: '7d' }
      );
      return res.json({
        token,
        user: {
          id: user._id, name: user.name, email: user.email,
          role: user.role, avatar: user.avatar,
          grade: user.grade, board: user.board,
        },
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get('/api/v1/auth/me', verifyToken, async (req, res) => {
    try {
      const user = await User.findById(req.user.id)
        .select('-password')
        .populate('activeSubscription');
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      return res.json({ user });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

  // ── Student Dashboard ─────────────────────────────────────────────────────
  app.get('/api/v1/student/dashboard', verifyToken, requireRole('student'), async (req, res) => {
    try {
      const userId = req.user.id;
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      if (mongoose.connection.readyState !== 1) {
        const bookings = await storeGetBookings();
        const recentBookings = bookings.filter((booking) => {
          const bookingStudentId = booking.student?.id || booking.student?._id || booking.student;
          return String(bookingStudentId) === String(userId);
        });

        return res.json({
          stats: {
            upcomingSessions: 0,
            activeTutors: 0,
            totalSpent: 0,
            totalReviews: 0,
            unreadMessages: 0,
          },
          upcomingSessions: [],
          recentBookings: recentBookings.slice(0, 5),
          subjects: recentBookings.reduce((acc, booking) => {
            if (!booking.subject) return acc;
            const existing = acc.find((item) => item.name === booking.subject);
            if (existing) {
              existing.tutorCount += booking.tutor ? 1 : 0;
            } else {
              acc.push({ name: booking.subject, tutorCount: booking.tutor ? 1 : 0 });
            }
            return acc;
          }, []),
        });
      }

      const [bookings, reviews, unreadMessages, payments] = await Promise.all([
        Booking.find({ student: userId }).populate('tutor', 'name avatar subjects rating location').sort({ createdAt: -1 }),
        Review.countDocuments({ student: userId }),
        Message.countDocuments({ to: userId, read: false }),
        Payment.aggregate([
          { $match: { student: userId, status: 'Completed', createdAt: { $gte: thisMonth } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]),
      ]);

      const upcomingSessions = bookings.filter(b => b.status === 'Confirmed' && b.scheduledAt && new Date(b.scheduledAt) > now);
      const activeTutors = [...new Set(bookings.filter(b => b.status === 'Confirmed').map(b => b.tutor?._id?.toString()))];
      const subjects = [...new Set(bookings.map(b => b.subject).filter(Boolean))];

      res.json({
        stats: {
          upcomingSessions: upcomingSessions.length,
          activeTutors: activeTutors.length,
          totalSpent: payments[0]?.total || 0,
          totalReviews: reviews,
          unreadMessages,
        },
        upcomingSessions: upcomingSessions.slice(0, 5),
        recentBookings: bookings.slice(0, 5),
        subjects: subjects.map(s => {
          const tutorCount = bookings.filter(b => b.subject === s && b.tutor).length;
          return { name: s, tutorCount };
        }),
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Tutor Dashboard ────────────────────────────────────────────────────────
  app.get('/api/v1/tutor/dashboard', verifyToken, requireRole('tutor'), async (req, res) => {
    try {
      const userId = req.user.id;
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisWeek = new Date(now - 7 * 24 * 60 * 60 * 1000);

      const tutor = await User.findById(userId).populate('activeSubscription');
      const { checkFreeLeadsAvailable, calculateCommissionRate } = await import('./services/commissionService.js');

      const [bookings, leads, earningsData, freeLeads, commissionInfo, unreadMessages] = await Promise.all([
        Booking.find({ tutor: userId }).populate('student', 'name avatar address grade').sort({ scheduledAt: -1 }),
        Lead.find({ tutor: userId }).populate('student', 'name avatar grade board subjects').sort({ createdAt: -1 }).limit(10),
        Payment.aggregate([
          { $match: { tutor: userId, status: 'Completed', createdAt: { $gte: thisMonth } } },
          { $group: { _id: null, total: { $sum: '$tutorShare' }, commission: { $sum: '$adminShare' }, gross: { $sum: '$totalAmount' } } },
        ]),
        checkFreeLeadsAvailable(userId),
        calculateCommissionRate(userId),
        Message.countDocuments({ to: userId, read: false }),
      ]);

      const upcomingSessions = bookings.filter(b => b.status === 'Confirmed' && b.scheduledAt && new Date(b.scheduledAt) > now);
      const activeLeads = leads.filter(l => ['new', 'contacted', 'responded'].includes(l.status));

      // Monthly earnings for chart (last 6 months)
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      const monthlyEarnings = await Payment.aggregate([
        { $match: { tutor: userId, status: 'Completed', createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%d %b', date: '$createdAt' } },
            earnings: { $sum: '$tutorShare' },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Recent payouts
      const { Withdrawal } = await import('./models/Withdrawal.js');
      const recentPayouts = await Withdrawal.find({ tutor: userId })
        .sort({ createdAt: -1 })
        .limit(3);

      res.json({
        stats: {
          freeLeads,
          activeLeads: activeLeads.length,
          respondedLeads: leads.filter(l => l.status === 'responded').length,
          upcomingSessions: upcomingSessions.filter(b => new Date(b.scheduledAt) < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)).length,
          totalEarnings: earningsData[0]?.total || 0,
          totalCommission: earningsData[0]?.commission || 0,
          grossEarnings: earningsData[0]?.gross || 0,
          walletBalance: tutor.wallet?.availableBalance || 0,
          unreadMessages,
        },
        commission: commissionInfo,
        upcomingSessions: upcomingSessions.slice(0, 5),
        leads: leads.slice(0, 10),
        monthlyEarnings,
        recentPayouts,
        completedSessions: tutor.completedSessions || 0,
        averageRating: tutor.rating || 0,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Notifications ──────────────────────────────────────────────────────────
  app.get('/api/v1/notifications', verifyToken, async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const notifications = await Notification.find({
        $or: [{ recipient: req.user.id }, { recipient: null }],
      })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const unreadCount = await Notification.countDocuments({
        $or: [{ recipient: req.user.id }, { recipient: null }],
        read: false,
      });

      res.json({ notifications, unreadCount });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post('/api/v1/notifications/mark-read', verifyToken, async (req, res) => {
    try {
      await Notification.updateMany(
        { $or: [{ recipient: req.user.id }, { recipient: null }], read: false },
        { read: true, readAt: new Date() }
      );
      res.json({ success: true, message: 'Notifications marked as read' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Careers ──────────────────────────────────────────────────────────────────
  app.post('/api/v1/careers', async (req, res) => {
    try {
      const {
        name, email, password, phone, gender, dob, address,
        education, teaching, experienceDetails, availability,
        fees, skills, documents
      } = req.body;

      if (!name || !email || !phone) {
        return res.status(400).json({ message: 'Name, email, and phone are required' });
      }

      let hashedPassword = undefined;
      if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }

      const career = new Career({
        name, email, password: hashedPassword, phone, gender, dob, address,
        education, teaching, experienceDetails, availability,
        fees, skills, documents
      });
      await career.save();

      getIo(req)?.emit('careerSubmitted', career);

      res.status(201).json({ message: 'Application submitted successfully', data: career });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get('/api/v1/admin/careers', verifyToken, requireRole('admin'), async (req, res) => {
    try {
      const careers = await Career.find().sort({ createdAt: -1 });
      res.json(careers);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch('/api/v1/admin/careers/:id', verifyToken, requireRole('admin'), async (req, res) => {
    try {
      const { status } = req.body;
      const career = await Career.findByIdAndUpdate(req.params.id, { status }, { new: true });
      if (!career) return res.status(404).json({ message: 'Career application not found' });

      if (status === 'approved') {
        const existingUser = await User.findOne({ email: career.email });
        if (!existingUser) {
          const userPassword = career.password || await bcrypt.hash('tutor123', 10);
          const referralCode = `TC${career.name.substring(0, 2).toUpperCase()}${Date.now().toString(36).toUpperCase()}`;

          const newUser = new User({
            name: career.name,
            email: career.email,
            password: userPassword,
            role: 'tutor',
            mobile: career.phone,
            qualification: career.education?.highestQualification,
            location: career.address?.city || career.address?.state || 'Online',
            subjects: career.teaching?.subjects && career.teaching.subjects.length > 0 ? career.teaching.subjects : ['General'],
            classesTaught: career.teaching?.classes || [],
            mode: career.teaching?.mode,
            price: career.fees?.hourly || 500,
            experience: career.experienceDetails?.totalExperience || '1 year',
            languages: career.skills?.languages || [],
            status: 'active',
            verified: true,
            rating: 5,
            reviews: 0,
            referralCode,
            kycStatus: 'submitted',
          });
          await newUser.save();
        }
      }

      res.json(career);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Reviews ─────────────────────────────────────────────────────────────────
  app.post('/api/v1/reviews', verifyToken, requireRole('student'), async (req, res) => {
    try {
      const { tutorId, bookingId, rating, comment } = req.body;
      if (!tutorId || !rating) {
        return res.status(400).json({ message: 'tutorId and rating are required' });
      }

      const review = new Review({
        student: req.user.id,
        tutor: tutorId,
        booking: bookingId,
        rating,
        comment,
      });
      await review.save();

      // Update tutor's average rating
      const allReviews = await Review.find({ tutor: tutorId, status: 'visible' });
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      await User.findByIdAndUpdate(tutorId, { rating: parseFloat(avgRating.toFixed(1)), reviews: allReviews.length });

      getIo(req)?.emit('reviewCreated', { tutorId, review });

      res.status(201).json(review);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get('/api/v1/reviews/tutor/:tutorId', async (req, res) => {
    try {
      const reviews = await Review.find({ tutor: req.params.tutorId, status: 'visible' })
        .populate('student', 'name avatar')
        .sort({ createdAt: -1 });
      res.json(reviews);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Profile Update ──────────────────────────────────────────────────────────
  app.put('/api/v1/profile', verifyToken, async (req, res) => {
    try {
      const allowedFields = [
        'name', 'mobile', 'avatar', 'bio', 'headline', 'dob', 'gender',
        'grade', 'board', 'school', 'medium', 'address', 'subjects',
        'classesTaught', 'languages', 'experience', 'price', 'priceMax',
        'feeType', 'availableDays', 'availableTimeSlots', 'mode',
        'schedule', 'learningGoal', 'specialRequirements', 'budget',
        'preferredTutorGender', 'qualification', 'demoVideoUrl',
        'location',
      ];

      const updates = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Wishlist ────────────────────────────────────────────────────────────────
  app.post('/api/v1/wishlist/:tutorId', verifyToken, requireRole('student'), async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      const tutorId = req.params.tutorId;

      if (user.wishlist?.includes(tutorId)) {
        user.wishlist = user.wishlist.filter(id => id.toString() !== tutorId);
        await user.save();
        return res.json({ message: 'Removed from wishlist', wishlisted: false });
      }

      user.wishlist = [...(user.wishlist || []), tutorId];
      await user.save();
      res.json({ message: 'Added to wishlist', wishlisted: true });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get('/api/v1/wishlist', verifyToken, requireRole('student'), async (req, res) => {
    try {
      const user = await User.findById(req.user.id).populate('wishlist', 'name avatar headline subjects rating price location verified');
      res.json(user.wishlist || []);
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
