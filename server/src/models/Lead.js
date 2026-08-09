import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  // Who submitted the request (student/parent)
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Which tutor this lead was delivered to
  tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Lead details
  subject: { type: String, required: true },
  classLevel: { type: String, required: true },
  board: { type: String },
  location: {
    city: { type: String },
    area: { type: String },
    pincode: { type: String },
    full: { type: String }
  },
  mode: { type: String, enum: ['Home', 'Online', 'Both'], default: 'Home' },
  budget: { type: Number },
  preferredGender: { type: String, enum: ['Male', 'Female', 'Any'], default: 'Any' },
  message: { type: String },
  preferredTiming: { type: String },
  weeklyDays: [{ type: String }],

  // Verification
  isOtpVerified: { type: Boolean, default: false },
  studentPhone: { type: String },
  studentEmail: { type: String },

  // Lead lifecycle
  status: {
    type: String,
    enum: ['new', 'contacted', 'responded', 'converted', 'expired', 'replaced', 'disputed', 'fake'],
    default: 'new'
  },
  source: { type: String, enum: ['search', 'admin', 'auto', 'booking'], default: 'search' },

  // Timestamps for lifecycle tracking
  deliveredAt: { type: Date, default: Date.now },
  contactedAt: { type: Date },
  respondedAt: { type: Date },
  convertedAt: { type: Date },

  // Dispute tracking
  disputeReason: { type: String },
  disputedAt: { type: Date },
  replacementLeadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },

  // Was this a free-tier lead or paid?
  isFreeLeadSlot: { type: Boolean, default: true },

  // Linked booking (if converted)
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },

  // Lead ID for display (e.g., #LD-7845)
  leadDisplayId: { type: String, unique: true },
}, { timestamps: true });

// Auto-generate display ID
leadSchema.pre('save', async function(next) {
  if (!this.leadDisplayId) {
    const count = await mongoose.model('Lead').countDocuments();
    this.leadDisplayId = `#LD-${(7840 + count + 1).toString()}`;
  }
  next();
});

// Indexes for efficient queries
leadSchema.index({ tutor: 1, status: 1 });
leadSchema.index({ student: 1 });
leadSchema.index({ deliveredAt: -1 });
leadSchema.index({ status: 1, createdAt: -1 });

export const Lead = mongoose.model('Lead', leadSchema);
