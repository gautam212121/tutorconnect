import mongoose from 'mongoose';

const careerSchema = new mongoose.Schema({
  // 1. Personal Information
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  gender: { type: String },
  dob: { type: String },
  address: {
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    full: { type: String }
  },

  // 2. Education
  education: {
    highestQualification: { type: String },
    degree: { type: String },
    college: { type: String },
    passingYear: { type: String },
    percentage: { type: String }
  },

  // 3. Teaching Details
  teaching: {
    subjects: [{ type: String }],
    classes: [{ type: String }],
    boards: [{ type: String }],
    medium: [{ type: String }],
    mode: [{ type: String }],
    individualOrGroup: { type: String }
  },

  // 4. Experience
  experienceDetails: {
    type: { type: String }, // Fresher / Experienced
    totalExperience: { type: String },
    previousSchool: { type: String },
    onlineExperience: { type: String },
    homeTuitionExperience: { type: String }
  },

  // 5. Availability
  availability: {
    availableDays: [{ type: String }],
    timeSlots: [{ type: String }],
    canTravel: { type: Boolean },
    maxDistance: { type: String }
  },

  // 6. Fees
  fees: {
    hourly: { type: Number },
    monthly: { type: Number },
    negotiable: { type: Boolean }
  },

  // 7. Skills & Languages
  skills: {
    languages: [{ type: String }],
    certifications: { type: String },
    computerSkills: { type: String },
    communicationSkills: { type: String }
  },

  // 8. Documents
  documents: {
    resumeUrl: { type: String },
    photoUrl: { type: String },
    idUrl: { type: String }
  },

  status: { type: String, enum: ['pending', 'under review', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true });

export const Career = mongoose.model('Career', careerSchema);
