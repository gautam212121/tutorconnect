import mongoose from 'mongoose';

const withdrawalSchema = new mongoose.Schema({
  tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 1 },

  status: {
    type: String,
    enum: ['pending', 'approved', 'processing', 'paid', 'rejected'],
    default: 'pending'
  },

  // Bank / UPI details
  payoutMethod: { type: String, enum: ['bank', 'upi'], default: 'bank' },
  bankDetails: {
    accountName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    bankName: { type: String },
  },
  upiId: { type: String },

  // Processing
  processedAt: { type: Date },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // admin who approved
  transactionId: { type: String }, // bank transaction reference
  rejectionReason: { type: String },

  // Display ID
  payoutDisplayId: { type: String, unique: true },
}, { timestamps: true });

withdrawalSchema.pre('save', async function(next) {
  if (!this.payoutDisplayId) {
    const count = await mongoose.model('Withdrawal').countDocuments();
    this.payoutDisplayId = `#TC${(9800 + count + 1).toString()}`;
  }
  next();
});

withdrawalSchema.index({ tutor: 1, status: 1 });
withdrawalSchema.index({ createdAt: -1 });

export const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);
