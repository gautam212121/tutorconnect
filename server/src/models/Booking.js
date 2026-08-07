import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tutor:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course:  { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },

  // Session details
  subject:     { type: String, required: true },
  mode:        { type: String, enum: ['Home', 'Online'], default: 'Home' },
  scheduledAt: { type: Date },
  duration:    { type: Number, default: 60 }, // minutes
  message:     { type: String },

  // For home visits
  address: {
    full:    { type: String },
    area:    { type: String },
    city:    { type: String },
    pincode: { type: String },
  },

  // For online sessions
  meetLink: { type: String },

  // Status
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'Rejected'],
    default: 'Pending'
  },

  // Payment
  amount:           { type: Number, default: 0 },
  tutorEarning:     { type: Number, default: 0 }, // 80%
  adminCommission:  { type: Number, default: 0 }, // 20%
  paymentStatus:    { type: String, enum: ['Pending', 'Paid', 'Refunded', 'Failed'], default: 'Pending' },
  razorpayOrderId:  { type: String },
  razorpayPaymentId:{ type: String },
}, { timestamps: true });

export const Booking = mongoose.model('Booking', bookingSchema);
