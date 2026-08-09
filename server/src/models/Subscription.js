import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },

  startDate: { type: Date, required: true, default: Date.now },
  endDate: { type: Date, required: true },

  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'pending'],
    default: 'pending'
  },

  // Payment tracking
  amount: { type: Number, required: true },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySubscriptionId: { type: String },

  // Benefits snapshot at time of subscription
  leadLimit: { type: Number },
  commissionRate: { type: Number },

  // Auto-renewal
  autoRenew: { type: Boolean, default: false },
  cancelledAt: { type: Date },
  cancelReason: { type: String },
}, { timestamps: true });

subscriptionSchema.index({ tutor: 1, status: 1 });
subscriptionSchema.index({ endDate: 1 });

export const Subscription = mongoose.model('Subscription', subscriptionSchema);
