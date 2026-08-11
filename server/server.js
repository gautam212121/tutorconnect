import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import { createApp } from './src/app.js';
import jwt from 'jsonwebtoken';
import { query } from './src/config/db.js';
import User from './src/models/User.js';

const port = process.env.PORT || 5000;
const host = process.env.HOST || '0.0.0.0';
const app = createApp();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://51.21.255.194:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  }
});

app.set('io', io);

// ── Socket.IO Authentication & Room Management ───────────────────────────────
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.sub;
      socket.userRole = decoded.role;
      socket.userName = decoded.name;
    } catch (err) {
      // Allow connection but without auth (for public pages)
    }
  }
  next();
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id} (User: ${socket.userId || 'anonymous'})`);

  // Join user-specific room for targeted notifications
  if (socket.userId) {
    socket.join(`user:${socket.userId}`);

    // Join role-based room for role-specific broadcasts
    if (socket.userRole) {
      socket.join(`role:${socket.userRole}`);
    }

    // Mark user online
    User.findByIdAndUpdate(socket.userId, { isOnline: true }).catch(() => {});
  }

  // ── Chat events ─────────────────────────────────────────────────────────────
  socket.on('chat:join', (conversationId) => {
    socket.join(`chat:${conversationId}`);
  });

  socket.on('chat:leave', (conversationId) => {
    socket.leave(`chat:${conversationId}`);
  });

  socket.on('chat:typing', ({ to, isTyping }) => {
    io.to(`user:${to}`).emit('chat:typing', {
      from: socket.userId,
      isTyping,
    });
  });

  socket.on('chat:read', ({ messageIds, from }) => {
    io.to(`user:${from}`).emit('chat:read', {
      messageIds,
      readBy: socket.userId,
    });
  });

  // ── Disconnect ──────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    if (socket.userId) {
      User.findByIdAndUpdate(socket.userId, { isOnline: false }).catch(() => {});
    }
  });
});

// ── Start Server ──────────────────────────────────────────────────────────────
server.listen(port, host, async () => {
  const publicHost = process.env.PUBLIC_HOST || process.env.CLIENT_HOST || 'localhost';
  const displayHost = publicHost === 'localhost' && host === '0.0.0.0' ? '0.0.0.0' : publicHost;
  console.log(`\n🚀 TutorConnect server running on http://${displayHost}:${port}\n`);

  try {
    // Check MySQL database connection pool
    await query('SELECT 1');
    console.log('✅ MySQL connected successfully!');

    // Auto-seed demo accounts
    const bcrypt = (await import('bcryptjs')).default;

    const seedUsers = [
      { name: 'Admin', email: 'admin@tutorconnect.com', role: 'admin', pass: 'admin123' },
      { name: 'Rahul Sharma', email: 'tutor@tutorconnect.com', role: 'tutor', pass: 'tutor123', verified: true, extra: {
        headline: 'Expert Physics & Maths Tutor',
        bio: 'Experienced home tutor with 5+ years teaching Physics and Mathematics for Class 9-12, JEE, and NEET preparation.',
        subjects: ['Physics', 'Maths'], classesTaught: ['Class 9', 'Class 10', 'Class 11', 'Class 12'],
        price: 600, experience: '5 years', location: 'Lucknow',
        languages: ['Hindi', 'English'], mode: ['Home', 'Online'],
        rating: 4.8, reviews: 12, completedSessions: 35,
      }},
      { name: 'Ananya Singh', email: 'student@tutorconnect.com', role: 'student', pass: 'student123', extra: {
        grade: 'Class 10', board: 'CBSE', gender: 'Female',
        address: { city: 'Lucknow', area: 'Gomti Nagar', pincode: '226010', state: 'Uttar Pradesh' },
      }},
    ];

    for (const u of seedUsers) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        const hashedPassword = await bcrypt.hash(u.pass, 10);
        const referralCode = `TC${u.name.substring(0, 2).toUpperCase()}${Date.now().toString(36).toUpperCase()}`;
        await User.create({
          name: u.name,
          email: u.email,
          password: hashedPassword,
          role: u.role,
          status: 'active',
          verified: u.verified || false,
          referralCode,
          ...(u.extra || {}),
        });
        console.log(`  ✅ Seeded ${u.role}: ${u.email}`);
      }
    }

    // Seed default platform config
    const { PlatformConfig } = await import('./src/models/PlatformConfig.js');
    await PlatformConfig.getConfig();
    console.log('  ✅ Platform config initialized');

    // Seed default subscription plans
    const { SubscriptionPlan } = await import('./src/models/SubscriptionPlan.js');
    const planCount = await SubscriptionPlan.countDocuments();
    if (planCount === 0) {
      await SubscriptionPlan.insertMany([
        {
          name: 'Basic', price: 499, duration: 1, durationLabel: '1 Month',
          leadLimit: 20, leadLimitLabel: '20 Leads', commissionRate: 0.10,
          searchBoost: false, priorityBadge: false, sortOrder: 1,
          features: ['20 leads/month', '10% commission rate', 'Basic support'],
        },
        {
          name: 'Pro', price: 1299, duration: 1, durationLabel: '1 Month',
          leadLimit: 50, leadLimitLabel: '50 Leads', commissionRate: 0.05,
          searchBoost: true, priorityBadge: true, sortOrder: 2,
          features: ['50 leads/month', '5% commission rate', 'Search boost', 'Priority badge', 'Premium support'],
        },
        {
          name: 'Premium', price: 11999, duration: 12, durationLabel: '12 Months',
          leadLimit: -1, leadLimitLabel: 'Unlimited', commissionRate: 0,
          searchBoost: true, priorityBadge: true, premiumSupport: true, sortOrder: 3,
          features: ['Unlimited leads', '0% commission', 'Top search ranking', 'Premium badge', 'Dedicated support', 'Profile boost'],
        },
      ]);
      console.log('  ✅ Seeded subscription plans');
    }

    // Seed default blogs
    const { Blog } = await import('./src/models/Blog.js');
    const blogCount = await Blog.countDocuments();
    if (blogCount === 0) {
      await Blog.insertMany([
        {
          title: 'How to Choose the Right Home Tutor for Your Child',
          excerpt: 'Finding the perfect tutor goes beyond qualifications. Here are key things parents should evaluate before hiring.',
          content: `Finding the perfect tutor for your child is a crucial decision that can significantly impact their academic journey and self-confidence. While academic qualifications are important, they are only part of the equation.\n\n### 1. Identify Your Goals\nBefore you start searching, clearly define what you want to achieve. Is your child struggling to keep up, or do they need help preparing for a specific competitive exam like JEE or NEET? Do they need help with homework, or are they looking for advanced enrichment?\n\n### 2. Look for Teaching Experience\nA tutor might be a subject expert, but explaining complex topics to a young student requires patience and pedagogical skills. Look for tutors who have experience teaching your child's specific class level or board (CBSE, ICSE, etc.).\n\n### 3. Check for Safety & Verifications\nSince a home tutor will be coming to your house, safety is paramount. Platforms like Verified Tutor screen educators by verifying their government IDs and academic credentials, giving parents peace of mind.\n\n### 4. Assess Communication Style and Attitude\nDuring the first demo class, observe how the tutor interacts with your child. A good tutor should be encouraging, patient, and capable of explaining concepts in multiple ways if the child doesn't understand the first time.`,
          category: 'Parents Guide',
          author: 'Sunita Sharma',
          role: 'Parenting Consultant',
          readTime: '4 min read',
          image: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&auto=format&fit=crop&q=60'
        },
        {
          title: '5 Effective Study Habits for Class 10 Board Exams',
          excerpt: 'Prepare strategically for your boards. Learn how to manage time, structure study notes, and write optimal responses.',
          content: `Board exams can be stressful, but with the right study strategies, you can ace them with physical colors. Here are 5 scientifically proven study habits that will help you prepare effectively:\n\n### 1. Use Active Recall\nInstead of just reading and re-reading your textbooks, test yourself. Close the book and write down everything you remember, or explain the concept to someone else. This builds stronger neural connections.\n\n### 2. Follow the Pomodoro Technique\nStudy in focused bursts of 25 minutes, followed by a 5-minute break. After four cycles, take a longer break of 15-30 minutes. This prevents cognitive fatigue and keeps your mind fresh.\n\n### 3. Solve Mock Papers Under Real Exam Conditions\nSuccess in board exams isn't just about what you know; it's also about managing your time. Practice solving previous years' papers in a quiet room with a 3-hour timer.\n\n### 4. Organize Your Study Workspace\nKeep your study desk clutter-free. Ensure you have proper lighting, comfortable seating, and keep all distractions (especially your phone!) in another room.\n\n### 5. Prioritize Sleep and Nutrition\nYour brain needs fuel and rest to function at its best. Get at least 7-8 hours of sleep before the exam, and eat light, nutritious meals.`,
          category: 'Study Tips',
          author: 'Rahul Verma',
          role: 'Physics & Maths Tutor',
          readTime: '6 min read',
          image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=60'
        }
      ]);
      console.log('  ✅ Seeded default blogs');
    }

  } catch (err) {
    console.error('❌ MySQL connection error:', err.message);
  }

  console.log('\n📋 Demo Accounts:');
  console.log('   Admin:   admin@tutorconnect.com / admin123');
  console.log('   Tutor:   tutor@tutorconnect.com / tutor123');
  console.log('   Student: student@tutorconnect.com / student123\n');
});
