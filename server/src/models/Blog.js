import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  excerpt: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    default: 'Educator'
  },
  readTime: {
    type: String,
    default: '5 min read'
  },
  image: {
    type: String,
    default: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=60'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const Blog = mongoose.model('Blog', blogSchema);
