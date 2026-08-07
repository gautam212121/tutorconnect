import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from './src/models/User.js';

const seed = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tutorconnect';
  try {
    await mongoose.connect(mongoUri, { dbName: process.env.MONGODB_DB_NAME || 'tutorconnect' });
    console.log('Connected to MongoDB.');

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
        console.log(`Created ${u.role}: ${u.email}`);
      } else {
        console.log(`${u.role} already exists: ${u.email}`);
      }
    }
    console.log('Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
};

seed();
