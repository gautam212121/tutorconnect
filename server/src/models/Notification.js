import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null = broadcast
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: [
      'system', 'booking', 'payment', 'review', 'approval',
      'lead', 'lead_dispute', 'subscription', 'payout',
      'session_reminder', 'chat', 'general'
    ],
    default: 'general'
  },
  read: { type: Boolean, default: false },
  readAt: { type: Date },
  link: { type: String },
  icon: { type: String }, // emoji or icon name
  metadata: { type: mongoose.Schema.Types.Mixed }, // flexible extra data
}, { timestamps: true });

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
