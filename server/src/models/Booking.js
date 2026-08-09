import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  requestType: {
    type: String,
    enum: ['booking', 'consultation', 'registration'],
    default: 'booking',
  },
  source: { type: String, default: 'website' },

  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  tutor:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  course:  { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },

  studentSnapshot: {
    name: { type: String },
    phone: { type: String },
    email: { type: String },
    role: { type: String },
    classLevel: { type: String },
    grade: { type: String },
    subject: { type: String },
    location: { type: String },
    mode: { type: String },
    address: { type: String },
  },

  tutorSnapshot: {
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    subject: { type: String },
  },

  // Session details
  subject:     { type: String, required: false },
  grade:       { type: String },
  examType:    { type: String },
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
    enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'Rejected', 'Declined'],
    default: 'Pending'
  },

  // Payment
  amount:           { type: Number, default: 0 },
  adminRate:        { type: Number, default: 0.2 },
  tutorRate:        { type: Number, default: 0.8 },
  tutorEarning:     { type: Number, default: 0 }, // computed based on amount
  adminCommission:  { type: Number, default: 0 },
  paymentStatus:    { type: String, enum: ['Pending', 'Paid', 'Refunded', 'Failed'], default: 'Pending' },
  razorpayOrderId:  { type: String },
  razorpayPaymentId:{ type: String },
}, { timestamps: true });

export const Booking = mongoose.model('Booking', bookingSchema);
