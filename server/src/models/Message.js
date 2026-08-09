import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['text', 'image', 'pdf', 'document', 'meet_link', 'notification', 'system'],
    default: 'text'
  },
  content: { type: String, required: true },
  meetUrl: { type: String },

  // File attachments (images, PDFs)
  attachments: [{
    url: { type: String },
    name: { type: String },
    type: { type: String }, // 'image/jpeg', 'application/pdf', etc.
    size: { type: Number },
  }],

  // Status
  read: { type: Boolean, default: false },
  readAt: { type: Date },
  delivered: { type: Boolean, default: false },
  deliveredAt: { type: Date },
}, { timestamps: true });

messageSchema.index({ from: 1, to: 1, createdAt: -1 });
messageSchema.index({ booking: 1, createdAt: 1 });

export const Message = mongoose.model('Message', messageSchema);
