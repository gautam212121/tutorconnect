import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  booking:        { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  student:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tutor:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  totalAmount:    { type: Number, required: true },
  tutorShare:     { type: Number, required: true },   // 80%
  adminShare:     { type: Number, required: true },   // 20%

  status:         { type: String, enum: ['Pending', 'Completed', 'Refunded', 'Failed'], default: 'Pending' },
  method:         { type: String, enum: ['Razorpay', 'Cash', 'Mock'], default: 'Razorpay' },

  razorpayOrderId:   { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
}, { timestamps: true });

export const Payment = mongoose.model('Payment', paymentSchema);
