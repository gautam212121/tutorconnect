import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  platformName: { type: String, default: 'TutorConnect' },
  supportEmail: { type: String },
  commissionRate: { type: Number, default: 10 }, // percentage
  gstRate: { type: Number, default: 18 },
  maintenanceMode: { type: Boolean, default: false },
  heroTitle: { type: String, default: 'Quality Home Tuition' },
  heroSubtitle: { type: String, default: 'Verified tutors at your doorstep' },
  heroImage: { type: String, default: '/hero-banner.jpg' },
  smtp: {
    host: { type: String },
    port: { type: Number },
    user: { type: String },
    pass: { type: String }
  }
}, { timestamps: true });

export const Settings = mongoose.model('Settings', settingsSchema);
