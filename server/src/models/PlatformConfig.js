import mongoose from 'mongoose';

// Singleton document — only one should exist in the collection
const platformConfigSchema = new mongoose.Schema({
  // ── Free Tier Settings ──────────────────────────────────────────────────────
  freeLeadsPerMonth: { type: Number, default: 5 },
  leadDisputeWindowHours: { type: Number, default: 48 },
  autoReplacementEnabled: { type: Boolean, default: true },
  otpVerificationForLeads: { type: Boolean, default: true },

  // ── Commission Tiers (Tenure-Based Decreasing) ──────────────────────────────
  commissionTiers: [{
    minSessions: { type: Number, required: true },
    maxSessions: { type: Number, required: true }, // use 999999 for "unlimited"
    rate: { type: Number, required: true }, // 0.15 = 15%
    label: { type: String } // "0 – 20 Sessions"
  }],

  // ── Payout Settings ─────────────────────────────────────────────────────────
  payoutWindowDays: { type: Number, default: 5 }, // 3-5 business days
  minimumWithdrawalAmount: { type: Number, default: 500 }, // INR

  // ── Platform Info ───────────────────────────────────────────────────────────
  platformName: { type: String, default: 'TutorConnect' },
  supportEmail: { type: String, default: 'support@tutorconnect.com' },
  supportPhone: { type: String, default: '+91 123 456 7890' },
  platformAddress: { type: String, default: 'Lucknow, Uttar Pradesh, India' },

  // ── GST / Tax ───────────────────────────────────────────────────────────────
  gstRate: { type: Number, default: 18 },
  gstEnabled: { type: Boolean, default: false },

  // ── Maintenance ─────────────────────────────────────────────────────────────
  maintenanceMode: { type: Boolean, default: false },
  maintenanceMessage: { type: String, default: 'Platform is under maintenance. Please check back soon.' },

  // ── SMTP Settings ───────────────────────────────────────────────────────────
  smtp: {
    host: { type: String },
    port: { type: Number },
    user: { type: String },
    pass: { type: String },
  },

  // ── Razorpay ────────────────────────────────────────────────────────────────
  razorpayKeyId: { type: String },
  razorpayKeySecret: { type: String },

  // ── Cloudinary ──────────────────────────────────────────────────────────────
  cloudinaryCloudName: { type: String },
  cloudinaryApiKey: { type: String },
  cloudinaryApiSecret: { type: String },

}, { timestamps: true });

// Helper to get or create singleton config
platformConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({
      commissionTiers: [
        { minSessions: 0, maxSessions: 20, rate: 0.15, label: '0 – 20 Sessions' },
        { minSessions: 21, maxSessions: 100, rate: 0.10, label: '21 – 100 Sessions' },
        { minSessions: 101, maxSessions: 999999, rate: 0.05, label: '100+ Sessions' },
      ]
    });
  }
  return config;
};

export const PlatformConfig = mongoose.model('PlatformConfig', platformConfigSchema);
