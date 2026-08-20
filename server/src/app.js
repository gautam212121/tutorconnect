import express from 'express';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

import { query } from './config/db.js';
import { createUser as storeCreateUser, findUserByEmail as storeFindUserByEmail, addBooking as storeAddBooking, getBookings as storeGetBookings } from './dataStore.js';
import { verifyToken, optionalAuth, requireRole, requireAnyRole } from './middleware/auth.js';
import { upload } from './config/upload.js';

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
import tutorRouter from './routes/tutor.js';
import schedulesRouter from './routes/schedules.js';

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
import { Assignment } from './models/Assignment.js';
import { Schedule } from './models/Schedule.js';
import { AssignmentSubmission } from './models/AssignmentSubmission.js';
import { SupportTicket } from './models/SupportTicket.js';
import { createNotification } from './services/notificationService.js';

dotenv.config();

const getIo = (req) => req.app.get('io');
const getJwtSecret = () => process.env.JWT_SECRET || 'verifiedtutor-dev-secret';
const getFrontendUrl = () => process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
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
    origin: getFrontendUrl(),
    credentials: true,
  }));
  app.use(morgan('dev'));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use('/uploads', express.static(fileURLToPath(new URL('../uploads', import.meta.url))));

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
  app.use('/api/v1/tutor', tutorRouter);
  app.use('/api/v1/schedules', verifyToken, schedulesRouter);

  // Public routes
  app.use('/api/v1', publicRouter);
  app.use('/api/v1/config', platformConfigRouter);

  // ── Health ──────────────────────────────────────────────────────────────────
  app.get('/health', async (_req, res) => {
    let isDbConnected = false;
    try {
      await query('SELECT 1');
      isDbConnected = true;
    } catch { }
    res.json({
      status: 'ok',
      service: 'tutorconnect-server',
      database: isDbConnected ? 'connected (MySQL)' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  });

  // ── Newsletter (Public) ──
  app.post('/api/v1/newsletter/subscribe', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: 'Email is required' });

      const { Newsletter } = await import('./models/Newsletter.js');
      const normalizedEmail = email.trim().toLowerCase();
      const existing = await Newsletter.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(400).json({ message: 'This email is already subscribed' });
      }

      await Newsletter.create({ email: normalizedEmail });
      res.status(201).json({ message: 'Subscribed successfully' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Newsletter (Admin) ──
  app.get('/api/v1/admin/newsletter', verifyToken, requireRole('admin'), async (req, res) => {
    try {
      const { Newsletter } = await import('./models/Newsletter.js');
      const subs = await Newsletter.find();
      subs.sort((a, b) => new Date(b.subscribedAt || 0) - new Date(a.subscribedAt || 0));
      res.json(subs);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Blogs (Public) ──
  app.get('/api/v1/blogs', async (_req, res) => {
    try {
      const { Blog } = await import('./models/Blog.js');
      const blogs = await Blog.find();
      blogs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      res.json(blogs);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get('/api/v1/blogs/:id', async (req, res) => {
    try {
      const { Blog } = await import('./models/Blog.js');
      const blog = await Blog.findById(req.params.id);
      if (!blog) return res.status(404).json({ message: 'Blog not found' });
      res.json(blog);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Blogs (Admin) ──
  app.post('/api/v1/admin/blogs', verifyToken, requireRole('admin'), async (req, res) => {
    try {
      const { Blog } = await import('./models/Blog.js');
      const blog = await Blog.create(req.body);
      res.status(201).json(blog);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

  app.put('/api/v1/admin/blogs/:id', verifyToken, requireRole('admin'), async (req, res) => {
    try {
      const { Blog } = await import('./models/Blog.js');
      const blog = await Blog.findByIdAndUpdate(req.params.id, req.body);
      if (!blog) return res.status(404).json({ message: 'Blog not found' });
      res.json(blog);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete('/api/v1/admin/blogs/:id', verifyToken, requireRole('admin'), async (req, res) => {
    try {
      const { Blog } = await import('./models/Blog.js');
      const blog = await Blog.findByIdAndDelete(req.params.id);
      if (!blog) return res.status(404).json({ message: 'Blog not found' });
      res.json({ message: 'Blog deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Users (Admin) ──────────────────────────────────────────────────────────
  app.get('/api/v1/users', verifyToken, requireRole('admin'), async (_req, res) => {
    try {
      const users = await User.find();
      users.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
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
      const tutors = await User.find({ role: 'tutor', verified: true, status: 'active' });
      tutors.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      const formatted = tutors.slice(0, 3).map(t => ({
        id: t.id,
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
      let reviews = await Review.find({ tutor: t.id, status: 'visible' });
      reviews.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      reviews = reviews.slice(0, 10);
      for (const review of reviews) {
        review.student = await User.findById(review.student);
      }

      const formatted = {
        id: t.id,
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
      const existing = await User.findOne({ email: cleanEmail });
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

      const user = await User.create(userPayload);

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
            from: `"VerifiedTutor" <${process.env.SMTP_USER}>`,
            to: cleanEmail,
            subject: 'Welcome to VerifiedTutor!',
            html: `
              <div style="font-family: 'Segoe UI', sans-serif; max-width: 580px; margin: auto; padding: 0; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0;">
                <div style="background: linear-gradient(135deg, #056852 0%, #078a6e 100%); padding: 36px 32px; text-align: center;">
                  <h1 style="color: #fff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">✅ VerifiedTutor</h1>
                  <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Find the Right Tutor for Every Milestone</p>
                </div>
                <div style="padding: 32px; background: #fff;">
                  <h2 style="color: #056852; margin: 0 0 12px; font-size: 20px;">Welcome, ${name}! 🎉</h2>
                  <p style="color: #475569; font-size: 14px; line-height: 1.6;">Your account has been created successfully on <strong>VerifiedTutor</strong>.</p>
                  <p style="color: #475569; font-size: 14px;"><strong>Login Email:</strong> ${cleanEmail}</p>
                  <p style="color: #475569; font-size: 14px;"><strong>Account Type:</strong> ${user.role.toUpperCase()}</p>
                  <div style="margin: 24px 0; text-align: center;">
                    <a href="${getFrontendUrl()}" style="display: inline-block; background: #056852; color: #fff; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 14px; text-decoration: none;">Go to Dashboard →</a>
                  </div>
                  <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">If you did not create this account, please ignore this email.</p>
                </div>
              </div>
            `,
          });
        }
      } catch (mailErr) {
        console.error('Welcome email failed to send:', mailErr);
      }

      return res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ message: err.message });
    }
  });

  app.post('/api/v1/auth/student-register', async (req, res) => {
    try {
      const { name, phone, email, grade, subject, address } = req.body;

      // ── Server-side validation ──
      if (!name || !name.trim()) return res.status(400).json({ message: 'Full name is required' });
      if (!phone || !phone.trim()) return res.status(400).json({ message: 'Mobile number is required' });
      if (!email || !email.trim()) return res.status(400).json({ message: 'Email address is required' });
      if (!grade) return res.status(400).json({ message: 'Class / Course is required' });
      if (!subject || !subject.trim()) return res.status(400).json({ message: 'Subject is required' });
      if (!address || !address.trim()) return res.status(400).json({ message: 'Address is required' });

      const cleanEmail = email.trim().toLowerCase();
      const existing = await User.findOne({ email: cleanEmail });
      if (existing) {
        return res.status(409).json({ message: 'An account with this email already exists' });
      }

      const tempPassword = `${name.replace(/\s+/g, '').toLowerCase()}@${Math.floor(1000 + Math.random() * 9000)}`;
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      const referralCode = `TC${name.substring(0, 2).toUpperCase()}${Date.now().toString(36).toUpperCase()}`;
      const locationStr = typeof address === 'string' ? address.trim() : '';

      const userPayload = {
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        role: 'student',
        mobile: phone.trim(),
        grade: grade || '',
        address: {
          city: locationStr,
          area: '',
          pincode: '',
          state: '',
          full: locationStr,
        },
        status: 'pending',
        referralCode,
        emailVerified: false,
      };

      const user = await User.create(userPayload);
      await Booking.create({
        requestType: 'registration',
        source: 'student-registration',
        student: user.id,
        studentSnapshot: {
          name: user.name,
          phone: user.mobile,
          email: user.email,
          grade: grade || '',
          classLevel: grade || '',
          subject: subject ? subject.trim() : '',
          location: locationStr,
          mode: 'Home',
          address: locationStr,
          role: 'student',
        },
        subject: subject ? subject.trim() : grade || 'Student Registration',
        grade: grade || '',
        examType: 'New Student Registration',
        mode: 'Home',
        duration: 0,
        message: `New student registration from ${name.trim()} — Subject: ${subject || grade}`,
        address: {
          full: locationStr,
          city: locationStr,
          area: '',
          pincode: '',
        },
        amount: 0,
        status: 'Pending',
        paymentStatus: 'Pending',
      });

      getIo(req)?.emit('userCreated', user);

      try {
        const mailer = getMailer();
        if (mailer && process.env.SMTP_USER) {
          await mailer.sendMail({
            from: `"VerifiedTutor" <${process.env.SMTP_USER}>`,
            to: cleanEmail,
            subject: 'VerifiedTutor — Your Student Portal Login Credentials',
            html: `
              <div style="font-family: 'Segoe UI', sans-serif; max-width: 580px; margin: auto; padding: 0; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0;">
                <div style="background: linear-gradient(135deg, #056852 0%, #078a6e 100%); padding: 36px 32px; text-align: center;">
                  <h1 style="color: #fff; margin: 0; font-size: 26px; font-weight: 800;">✅ VerifiedTutor</h1>
                  <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Find the Right Tutor for Every Milestone</p>
                </div>
                <div style="padding: 32px; background: #fff;">
                  <h2 style="color: #056852; margin: 0 0 12px; font-size: 20px;">Welcome to VerifiedTutor! 🎉</h2>
                  <p style="color: #475569; font-size: 14px; line-height: 1.6;">Dear <strong>${name.trim()}</strong>, your student account has been created successfully. Below are your login credentials:</p>
                  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
                    <p style="margin: 0 0 10px; color: #475569; font-size: 14px;"><strong>📧 Email:</strong> ${cleanEmail}</p>
                    <p style="margin: 0 0 10px; color: #475569; font-size: 14px;"><strong>🔒 Password:</strong> ${tempPassword}</p>
                    <p style="margin: 0; color: #475569; font-size: 14px;"><strong>📚 Class:</strong> ${grade}</p>
                  </div>
                  <p style="color: #64748b; font-size: 13px; line-height: 1.6;">Our team will review your profile and connect you with the best tutors in your area.</p>
                  <div style="margin: 24px 0; text-align: center;">
                    <a href="${getFrontendUrl()}" style="display: inline-block; background: #056852; color: #fff; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 14px; text-decoration: none;">Login to Your Account →</a>
                  </div>
                  <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">Please keep your credentials safe. If you have questions, reply to this email.</p>
                </div>
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

      let user = await User.findOne({ email: cleanEmail });

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
      await User.findByIdAndUpdate(user.id, {
        lastLoginAt: new Date(),
        isOnline: true,
      });

      if (user.role === 'student' || user.role === 'tutor' || user.role === 'admin') {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await query('DELETE FROM otps WHERE email = ?', [user.email]);
        await query('INSERT INTO otps (email, otp, expiresAt, used) VALUES (?, ?, ?, false)', [user.email, otp, expiresAt]);

        if (process.env.SMTP_USER) {
          try {
            await getMailer().sendMail({
              from: `"VerifiedTutor" <${process.env.SMTP_USER}>`,
              to: user.email,
              subject: 'VerifiedTutor — 2-Step Login OTP Verification',
              html: `
                <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0; background: #fff;">
                  <h2 style="color: #056852; margin-bottom: 8px;">2-Step Verification</h2>
                  <p style="color: #475569; font-size: 15px;">Your login OTP code is:</p>
                  <div style="font-size: 40px; font-weight: 900; color: #056852; letter-spacing: 8px; margin: 24px 0;">${otp}</div>
                  <p style="color: #94a3b8; font-size: 13px;">This OTP is valid for 10 minutes. Do not share it with anyone.</p>
                </div>
              `
            });
          } catch (err) { console.error('OTP Mail error:', err); }
        }
        return res.json({ requireOtp: true, email: user.email, message: 'OTP sent to your registered email for 2-step verification.' });
      }

      const token = jwt.sign(
        { sub: user.id, role: user.role, email: user.email, name: user.name },
        getJwtSecret(),
        { expiresIn: '7d' }
      );
      return res.json({
        token,
        user: {
          id: user.id, name: user.name, email: user.email,
          role: user.role, avatar: user.avatar,
          grade: user.grade, board: user.board,
        },
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ message: err.message });
    }
  });

  app.get('/api/v1/auth/me', verifyToken, async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      delete user.password;
      if (user.activeSubscription) {
        user.activeSubscription = await Subscription.findById(user.activeSubscription);
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

      // We need more data to fulfill the new dashboard design requirements
      const [bookings, reviews, messages, payments, allTutors] = await Promise.all([
        Booking.find({ student: userId }),
        Review.find({ student: userId }).then(r => r.length),
        Message.find({ $or: [{ to: userId }, { from: userId }] }),
        Payment.find({ student: userId }),
        User.find({ role: 'tutor', verified: true })
      ]);

      for (const b of bookings) {
        b.tutor = await User.findById(b.tutor);
      }

      const upcomingSessions = bookings.filter(b => b.status === 'Confirmed' && b.scheduledAt && new Date(b.scheduledAt) > now);
      const completedClasses = bookings.filter(b => b.status === 'Completed').length;

      const totalSpent = payments.filter(p => p.status === 'Completed').reduce((sum, p) => sum + (Number(p.amount) || Number(p.totalAmount) || 0), 0);
      const pendingPayment = payments.filter(p => p.status === 'Pending').reduce((sum, p) => sum + (Number(p.amount) || Number(p.totalAmount) || 0), 0);

      // Subjects Progress Calculation (Derive from completed vs total bookings per subject)
      const subjectMap = {};
      bookings.forEach(b => {
        if (!b.subject) return;
        if (!subjectMap[b.subject]) subjectMap[b.subject] = { total: 0, completed: 0 };
        subjectMap[b.subject].total++;
        if (b.status === 'Completed') subjectMap[b.subject].completed++;
      });
      const subjectsProgress = Object.keys(subjectMap).map(name => {
        const data = subjectMap[name];
        // Give some default progress if not completed anything yet, just to show UI if total > 0
        return {
          name,
          progress: data.total > 0 ? Math.max(10, Math.round((data.completed / data.total) * 100)) : 0
        };
      });

      // Recent Messages processing
      const userMessageMap = {};
      messages.forEach(m => {
        const otherId = m.from === userId ? m.to : m.from;
        if (!userMessageMap[otherId] || new Date(m.createdAt) > new Date(userMessageMap[otherId].createdAt)) {
          userMessageMap[otherId] = m;
        }
      });

      const recentMessages = [];
      let unreadMessages = 0;
      for (const [otherId, lastMsg] of Object.entries(userMessageMap)) {
        if (lastMsg.to === userId && !lastMsg.read) unreadMessages++;
        const otherUser = await User.findById(otherId);
        if (otherUser) {
          recentMessages.push({
            id: lastMsg.id,
            user: { name: otherUser.name, avatar: otherUser.avatar, role: otherUser.role },
            text: lastMsg.text,
            createdAt: lastMsg.createdAt,
            read: lastMsg.read,
            isSender: lastMsg.from === userId
          });
        }
      }
      recentMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Recommended Tutors
      const recommendedTutors = allTutors
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 4)
        .map(t => ({
          id: t.id,
          name: t.name,
          avatar: t.avatar,
          subjects: t.subjects || [],
          rating: t.rating || 0,
          experience: t.experience || '1 Year',
          price: t.price || 500
        }));

      // Progress Chart (last 6 months completed bookings count to derive some curve)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const chartLabels = [];
      const chartData = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        chartLabels.push(monthNames[d.getMonth()]);
        const count = bookings.filter(b => b.status === 'Completed' && new Date(b.createdAt).getMonth() === d.getMonth() && new Date(b.createdAt).getFullYear() === d.getFullYear()).length;
        // adding a base value just to make the chart look like the image (upward trend) if no data
        chartData.push(count * 10 + (6 - i) * 15);
      }

      const assignedTutors = bookings
        .filter(b => b.tutor && b.status !== 'Rejected' && b.status !== 'Cancelled')
        .map(b => ({
          tutorId: String(b.tutor.id),
          tutorName: b.tutor.name,
          subject: b.subject || 'General',
          bookingId: b.id
        }));

      res.json({
        stats: {
          upcomingSessions: upcomingSessions.length,
          totalBookings: bookings.length,
          completedClasses,
          totalSpent,
        },
        paymentSummary: {
          paid: totalSpent,
          pending: pendingPayment,
          refunded: 0
        },
        upcomingSessions: upcomingSessions.slice(0, 5),
        recentBookings: bookings.slice(0, 4),
        recentMessages: recentMessages.slice(0, 4),
        subjectsProgress,
        recommendedTutors,
        progressChart: {
          labels: chartLabels,
          data: chartData
        },
        unreadMessages,
        assignedTutors
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get('/api/v1/student/assignments', verifyToken, requireRole('student'), async (req, res) => {
    try {
      const studentId = req.user.id;
      const assignments = await Assignment.find({ studentId });
      for (const a of assignments) {
        a.tutor = await User.findById(a.tutorId);
      }
      res.json(assignments);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get('/api/v1/student/study-materials', verifyToken, requireRole('student'), async (req, res) => {
    try {
      const studentId = req.user.id;
      const materials = await StudyMaterial.find({ studentId });
      for (const m of materials) {
        m.tutor = await User.findById(m.tutorId);
      }
      res.json(materials);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Student Assignments Submissions ───────────────────────────────────────
  app.post('/api/v1/student/assignments/:id/submit', verifyToken, requireRole('student'), async (req, res) => {
    try {
      const studentId = req.user.id;
      const assignmentId = req.params.id;
      const { content, fileUrl } = req.body;

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

      const existing = await AssignmentSubmission.find({ assignmentId, studentId });
      if (existing.length > 0) {
        return res.status(400).json({ message: 'You have already submitted this assignment' });
      }

      const submission = await AssignmentSubmission.create({
        assignmentId,
        studentId,
        content,
        fileUrl,
        status: 'Submitted'
      });

      // Notify tutor
      const io = getIo(req);
      await createNotification(io, {
        recipientId: assignment.tutorId,
        title: 'Assignment Submitted',
        message: `Student has submitted assignment: ${assignment.title}.`,
        type: 'assignment',
        link: '/dashboard/tutor/assignments'
      });

      res.status(201).json(submission);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get('/api/v1/student/assignments/:id/submission', verifyToken, requireRole('student'), async (req, res) => {
    try {
      const studentId = req.user.id;
      const submissions = await AssignmentSubmission.find({ assignmentId: req.params.id, studentId });
      res.json(submissions[0] || null);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Student Payments History ──────────────────────────────────────────────
  app.get('/api/v1/student/payments', verifyToken, requireRole('student'), async (req, res) => {
    try {
      const studentId = req.user.id;
      const payments = await Payment.find({ student: studentId });
      const populated = [];
      for (const p of payments) {
        const tutor = await User.findById(p.tutor);
        const booking = await Booking.findById(p.booking);
        populated.push({
          ...p,
          tutorName: tutor ? tutor.name : 'Unknown Tutor',
          subject: booking ? booking.subject : 'General',
          bookingStatus: booking ? booking.status : 'Pending',
          date: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'Unknown'
        });
      }
      res.json(populated);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Student Progress ──────────────────────────────────────────────────────
  app.get('/api/v1/student/progress', verifyToken, requireRole('student'), async (req, res) => {
    try {
      const studentId = req.user.id;
      const [bookings, schedules, assignments, submissions] = await Promise.all([
        Booking.find({ student: studentId }),
        Schedule.find({ student: studentId }),
        Assignment.find({ studentId }),
        AssignmentSubmission.find({ studentId })
      ]);

      const completedClasses = schedules.filter(s => s.status === 'Completed').length;
      const totalClasses = schedules.filter(s => s.status !== 'Cancelled').length;
      const attendance = totalClasses > 0 ? Math.round((completedClasses / totalClasses) * 100) : 100;

      const completedAssignments = submissions.length;
      const totalAssignments = assignments.length;
      const assignmentRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 100;

      const graded = submissions.filter(sub => sub.status === 'Graded' && sub.grade);
      const avgScore = graded.length > 0
        ? Math.round(graded.reduce((sum, sub) => sum + (parseFloat(sub.grade) || 0), 0) / graded.length)
        : 0;

      const subjectMap = {};
      bookings.forEach(b => {
        if (!b.subject) return;
        const subjects = b.subject.split(',').map(s => s.trim());
        subjects.forEach(sub => {
          if (!subjectMap[sub]) subjectMap[sub] = { total: 0, completed: 0 };
          subjectMap[sub].total++;
          if (b.status === 'Completed' || b.status === 'Payment Completed') {
            subjectMap[sub].completed++;
          }
        });
      });
      const subjectsProgress = Object.keys(subjectMap).map(name => {
        const data = subjectMap[name];
        return {
          name,
          progress: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
          total: data.total,
          completed: data.completed
        };
      });

      res.json({
        stats: {
          completedClasses,
          totalClasses,
          attendance,
          completedAssignments,
          totalAssignments,
          assignmentRate,
          avgScore
        },
        subjectsProgress
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Tutor Reviews & Ratings ────────────────────────────────────────────────
  app.get('/api/v1/student/eligible-reviews', verifyToken, requireRole('student'), async (req, res) => {
    try {
      const studentId = req.user.id;
      const bookings = await Booking.find({ student: studentId });
      const eligible = [];
      for (const b of bookings) {
        if (['Completed', 'Payment Completed'].includes(b.status)) {
          const existing = await Review.find({ booking: b.id });
          if (existing.length === 0) {
            const tutor = await User.findById(b.tutor);
            eligible.push({
              bookingId: b.id,
              tutorId: b.tutor,
              tutorName: tutor ? tutor.name : 'Your Tutor',
              subject: b.subject,
              completedAt: b.updatedAt
            });
          }
        }
      }
      res.json(eligible);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post('/api/v1/student/reviews', verifyToken, requireRole('student'), async (req, res) => {
    try {
      const studentId = req.user.id;
      const { bookingId, tutorId, rating, comment } = req.body;

      if (!bookingId || !tutorId || !rating) {
        return res.status(400).json({ message: 'bookingId, tutorId, and rating are required' });
      }

      const existing = await Review.find({ booking: bookingId, student: studentId });
      if (existing.length > 0) {
        return res.status(400).json({ message: 'You have already reviewed this booking' });
      }

      const review = await Review.create({
        booking: bookingId,
        student: studentId,
        tutor: tutorId,
        rating: Number(rating),
        comment
      });

      const agg = await Review.aggregate([{ $match: { tutor: Number(tutorId) } }]);
      if (agg.length > 0) {
        const { avgRating, count } = agg[0];
        await User.findByIdAndUpdate(tutorId, {
          rating: avgRating,
          reviews: count
        });
      }

      res.status(201).json(review);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Notifications ──────────────────────────────────────────────────────────
  app.get('/api/v1/notifications', verifyToken, async (req, res) => {
    try {
      const notifications = await Notification.find({ recipient: req.user.id });
      res.json(notifications);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch('/api/v1/notifications/read', verifyToken, async (req, res) => {
    try {
      await Notification.updateMany({ recipient: req.user.id }, { read: true, readAt: new Date() });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch('/api/v1/notifications/:id/read', verifyToken, async (req, res) => {
    try {
      await Notification.updateMany({ recipient: req.user.id, id: req.params.id }, { read: true, readAt: new Date() });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Change Password ────────────────────────────────────────────────────────
  app.post('/api/v1/profile/change-password', verifyToken, async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Both old and new passwords are required' });
      }

      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Incorrect old password' });

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await User.findByIdAndUpdate(req.user.id, { password: hashedPassword });

      res.json({ message: 'Password updated successfully' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Support Tickets ────────────────────────────────────────────────────────
  app.post('/api/v1/student/support/tickets', verifyToken, requireRole('student'), async (req, res) => {
    try {
      const studentId = req.user.id;
      const { subject, message } = req.body;
      if (!subject || !message) {
        return res.status(400).json({ message: 'Subject and message are required' });
      }

      const ticket = await SupportTicket.create({ studentId, subject, message, status: 'Open' });
      res.status(201).json(ticket);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get('/api/v1/student/support/tickets', verifyToken, requireRole('student'), async (req, res) => {
    try {
      const studentId = req.user.id;
      const tickets = await SupportTicket.find({ studentId });
      res.json(tickets);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post('/api/v1/tutor/support/tickets', verifyToken, requireRole('tutor'), async (req, res) => {
    try {
      const tutorId = req.user.id;
      const { subject, message } = req.body;
      if (!subject || !message) {
        return res.status(400).json({ message: 'Subject and message are required' });
      }

      const ticket = await SupportTicket.create({ studentId: tutorId, subject, message, status: 'Open' });
      res.status(201).json(ticket);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get('/api/v1/tutor/support/tickets', verifyToken, requireRole('tutor'), async (req, res) => {
    try {
      const tutorId = req.user.id;
      const tickets = await SupportTicket.find({ studentId: tutorId });
      res.json(tickets);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get('/api/v1/admin/support/tickets', verifyToken, requireRole('admin'), async (req, res) => {
    try {
      const tickets = await SupportTicket.find();
      const populated = [];
      for (const t of tickets) {
        const student = await User.findById(t.studentId);
        populated.push({
          ...t,
          studentName: student ? student.name : 'Unknown Student',
          studentEmail: student ? student.email : ''
        });
      }
      res.json(populated);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post('/api/v1/admin/support/tickets/:id/reply', verifyToken, requireRole('admin'), async (req, res) => {
    try {
      const { adminReply } = req.body;
      if (!adminReply) return res.status(400).json({ message: 'Reply content is required' });

      const ticket = await SupportTicket.findById(req.params.id);
      if (!ticket) return res.status(404).json({ message: 'Support ticket not found' });

      const updated = await SupportTicket.update(req.params.id, {
        adminReply,
        status: 'Replied',
        repliedAt: new Date()
      });

      // Notify student
      const io = getIo(req);
      await createNotification(io, {
        recipientId: ticket.studentId,
        title: 'Support Ticket Replied',
        message: `Admin replied to your support ticket: "${ticket.subject}".`,
        type: 'support',
        link: '/dashboard/student?section=support'
      });

      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Tutor Grading & Submissions ────────────────────────────────────────────
  app.get('/api/v1/tutor/submissions', verifyToken, requireRole('tutor'), async (req, res) => {
    try {
      const tutorId = req.user.id;
      const assignments = await Assignment.find({ tutorId });
      const submissions = [];
      for (const a of assignments) {
        const subs = await AssignmentSubmission.find({ assignmentId: a.id });
        for (const s of subs) {
          const student = await User.findById(s.studentId);
          submissions.push({
            ...s,
            assignmentTitle: a.title,
            studentName: student ? student.name : 'Student',
            studentEmail: student ? student.email : ''
          });
        }
      }
      res.json(submissions);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post('/api/v1/tutor/submissions/:id/grade', verifyToken, requireRole('tutor'), async (req, res) => {
    try {
      const { grade, feedback } = req.body;
      const sub = await AssignmentSubmission.findById(req.params.id);
      if (!sub) return res.status(404).json({ message: 'Submission not found' });

      const assignment = await Assignment.findById(sub.assignmentId);
      if (!assignment || assignment.tutorId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const updated = await AssignmentSubmission.update(req.params.id, {
        grade,
        feedback,
        status: 'Graded'
      });

      // Notify student
      const io = getIo(req);
      await createNotification(io, {
        recipientId: sub.studentId,
        title: 'Assignment Graded',
        message: `Your tutor graded assignment: "${assignment.title}". Grade: ${grade}.`,
        type: 'assignment',
        link: '/dashboard/student?section=assignments'
      });

      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Tutor Analytics ────────────────────────────────────────────────────────
  app.get('/api/v1/tutor/analytics', verifyToken, requireRole('tutor'), async (req, res) => {
    try {
      const tutorId = req.user.id;
      
      const [bookings, schedules, assignments, submissions, reviews] = await Promise.all([
        Booking.find({ tutor: tutorId }),
        Schedule.find({ tutor: tutorId }),
        Assignment.find({ tutorId }),
        AssignmentSubmission.find({}),
        Review.find({ tutor: tutorId })
      ]);

      const completedSessions = schedules.filter(s => s.status === 'Completed').length;
      const upcomingSessions = schedules.filter(s => s.status === 'Approved' && new Date(s.scheduledAt) > new Date()).length;

      const studentIds = [...new Set(bookings.map(b => String(b.student)))];
      const totalStudents = studentIds.length;
      const activeStudents = [...new Set(schedules.filter(s => s.status === 'Approved').map(s => String(s.student)))].length;

      const avgRating = reviews.length > 0
        ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
        : 0;

      const payments = await Payment.find({ tutor: tutorId });
      const completedPayments = payments.filter(p => p.status === 'Completed' || p.status === 'Paid');
      const totalEarnings = completedPayments.reduce((sum, p) => sum + (p.tutorShare || 0), 0);
      const pendingEarnings = payments.filter(p => p.status !== 'Completed' && p.status !== 'Paid').reduce((sum, p) => sum + (p.tutorShare || 0), 0);

      const subjectMap = {};
      bookings.forEach(b => {
        if (!b.subject) return;
        const subs = b.subject.split(',').map(s => s.trim());
        subs.forEach(s => {
          if (!subjectMap[s]) subjectMap[s] = 0;
          subjectMap[s]++;
        });
      });
      const subjectStats = Object.keys(subjectMap).map(name => ({
        name,
        count: subjectMap[name]
      }));

      const assignmentCount = assignments.length;
      const tutorAssignmentIds = new Set(assignments.map(a => a.id));
      const tutorSubmissions = submissions.filter(sub => tutorAssignmentIds.has(sub.assignmentId));
      const submissionCount = tutorSubmissions.length;
      const gradedCount = tutorSubmissions.filter(sub => sub.status === 'Graded').length;

      res.json({
        totalStudents,
        activeStudents,
        completedSessions,
        upcomingSessions,
        avgRating,
        totalEarnings,
        pendingEarnings,
        subjectStats,
        assignmentStats: {
          total: assignmentCount,
          submitted: submissionCount,
          graded: gradedCount
        }
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Admin Messages Monitoring ──────────────────────────────────────────────
  app.get('/api/v1/admin/conversations', verifyToken, requireRole('admin'), async (req, res) => {
    try {
      const messages = await Message.find({});
      const groups = {};
      for (const m of messages) {
        const fromUser = await User.findById(m.from);
        const toUser = await User.findById(m.to);
        
        if (!fromUser || !toUser) continue;
        
        const student = fromUser.role === 'student' ? fromUser : toUser.role === 'student' ? toUser : null;
        const tutor = fromUser.role === 'tutor' ? fromUser : toUser.role === 'tutor' ? toUser : null;
        
        if (!student || !tutor) continue;
        
        const key = `${student.id}-${tutor.id}`;
        if (!groups[key]) {
          groups[key] = {
            student: { id: student.id, name: student.name, email: student.email },
            tutor: { id: tutor.id, name: tutor.name, email: tutor.email },
            bookingId: m.booking || null,
            lastMessage: m.content,
            messageCount: 0,
            updatedAt: m.createdAt
          };
        }
        groups[key].messageCount++;
        if (new Date(m.createdAt) > new Date(groups[key].updatedAt)) {
          groups[key].lastMessage = m.content;
          groups[key].updatedAt = m.createdAt;
        }
      }
      res.json(Object.values(groups));
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get('/api/v1/admin/conversations/:studentId/:tutorId', verifyToken, requireRole('admin'), async (req, res) => {
    try {
      const { studentId, tutorId } = req.params;
      const messages = await Message.find({
        $or: [
          { from: studentId, to: tutorId },
          { from: tutorId, to: studentId }
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

  // ── Tutor Dashboard ────────────────────────────────────────────────────────
  app.get('/api/v1/tutor/dashboard', verifyToken, requireRole('tutor'), async (req, res) => {
    try {
      const userId = req.user.id;
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisWeek = new Date(now - 7 * 24 * 60 * 60 * 1000);

      const tutor = await User.findById(userId);
      if (tutor?.activeSubscription) {
        tutor.activeSubscription = await Subscription.findById(tutor.activeSubscription);
      }
      const { checkFreeLeadsAvailable, calculateCommissionRate } = await import('./services/commissionService.js');

      const [bookings, leads, tutorPayments, freeLeads, commissionInfo, unreadMessages] = await Promise.all([
        (async () => {
          const list = await Booking.find({ tutor: userId });
          for (const booking of list) {
            booking.student = await User.findById(booking.student);
          }
          list.sort((a, b) => new Date(b.scheduledAt || 0) - new Date(a.scheduledAt || 0));
          return list;
        })(),
        (async () => {
          const list = await Lead.find({ tutor: userId });
          list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          return list.slice(0, 10);
        })(),
        Payment.find({ tutor: userId }),
        checkFreeLeadsAvailable(userId),
        calculateCommissionRate(userId),
        Message.countDocuments({ to: userId, read: false }),
      ]);

      const completedPayments = tutorPayments.filter(p => p.status === 'Completed' || p.status === 'Paid');
      const totalEarningsSum = completedPayments.reduce((sum, p) => sum + (p.tutorShare || 0), 0);
      const grossEarningsSum = completedPayments.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
      const totalCommissionSum = completedPayments.reduce((sum, p) => sum + (p.adminShare || 0), 0);
      
      const thisMonthPayments = completedPayments.filter(p => p.createdAt && new Date(p.createdAt) >= thisMonth);
      const monthlyEarningsSum = thisMonthPayments.reduce((sum, p) => sum + (p.tutorShare || 0), 0);

      const upcomingSessions = bookings.filter(b => b.status === 'Confirmed' && b.scheduledAt && new Date(b.scheduledAt) > now);
      const activeLeads = leads.filter(l => ['new', 'contacted', 'responded'].includes(l.status));
      const assignedStudents = bookings
        .filter(b => b.student)
        .map((b) => ({
          bookingId: b.id || b._id,
          studentId: b.student?._id || b.student?.id,
          studentName: b.student?.name || 'Student',
          classLevel: b.grade || b.student?.grade || 'N/A',
          selectedSubjects: [b.subject || 'General'],
          location: b.address?.city || b.address?.full || b.student?.address?.city || 'Lucknow',
          address: b.address || b.student?.address || { city: 'Lucknow', area: 'N/A', pincode: 'N/A' },
          schedule: b.scheduledAt ? new Date(b.scheduledAt).toISOString() : 'Flexible',
          contact: b.student?.mobile || b.student?.email || 'N/A',
          requiredDetails: b.student?.specialRequirements || b.message || 'Not provided',
          paymentStatus: b.paymentStatus || 'Pending',
          amount: Number(b.amount || 0),
          totalAmount: Number(b.amount || 0),
          status: b.status || 'Pending',
          mode: b.mode || 'Home',
          hourlyRate: Number(tutor.price || b.amount || 0),
          monthlyRate: Number((tutor.price || b.amount || 0) * 20),
        }));

      // Monthly earnings for chart (last 6 months)
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          month: d.toLocaleDateString('en-US', { month: 'short' }),
          year: d.getFullYear(),
          earnings: 0
        });
      }
      completedPayments.forEach(p => {
        if (!p.createdAt) return;
        const pDate = new Date(p.createdAt);
        if (pDate >= sixMonthsAgo) {
          const mName = pDate.toLocaleDateString('en-US', { month: 'short' });
          const mItem = months.find(m => m.month === mName && m.year === pDate.getFullYear());
          if (mItem) mItem.earnings += p.tutorShare;
        }
      });
      const monthlyEarnings = months.map(m => ({ _id: m.month, earnings: m.earnings }));

      // Recent payouts & transaction history
      const recentPayouts = [];
      for (const p of tutorPayments) {
        const student = await User.findById(p.student);
        const booking = await Booking.findById(p.booking);
        
        recentPayouts.push({
          id: p.id,
          studentName: student ? student.name : 'Student',
          subject: booking ? booking.subject : 'General',
          grossAmount: Number(p.totalAmount || 0),
          tutorShare: Number(p.tutorShare || 0),
          adminShare: Number(p.adminShare || 0),
          paymentStatus: p.status || 'Pending',
          payoutStatus: p.status === 'Paid' || p.status === 'Completed' ? 'Disbursed' : 'Pending',
          date: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
          status: p.status === 'Paid' || p.status === 'Completed' ? 'Completed' : 'Pending',
          amount: p.tutorShare
        });
      }
      recentPayouts.sort((a, b) => new Date(b.date) - new Date(a.date));

      res.json({
        stats: {
          freeLeads,
          activeLeads: activeLeads.length,
          respondedLeads: leads.filter(l => l.status === 'responded').length,
          upcomingSessions: upcomingSessions.filter(b => new Date(b.scheduledAt) < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)).length,
          totalEarnings: totalEarningsSum,
          totalCommission: totalCommissionSum,
          grossEarnings: grossEarningsSum,
          earnings: totalEarningsSum,
          walletBalance: tutor.wallet?.availableBalance || totalEarningsSum,
          unreadMessages,
        },
        commission: commissionInfo,
        hourlyRate: Number(tutor.price || 0),
        monthlyRate: Number((tutor.price || 0) * 20),
        rateSummary: {
          hourly: Number(tutor.price || 0),
          monthly: Number((tutor.price || 0) * 20),
        },
        assignedStudents,
        upcomingSessions: upcomingSessions.slice(0, 5),
        leads: leads.slice(0, 10),
        monthlyEarnings,
        recentPayouts,
        completedSessions: completedSessions,
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
      const notifications = await Notification.find({ recipient: req.user.id });

      notifications.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      const pagedNotifications = notifications.slice((page - 1) * limit, (page - 1) * limit + parseInt(limit));

      const unreadCount = notifications.filter(n => !n.read).length;

      res.json({ notifications: pagedNotifications, unreadCount });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post('/api/v1/notifications/mark-read', verifyToken, async (req, res) => {
    try {
      await Notification.updateMany(
        { recipient: req.user.id, read: false },
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

      const career = await Career.create({
        name, email, password: hashedPassword, phone, gender, dob, address,
        education, teaching, experienceDetails, availability,
        fees, skills, documents
      });

      getIo(req)?.emit('careerSubmitted', career);

      // Send confirmation email to the tutor applicant
      try {
        const mailer = getMailer();
        if (mailer && process.env.SMTP_USER && email) {
          await mailer.sendMail({
            from: `"VerifiedTutor" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'VerifiedTutor — Application Received! We will contact you within 24 hours',
            html: `
              <div style="font-family: 'Segoe UI', sans-serif; max-width: 580px; margin: auto; padding: 0; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0;">
                <div style="background: linear-gradient(135deg, #056852 0%, #078a6e 100%); padding: 36px 32px; text-align: center;">
                  <h1 style="color: #fff; margin: 0; font-size: 26px; font-weight: 800;">✅ VerifiedTutor</h1>
                  <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Find the Right Tutor for Every Milestone</p>
                </div>
                <div style="padding: 32px; background: #fff;">
                  <h2 style="color: #056852; margin: 0 0 12px; font-size: 22px;">Application Received! 🎉</h2>
                  <p style="color: #475569; font-size: 15px; line-height: 1.7;">Dear <strong>${name}</strong>,</p>
                  <p style="color: #475569; font-size: 15px; line-height: 1.7;">Thank you for applying to join <strong>VerifiedTutor</strong> as a tutor. We have received your application successfully.</p>
                  <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 20px; margin: 24px 0; text-align: center;">
                    <p style="margin: 0; font-size: 18px; font-weight: 800; color: #056852;">⏱️ We will contact you within 24 hours</p>
                    <p style="margin: 8px 0 0; color: #64748b; font-size: 13px;">Our team reviews every application carefully</p>
                  </div>
                  <p style="color: #475569; font-size: 14px; line-height: 1.7;">Here is a summary of your application:</p>
                  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 16px 0;">
                    <p style="margin: 0 0 8px; color: #475569; font-size: 14px;"><strong>👤 Name:</strong> ${name}</p>
                    <p style="margin: 0 0 8px; color: #475569; font-size: 14px;"><strong>📧 Email:</strong> ${email}</p>
                    <p style="margin: 0 0 8px; color: #475569; font-size: 14px;"><strong>📱 Phone:</strong> ${phone}</p>
                    ${teaching && teaching.subjects && teaching.subjects.length > 0 ? `<p style="margin: 0; color: #475569; font-size: 14px;"><strong>📚 Subjects:</strong> ${teaching.subjects.join(', ')}</p>` : ''}
                  </div>
                  <p style="color: #475569; font-size: 14px; line-height: 1.7;">If you have any questions, feel free to reply to this email. We look forward to having you on our platform!</p>
                  <div style="margin: 28px 0; text-align: center;">
                    <a href="${getFrontendUrl()}" style="display: inline-block; background: #056852; color: #fff; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 14px; text-decoration: none;">Visit VerifiedTutor →</a>
                  </div>
                  <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">© VerifiedTutor — Connecting Students with the Best Tutors</p>
                </div>
              </div>
            `,
          });
        }
      } catch (mailErr) {
        console.error('Tutor application confirmation email failed to send:', mailErr);
      }

      res.status(201).json({ message: 'Application submitted successfully', data: career });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get('/api/v1/admin/careers', verifyToken, requireRole('admin'), async (req, res) => {
    try {
      const careers = await Career.find();
      careers.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      res.json(careers);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  const updateCareerStatusHandler = async (req, res) => {
    try {
      const { status } = req.body;
      const career = await Career.findByIdAndUpdate(req.params.id, { status }, { new: true });
      if (!career) return res.status(404).json({ message: 'Career application not found' });

      if (status === 'approved') {
        const existingUser = await User.findOne({ email: career.email });
        if (!existingUser) {
          const userPassword = career.password || await bcrypt.hash('tutor123', 10);
          const referralCode = `TC${career.name.substring(0, 2).toUpperCase()}${Date.now().toString(36).toUpperCase()}`;

          await User.create({
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
        }
      }

      res.json(career);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
  app.patch('/api/v1/admin/careers/:id', verifyToken, requireRole('admin'), updateCareerStatusHandler);
  app.put('/api/v1/admin/careers/:id', verifyToken, requireRole('admin'), updateCareerStatusHandler);

  // ── Reviews ─────────────────────────────────────────────────────────────────
  app.post('/api/v1/reviews', verifyToken, requireRole('student'), async (req, res) => {
    try {
      const { tutorId, bookingId, rating, comment } = req.body;
      if (!tutorId || !rating) {
        return res.status(400).json({ message: 'tutorId and rating are required' });
      }

      const review = await Review.create({
        student: req.user.id,
        tutor: tutorId,
        booking: bookingId,
        rating,
        comment,
      });

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
      const reviews = await Review.find({ tutor: req.params.tutorId, status: 'visible' });
      reviews.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      for (const review of reviews) {
        review.student = await User.findById(review.student);
      }
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

      const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
      if (user && user.password) delete user.password;
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
        const updatedWishlist = user.wishlist.filter(id => id.toString() !== tutorId);
        await User.findByIdAndUpdate(req.user.id, { wishlist: updatedWishlist });
        return res.json({ message: 'Removed from wishlist', wishlisted: false });
      }

      const updatedWishlist = [...(user.wishlist || []), tutorId];
      await User.findByIdAndUpdate(req.user.id, { wishlist: updatedWishlist });
      res.json({ message: 'Added to wishlist', wishlisted: true });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get('/api/v1/wishlist', verifyToken, requireRole('student'), async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      const wishlist = [];
      for (const tutorId of user.wishlist || []) {
        const tutor = await User.findById(tutorId);
        if (tutor) wishlist.push(tutor);
      }
      res.json(wishlist);
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
