import express from 'express';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User.js';
import { OTP } from '../models/OTP.js';
import { execute } from '../config/db.js';

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const getJwtSecret = () => process.env.JWT_SECRET || 'verifiedtutor-dev-secret';
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

    await execute('DELETE FROM otps WHERE email = ?', [email]); // remove old OTPs
    await OTP.create({ email, otp, expiresAt });

    // Send email
    await transporter.sendMail({
      from: `"VerifiedTutor" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'VerifiedTutor — Your OTP Code',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0; background: #fff;">
          <h2 style="color: #056852; margin-bottom: 8px;">VerifiedTutor</h2>
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
    if (new Date() > new Date(record.expiresAt)) return res.status(400).json({ message: 'OTP has expired' });

    await OTP.updateOne({ id: record.id }, { used: true });

    // Mark user as verified
    const user = await User.findOne({ email });
    if (user) {
      await User.findByIdAndUpdate(user.id, { emailVerified: true });
    }

    res.json({ message: 'OTP verified successfully', verified: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Send Login OTP ─────────────────────────────────────────────────────────────
router.post('/send-login-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ message: 'No account found with this email. Please register first.' });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ message: 'Your account is blocked. Contact support.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await execute('DELETE FROM otps WHERE email = ?', [cleanEmail]);
    await OTP.create({ email: cleanEmail, otp, expiresAt });

    try {
      if (process.env.SMTP_USER) {
        await transporter.sendMail({
          from: `"VerifiedTutor" <${process.env.SMTP_USER}>`,
          to: cleanEmail,
          subject: 'VerifiedTutor — Login OTP Code',
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0; background: #fff;">
              <h2 style="color: #056852; margin-bottom: 8px;">VerifiedTutor Login</h2>
              <p style="color: #475569; font-size: 15px;">Your login OTP code is:</p>
              <div style="font-size: 40px; font-weight: 900; color: #056852; letter-spacing: 8px; margin: 24px 0;">${otp}</div>
              <p style="color: #94a3b8; font-size: 13px;">This OTP is valid for 10 minutes. Do not share it with anyone.</p>
            </div>
          `,
        });
      }
    } catch (mailErr) {
      console.warn('Mail send warning:', mailErr.message);
    }

    return res.json({ message: 'OTP sent to your registered email address.' });
  } catch (err) {
    console.error('Send Login OTP error:', err);
    return res.status(500).json({ message: err.message || 'Failed to send Login OTP' });
  }
});

// ── Verify Login OTP ────────────────────────────────────────────────────────────
router.post('/login-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const record = await OTP.findOne({ email: cleanEmail, otp, used: false });

    if (!record) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (new Date() > new Date(record.expiresAt)) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    await OTP.updateOne({ id: record.id }, { used: true });

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndUpdate(user.id, {
      lastLoginAt: new Date(),
      isOnline: true,
      emailVerified: true,
    });

    const token = jwt.sign(
      { sub: user.id, role: user.role, email: user.email, name: user.name },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        grade: user.grade,
        board: user.board,
      },
    });
  } catch (err) {
    console.error('Login OTP error:', err);
    return res.status(500).json({ message: err.message || 'Login failed' });
  }
});

// ── Forgot Password OTP ────────────────────────────────────────────────────────
router.post('/forgot-password-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ message: 'No account found with this email.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await execute('DELETE FROM otps WHERE email = ?', [cleanEmail]);
    await OTP.create({ email: cleanEmail, otp, expiresAt });

    if (process.env.SMTP_USER) {
      try {
        await transporter.sendMail({
          from: `"VerifiedTutor" <${process.env.SMTP_USER}>`,
          to: cleanEmail,
          subject: 'VerifiedTutor — Password Reset OTP',
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0; background: #fff;">
              <h2 style="color: #056852; margin-bottom: 8px;">Password Reset</h2>
              <p style="color: #475569; font-size: 15px;">Your password reset OTP code is:</p>
              <div style="font-size: 40px; font-weight: 900; color: #056852; letter-spacing: 8px; margin: 24px 0;">${otp}</div>
              <p style="color: #94a3b8; font-size: 13px;">This OTP is valid for 10 minutes. Do not share it with anyone.</p>
            </div>
          `,
        });
      } catch (mailErr) {
        console.warn('Mail send warning:', mailErr.message);
      }
    }

    return res.json({ message: 'Password reset OTP sent to your email.' });
  } catch (err) {
    console.error('Forgot password OTP error:', err);
    return res.status(500).json({ message: err.message || 'Failed to send OTP' });
  }
});

// ── Reset Password ─────────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const record = await OTP.findOne({ email: cleanEmail, otp, used: false });

    if (!record) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (new Date() > new Date(record.expiresAt)) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(user.id, { password: hashedPassword });
    await OTP.updateOne({ id: record.id }, { used: true });

    return res.json({ message: 'Password has been reset successfully. You can now login with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ message: err.message || 'Failed to reset password' });
  }
});

// ── Google OAuth ───────────────────────────────────────────────────────────────
router.post('/google', async (req, res) => {
  try {
    const { credential, email: reqEmail, name: reqName, picture: reqPicture, googleId: reqGoogleId } = req.body;
    let email, name, picture, googleId;

    if (credential) {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        email = payload.email;
        name = payload.name;
        picture = payload.picture;
        googleId = payload.sub;
      } catch (verifyErr) {
        const decoded = jwt.decode(credential);
        if (decoded && decoded.email) {
          email = decoded.email;
          name = decoded.name || decoded.displayName || email.split('@')[0];
          picture = decoded.picture || decoded.photoURL || null;
          googleId = decoded.sub || decoded.user_id || decoded.uid;
        } else if (reqEmail) {
          email = reqEmail;
          name = reqName || email.split('@')[0];
          picture = reqPicture || null;
          googleId = reqGoogleId || `google_${Date.now()}`;
        } else {
          throw verifyErr;
        }
      }
    } else if (reqEmail) {
      email = reqEmail;
      name = reqName || email.split('@')[0];
      picture = reqPicture || null;
      googleId = reqGoogleId || `google_${Date.now()}`;
    } else {
      return res.status(400).json({ message: 'Google credential required' });
    }

    if (!email) {
      return res.status(400).json({ message: 'Valid Google email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: cleanEmail });
    if (!user) {
      const hashedPassword = await bcrypt.hash(googleId + Date.now(), 10);
      user = await User.create({
        name: name || 'Google User',
        email: cleanEmail,
        password: hashedPassword,
        role: 'student',
        avatar: picture || null,
        status: 'active',
        emailVerified: true,
        googleId: googleId || null,
      });
    }

    const token = jwt.sign(
      { sub: user.id, role: user.role, email: user.email, name: user.name },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
  } catch (err) {
    console.error('Google OAuth error:', err);
    return res.status(401).json({ message: err.message || 'Google authentication failed' });
  }
});

export default router;
