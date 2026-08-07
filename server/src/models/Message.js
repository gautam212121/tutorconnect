import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  booking:  { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  from:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:     { type: String, enum: ['text', 'meet_link', 'notification'], default: 'text' },
  content:  { type: String, required: true },
  meetUrl:  { type: String },
  read:     { type: Boolean, default: false },
}, { timestamps: true });

export const Message = mongoose.model('Message', messageSchema);
