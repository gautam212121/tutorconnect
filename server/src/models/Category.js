import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  image: { type: String },
  description: { type: String },
  priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  // Real world applications might keep these dynamic via aggregation, 
  // but caching them in the document is fine if we update them on hooks.
  // We'll calculate them dynamically in the controller for accuracy.
}, { timestamps: true });

export const Category = mongoose.model('Category', categorySchema);
