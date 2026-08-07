import 'dotenv/config';
import http from 'http';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import { createApp } from './src/app.js';
import { ensureMongoConnection } from './src/dataStore.js';

const port = process.env.PORT || 5000;
const app = createApp();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const mongoUri = process.env.MONGODB_URI;

server.listen(port, async () => {
  console.log(`TutorConnect server running on http://localhost:${port}`);
  
  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri, { dbName: process.env.MONGODB_DB_NAME || 'tutorconnect' });
      console.log('Mongoose connected successfully!');
      
      // Auto-seed demo accounts
      const { User } = await import('./src/models/User.js');
      const bcrypt = (await import('bcryptjs')).default;
      
      const seedUsers = [
        { name: 'Admin', email: 'admin@tutorconnect.com', role: 'admin', pass: 'admin123' },
        { name: 'Tutor Demo', email: 'tutor@tutorconnect.com', role: 'tutor', pass: 'tutor123', verified: true },
        { name: 'Student Demo', email: 'student@tutorconnect.com', role: 'student', pass: 'student123' }
      ];

      for (const u of seedUsers) {
        const exists = await User.findOne({ email: u.email });
        if (!exists) {
          const hashedPassword = await bcrypt.hash(u.pass, 10);
          await User.create({
            name: u.name,
            email: u.email,
            password: hashedPassword,
            role: u.role,
            status: 'active',
            verified: u.verified || false
          });
          console.log(`Auto-seeded ${u.role}: ${u.email}`);
        }
      }
    } catch (err) {
      console.error('Mongoose connection error:', err);
    }
  }

  const connected = await ensureMongoConnection();
  if (connected) {
    console.log('MongoDB native connected successfully!');
  } else {
    console.log('MongoDB connection failed or missing URI, using local file store.');
  }
});

