import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'tutor', 'admin'], default: 'student' },
  avatar: { type: String },
  status: { type: String, enum: ['active', 'inactive', 'blocked', 'pending', 'verified', 'suspended', 'rejected'], default: 'active' },

  // ── Tutor Specific Fields ─────────────────────────────────────────────────
  headline: { type: String },
  bio: { type: String },
  price: { type: Number },
  priceMax: { type: Number },
  experience: { type: String },
  location: { type: String },
  subjects: [{ type: String }],
  classesTaught: [{ type: String }],
  mode: [{ type: String }], // 'Online', 'Home'
  verified: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  googleId: { type: String },
  rating: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
  demoVideoUrl: { type: String },

  // ── Monetization (Tutor) ──────────────────────────────────────────────────
  completedSessions: { type: Number, default: 0 },
  currentCommissionRate: { type: Number, default: 0.15 }, // auto-calculated from tiers
  wallet: {
    pendingBalance: { type: Number, default: 0 },
    availableBalance: { type: Number, default: 0 },
    paidBalance: { type: Number, default: 0 },
  },
  activeSubscription: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
  freeLeadsUsed: { type: Number, default: 0 },
  freeLeadsResetDate: { type: Date },

  // ── Bank Details (Tutor) ──────────────────────────────────────────────────
  bankDetails: {
    accountName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    bankName: { type: String },
  },
  upiId: { type: String },

  // ── Registration Fields ───────────────────────────────────────────────────
  mobile: { type: String },
  qualification: { type: String },
  languages: [{ type: String }],
  feeType: { type: String, enum: ['Hourly', 'Monthly'], default: 'Hourly' },
  availableDays: [{ type: String }],
  availableTimeSlots: { type: String },
  address: {
    city: { type: String },
    area: { type: String },
    pincode: { type: String },
    state: { type: String },
    full: { type: String },
  },

  // ── Documents (Tutor) ────────────────────────────────────────────────────
  documents: [{
    type: { type: String },      // 'resume', 'id', 'address_proof', 'certificate'
    name: { type: String },
    url: { type: String },
    verified: { type: Boolean, default: false },
    uploadedAt: { type: Date, default: Date.now },
  }],

  // ── KYC / Verification (Tutor) ───────────────────────────────────────────
  kycStatus: { type: String, enum: ['pending', 'submitted', 'verified', 'rejected'], default: 'pending' },
  backgroundVerified: { type: Boolean, default: false },
  idVerified: { type: Boolean, default: false },
  addressVerified: { type: Boolean, default: false },
  experienceVerified: { type: Boolean, default: false },
  referenceVerified: { type: Boolean, default: false },

  // ── Student Specific Fields ───────────────────────────────────────────────
  dob: { type: String },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  grade: { type: String },
  board: { type: String },
  school: { type: String },
  medium: { type: String },
  schedule: {
    days: [{ type: String }],
    slots: [{ type: String }],
    startDate: { type: String },
    classesPerWeek: { type: Number },
    duration: { type: String },
  },
  learningGoal: { type: String },
  specialRequirements: { type: String },
  budget: { type: Number },
  preferredTutorGender: { type: String, enum: ['Male', 'Female', 'Any'], default: 'Any' },

  // ── Wishlist (Student) ────────────────────────────────────────────────────
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // ── Referral ──────────────────────────────────────────────────────────────
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  referralCount: { type: Number, default: 0 },

  // ── Last active ───────────────────────────────────────────────────────────
  lastLoginAt: { type: Date },
  isOnline: { type: Boolean, default: false },
}, { timestamps: true });

// Indexes
userSchema.index({ role: 1, status: 1 });
userSchema.index({ role: 1, verified: 1 });
userSchema.index({ subjects: 1 });
userSchema.index({ 'address.city': 1 });
userSchema.index({ rating: -1 });
userSchema.index({ referralCode: 1 });

export const User = mongoose.model('User', userSchema);
