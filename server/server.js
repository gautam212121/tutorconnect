import 'dotenv/config';
import http from 'http';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import { createApp } from './src/app.js';
import { ensureMongoConnection } from './src/dataStore.js';
import jwt from 'jsonwebtoken';

const port = process.env.PORT || 5000;
const app = createApp();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
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
    mongoose.model('User').findByIdAndUpdate(socket.userId, { isOnline: true }).catch(() => {});
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
      mongoose.model('User').findByIdAndUpdate(socket.userId, { isOnline: false }).catch(() => {});
    }
  });
});

// ── Start Server ──────────────────────────────────────────────────────────────
const mongoUri = process.env.MONGODB_URI;

server.listen(port, async () => {
  console.log(`\n🚀 TutorConnect server running on http://localhost:${port}\n`);

  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri, { dbName: process.env.MONGODB_DB_NAME || 'tutorconnect' });
      console.log('✅ MongoDB connected successfully!');

      // Auto-seed demo accounts
      const { User } = await import('./src/models/User.js');
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

    } catch (err) {
      console.error('❌ MongoDB connection error:', err.message);
    }
  }

  const connected = await ensureMongoConnection();
  if (connected) {
    console.log('✅ MongoDB native driver connected');
  }

  console.log('\n📋 Demo Accounts:');
  console.log('   Admin:   admin@tutorconnect.com / admin123');
  console.log('   Tutor:   tutor@tutorconnect.com / tutor123');
  console.log('   Student: student@tutorconnect.com / student123\n');
});
