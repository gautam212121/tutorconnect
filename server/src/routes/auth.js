import express from 'express';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User.js';
import { OTP } from '../models/OTP.js';

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ── Email transporter ──────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ── Send OTP ──────────────────────────────────────────────────────────────────
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await OTP.deleteMany({ email }); // remove old OTPs
    await OTP.create({ email, otp, expiresAt });

    // Send email
    await transporter.sendMail({
      from: `"TutorConnect" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'TutorConnect — Your OTP Code',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0; background: #fff;">
          <h2 style="color: #056852; margin-bottom: 8px;">TutorConnect</h2>
          <p style="color: #475569; font-size: 15px;">Your verification code is:</p>
          <div style="font-size: 40px; font-weight: 900; color: #056852; letter-spacing: 8px; margin: 24px 0;">${otp}</div>
          <p style="color: #94a3b8; font-size: 13px;">This OTP expires in 10 minutes. Do not share it with anyone.</p>
        </div>
      `,
    });

    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error('OTP send error:', err);
    res.status(500).json({ message: 'Failed to send OTP. Check SMTP credentials.' });
  }
});

// ── Verify OTP ─────────────────────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = await OTP.findOne({ email, otp, used: false });
    if (!record) return res.status(400).json({ message: 'Invalid OTP' });
    if (new Date() > record.expiresAt) return res.status(400).json({ message: 'OTP has expired' });

    record.used = true;
    await record.save();

    // Mark user as verified
    await User.findOneAndUpdate({ email }, { emailVerified: true });

    res.json({ message: 'OTP verified successfully', verified: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Google OAuth ───────────────────────────────────────────────────────────────
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: 'Google credential required' });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        name,
        email,
        password: await bcrypt.hash(googleId + Date.now(), 10),
        role: 'student',
        avatar: picture,
        status: 'active',
        emailVerified: true,
        googleId,
      });
      await user.save();
    }

    const token = jwt.sign(
      { sub: user._id, role: user.role, email: user.email, name: user.name },
      process.env.JWT_SECRET || 'demo-secret',
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
  } catch (err) {
    console.error('Google OAuth error:', err);
    res.status(401).json({ message: 'Google authentication failed' });
  }
});

export default router;
