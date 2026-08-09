import mongoose from 'mongoose';

const subscriptionPlanSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // Basic, Pro, Premium
  price: { type: Number, required: true }, // in INR
  duration: { type: Number, required: true, default: 1 }, // months
  durationLabel: { type: String, default: '1 Month' }, // display label

  // Benefits
  leadLimit: { type: Number, default: 20 }, // -1 for unlimited
  leadLimitLabel: { type: String, default: '20 Leads' }, // display
  commissionRate: { type: Number, required: true, default: 0.10 }, // 0.10 = 10%
  searchBoost: { type: Boolean, default: false },
  priorityBadge: { type: Boolean, default: false },
  premiumSupport: { type: Boolean, default: false },

  // Feature list for display
  features: [{ type: String }],

  // Admin control
  status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

export const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
