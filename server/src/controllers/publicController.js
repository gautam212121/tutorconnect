import User from '../models/User.js';
import Category from '../models/Category.js';
import Booking from '../models/Booking.js';
import CallbackRequest from '../models/CallbackRequest.js';
import Settings from '../models/Settings.js';
import { execute } from '../config/db.js';

const formatTutor = (t) => ({
  id: t.id,
  name: t.name,
  headline: t.headline || 'Tutor',
  price: t.price || 500,
  rating: t.rating || 0,
  reviews: t.reviews || 0,
  experience: t.experience || '1 year',
  location: t.location || 'Online',
  subjects: t.subjects && t.subjects.length > 0
    ? t.subjects.map((subject) => String(subject).toLowerCase())
    : ['general'],
  mode: t.mode && t.mode.length > 0 ? t.mode : ['Online'],
  verified: t.verified,
  image: t.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
});

export const getPlatformStats = async (req, res) => {
  try {
    const totalTutors = await User.countDocuments({ role: 'tutor', status: 'active' });
    const activeStudents = await User.countDocuments({ role: 'student', status: 'active' });
    const demoBookings = await Booking.countDocuments();
    res.json({
      totalTutors,
      activeStudents,
      verifiedInstitutes: 0,
      demoBookings,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ status: 'active' });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getSubjects = async (req, res) => {
  try {
    const categories = await Category.find({ status: 'active' });
    const subjects = categories.map(c => ({
      id: c.id,
      name: c.name,
      image: c.image || null,
      description: c.description || '',
      priority: c.priority || 'Medium',
    }));
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getFeaturedTutors = async (req, res) => {
  try {
    const tutors = await User.find({ role: 'tutor', status: 'active' });
    const formatted = tutors.slice(0, 3).map(formatTutor);
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const searchTutors = async (req, res) => {
  try {
    const { subject, area, mode, q } = req.query;
    const searchTerm = q?.trim() || '';

    const tutors = await User.find({ role: 'tutor', status: 'active' });

    const filtered = tutors.filter((t) => {
      const combined = [t.name, t.headline, t.location, ...(t.subjects || [])].join(' ').toLowerCase();
      const subjectMatch = !subject || combined.includes(subject.toLowerCase());
      const areaMatch = !area || combined.includes(area.toLowerCase());
      const qMatch = !searchTerm || combined.includes(searchTerm.toLowerCase());
      return subjectMatch && areaMatch && qMatch;
    });

    const normalizedSubject = subject ? subject.toLowerCase() : '';
    const formatted = filtered.map(t => {
      const subs = (t.subjects && t.subjects.length > 0 ? t.subjects : ['General']).map(s => String(s).toLowerCase());
      if (normalizedSubject && !subs.includes(normalizedSubject)) {
        subs.push(normalizedSubject);
      }
      return {
        id: t.id,
        name: t.name,
        headline: t.headline || 'Home Tutor',
        bio: t.bio || '',
        price: t.price || 500,
        priceMax: t.priceMax || t.price || 500,
        feeType: t.feeType || 'Hourly',
        rating: t.rating || 0,
        reviews: t.reviews || 0,
        experience: t.experience || '1 year',
        location: t.location || 'Online',
        subjects: subs,
        mode: t.mode && t.mode.length > 0 ? t.mode : ['Online'],
        classesTaught: t.classesTaught || [],
        verified: t.verified,
        mobile: t.mobile,
        availableDays: t.availableDays || [],
        image: t.avatar || null,
      };
    });

    res.json({ tutors: formatted, count: formatted.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Subject category not found' });
    }
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const saveCallbackRequest = async (req, res) => {
  try {
    const { name, phone, role, classLevel, subject, location, mode } = req.body;
    if (!name || !phone || !role || !classLevel || !subject) {
      return res.status(400).json({ message: 'name, phone, role, classLevel, and subject are required' });
    }

    const callbacks = await CallbackRequest.find();
    let callback = callbacks.find(c => c.phone === phone && c.subject === subject);

    if (callback) {
      await execute(
        'UPDATE callback_requests SET name = ?, role = ?, classLevel = ?, location = ?, mode = ?, status = ? WHERE id = ?',
        [name, role, classLevel, location || 'Lucknow', mode || 'Home', 'Pending', callback.id]
      );
      const updated = await CallbackRequest.findById(callback.id);
      return res.status(200).json({ message: 'Callback request updated successfully', callback: updated });
    } else {
      callback = await CallbackRequest.create({ name, phone, role, classLevel, subject, location: location || 'Lucknow', mode: mode || 'Home' });
      return res.status(201).json({ message: 'Callback request submitted successfully', callback });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getTutorById = async (req, res) => {
  try {
    const tutor = await User.findById(req.params.id);
    if (!tutor || tutor.role !== 'tutor') {
      return res.status(404).json({ message: 'Tutor not found' });
    }
    const formatted = {
      id: tutor.id,
      name: tutor.name,
      headline: tutor.headline || 'Tutor',
      bio: tutor.bio || '',
      price: tutor.price || 500,
      priceMax: tutor.priceMax || tutor.price || 500,
      rating: tutor.rating || 0,
      reviews: tutor.reviews || 0,
      experience: tutor.experience || '1 year',
      location: tutor.location || 'Online',
      subjects: tutor.subjects && tutor.subjects.length > 0 ? tutor.subjects : ['General'],
      classesTaught: tutor.classesTaught || [],
      mode: tutor.mode && tutor.mode.length > 0 ? tutor.mode : ['Online'],
      verified: tutor.verified,
      image: tutor.avatar || null,
      qualification: tutor.qualification || 'B.Tech',
      availableDays: tutor.availableDays || [],
      availableTimeSlots: tutor.availableTimeSlots || '09:00 - 18:00',
      address: tutor.address || {},
      feeType: tutor.feeType || 'Hourly',
      dob: tutor.dob || '',
      languages: tutor.languages || ['English', 'Hindi'],
    };
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPublicSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.findOneAndUpdate({}, {});
    }
    res.json({
      platformName: settings.platformName || 'TutorConnect',
      supportEmail: settings.supportEmail || 'support@tutorconnect.com',
      heroTitle: settings.heroTitle || 'Quality Home Tuition',
      heroSubtitle: settings.heroSubtitle || 'Verified tutors at your doorstep',
      heroImage: settings.heroImage || '/hero-banner.jpg',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
