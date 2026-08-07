import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'tutor', 'admin'], default: 'student' },
  avatar: { type: String },
  status: { type: String, enum: ['active', 'inactive', 'blocked'], default: 'active' },
  // Tutor specific fields
  headline: { type: String },
  bio: { type: String },
  price: { type: Number },
  priceMax: { type: Number },
  experience: { type: String },
  location: { type: String },
  subjects: [{ type: String }],
  mode: [{ type: String }], // 'Online', 'Home Tutor'
  verified: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  googleId: { type: String },
  rating: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
  
  // New Registration Fields
  mobile: { type: String },
  qualification: { type: String },
  classesTaught: [{ type: String }],
  languages: [{ type: String }],
  feeType: { type: String, enum: ['Hourly', 'Monthly'], default: 'Hourly' },
  availableDays: [{ type: String }],
  availableTimeSlots: { type: String },
  address: {
    city: { type: String },
    area: { type: String },
    pincode: { type: String }
  },

  documents: [{
    type: { type: String },
    url: { type: String },
    verified: { type: Boolean, default: false }
  }],
  
  // New Student Specific Fields
  dob: { type: String },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  grade: { type: String },
  board: { type: String },
  school: { type: String },
  medium: { type: String },
  schedule: {
    days: [{ type: String }],
    slots: [{ type: String }],
    startDate: { type: String },
    classesPerWeek: { type: Number },
    duration: { type: String }
  }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
