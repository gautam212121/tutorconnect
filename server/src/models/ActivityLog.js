import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  category: {
    type: String,
    enum: ['auth', 'booking', 'payment', 'lead', 'dispute', 'subscription', 'payout', 'admin', 'profile', 'system'],
    default: 'system'
  },
  details: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed }, // Flexible extra data
  ip: { type: String },
  userAgent: { type: String },
  targetModel: { type: String }, // e.g., 'User', 'Lead', 'Booking'
  targetId: { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ category: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 });

// TTL index — auto-delete logs older than 90 days (configurable)
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
