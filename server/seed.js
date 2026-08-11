import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { User } from './src/models/User.js';
import { query } from './src/config/db.js';

const seed = async () => {
  try {
    await query('SELECT 1');
    console.log('Connected to MySQL.');

    const seedUsers = [
      { name: 'Admin', email: 'admin@tutorconnect.com', role: 'admin', pass: 'admin123' },
      { name: 'Tutor Demo', email: 'tutor@tutorconnect.com', role: 'tutor', pass: 'tutor123', verified: true },
      { name: 'Student Demo', email: 'student@tutorconnect.com', role: 'student', pass: 'student123' }
    ];

    for (const u of seedUsers) {
      const exists = await User.findOne({ email: u.email });
      const hashedPassword = await bcrypt.hash(u.pass, 10);
      if (!exists) {
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
        await User.findByIdAndUpdate(exists.id, {
          password: hashedPassword,
          status: 'active'
        });
        console.log(`Updated ${u.role} credentials: ${u.email}`);
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
