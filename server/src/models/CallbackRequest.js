import mongoose from 'mongoose';

const callbackRequestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher'], default: 'student' },
  classLevel: { type: String, required: true },
  subject: { type: String, required: true },
  location: { type: String, default: 'Lucknow' },
  mode: { type: String, enum: ['Home', 'Online', 'Both'], default: 'Home' },
  tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['Pending', 'Called', 'Confirmed', 'Completed', 'Declined', 'Cancelled'], default: 'Pending' }
}, { timestamps: true });

export const CallbackRequest = mongoose.model('CallbackRequest', callbackRequestSchema);
