import mongoose from 'mongoose';

const leadDisputeSchema = new mongoose.Schema({
  lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  reason: {
    type: String,
    enum: [
      'Fake / Not Responding',
      'Wrong Location',
      'Wrong Subject',
      'Duplicate Lead',
      'Not Interested',
      'Invalid Contact',
      'Other'
    ],
    required: true
  },
  description: { type: String },

  status: {
    type: String,
    enum: ['auto-resolved', 'pending-review', 'under-review', 'escalated', 'resolved', 'rejected'],
    default: 'pending-review'
  },

  // Auto-resolution
  autoResolved: { type: Boolean, default: false },
  autoResolvedAt: { type: Date },

  // Admin resolution
  adminResolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminResolvedAt: { type: Date },
  resolution: { type: String }, // Admin's resolution note
  resolutionAction: { type: String, enum: ['replaced', 'credited', 'rejected', 'refunded'] },

  // Replacement lead (if issued)
  replacementLead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },

  // Display ID
  disputeDisplayId: { type: String, unique: true },
}, { timestamps: true });

leadDisputeSchema.pre('save', async function(next) {
  if (!this.disputeDisplayId) {
    const count = await mongoose.model('LeadDispute').countDocuments();
    this.disputeDisplayId = `#LD-${(7840 + count + 1).toString()}`;
  }
  next();
});

leadDisputeSchema.index({ tutor: 1, status: 1 });
leadDisputeSchema.index({ lead: 1 });
leadDisputeSchema.index({ createdAt: -1 });

export const LeadDispute = mongoose.model('LeadDispute', leadDisputeSchema);
