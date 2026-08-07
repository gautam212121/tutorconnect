import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // If null, it's a broadcast
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['system', 'booking', 'payment', 'review', 'approval', 'general'], default: 'general' },
  read: { type: Boolean, default: false },
  link: { type: String }
}, { timestamps: true });

export const Notification = mongoose.model('Notification', notificationSchema);
