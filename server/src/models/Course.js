import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  subject: { type: String, required: true },
  classLevel: { type: String },
  price: { type: Number, required: true },
  duration: { type: String }, // e.g., "3 Months", "40 Hours"
  mode: { type: String, enum: ['Online', 'Home', 'Hybrid'], default: 'Online' },
  status: { type: String, enum: ['active', 'draft', 'archived'], default: 'active' },
  tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  enrollments: { type: Number, default: 0 },
  thumbnail: { type: String }
}, { timestamps: true });

export const Course = mongoose.model('Course', courseSchema);
