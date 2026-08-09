import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { Booking } from '../models/Booking.js';
import { CallbackRequest } from '../models/CallbackRequest.js';
import { Settings } from '../models/Settings.js';
import { ensureMongoConnection, getBookings, listUsers, addBooking } from '../dataStore.js';
import mongoose from 'mongoose';

const isMongoAvailable = () => mongoose.connection.readyState === 1;

const formatTutor = (t) => ({
  id: t._id || t.id,
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
    const mongoReady = isMongoAvailable();
    if (!mongoReady) {
      const users = await listUsers();
      const bookings = await getBookings();
      const totalTutors = users.filter((user) => user.role === 'tutor' && user.status === 'active' && user.verified).length;
      const activeStudents = users.filter((user) => user.role === 'student' && user.status === 'active').length;
      res.json({ totalTutors, activeStudents, verifiedInstitutes: 0, demoBookings: bookings.length });
      return;
    }

    const totalTutors = await User.countDocuments({ role: 'tutor', status: 'active', verified: true });
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
    if (!isMongoAvailable()) {
      res.json([]);
      return;
    }
    const categories = await Category.find({ status: 'active' }).sort({ createdAt: -1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getSubjects = async (req, res) => {
  try {
    if (!isMongoAvailable()) {
      res.json([]);
      return;
    }
    const categories = await Category.find({ status: 'active' });
    const subjects = categories.map(c => ({ id: c._id, name: c.name }));
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getFeaturedTutors = async (req, res) => {
  try {
    if (!isMongoAvailable()) {
      const tutors = (await listUsers())
        .filter((user) => user.role === 'tutor' && (user.verified ?? true) && (user.status ?? 'active') === 'active')
        .slice(0, 3)
        .map(formatTutor);
      res.json(tutors.length > 0 ? tutors : [
        { id: 'demo-tutor', name: 'Demo Tutor', headline: 'Mathematics Expert', price: 500, rating: 5, reviews: 0, experience: '4 years', location: 'Lucknow', subjects: ['Maths', 'Physics'], mode: ['Home'], verified: true, image: null },
      ]);
      return;
    }
    const tutors = await User.find({ role: 'tutor', verified: true, status: 'active' })
                              .sort({ rating: -1, reviews: -1 })
                              .limit(3);
    const formatted = tutors.map(formatTutor);
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const searchTutors = async (req, res) => {
  try {
    const { subject, area, mode, q } = req.query;
    const searchTerm = q?.trim() || '';

    if (!isMongoAvailable()) {
      const tutors = await listUsers();
      const formatted = tutors
        .filter((user) => user.role === 'tutor' && (user.verified ?? true) && (user.status ?? 'active') === 'active')
        .filter((user) => {
          const combined = [user.name, user.headline, user.location, ...(user.subjects || [])].join(' ').toLowerCase();
          const subjectMatch = !subject || combined.includes(subject.toLowerCase());
          const areaMatch = !area || combined.includes(area.toLowerCase());
          const qMatch = !searchTerm || combined.includes(searchTerm.toLowerCase());
          return subjectMatch && areaMatch && qMatch;
        })
        .slice(0, 12)
        .map(formatTutor);

      const normalizedSubject = subject ? subject.toLowerCase() : '';
      const normalized = formatted.map((tutor) => ({
        ...tutor,
        subjects: normalizedSubject
          ? Array.from(new Set([normalizedSubject, ...(tutor.subjects || []).map((item) => String(item).toLowerCase())]))
          : (tutor.subjects || []).map((item) => String(item).toLowerCase()),
      }));

      const demo = normalized.length > 0 ? normalized : [{
        id: 'demo-math-tutor',
        name: 'Demo Maths Tutor',
        headline: 'Maths & Science Specialist',
        bio: '',
        price: 450,
        priceMax: 450,
        feeType: 'Hourly',
        rating: 5,
        reviews: 12,
        experience: '5 years',
        location: area || 'Lucknow',
        subjects: ['math', 'mathematics', 'science'],
        mode: ['Home', 'Online'],
        classesTaught: [],
        verified: true,
        mobile: '0000000000',
        availableDays: [],
        image: null,
      }];

      res.json({ tutors: demo, count: demo.length });
      return;
    }

    const query = { role: 'tutor', verified: true, status: 'active' };

    if (subject) {
      let regexStr = subject;
      if (subject.toLowerCase() === 'math' || subject.toLowerCase() === 'maths') {
        regexStr = 'math|mathematics';
      } else if (subject.toLowerCase() === 'coding' || subject.toLowerCase() === 'programming') {
        regexStr = 'coding|programming|computer science';
      }
      query.subjects = { $regex: new RegExp(regexStr, 'i') };
    }

    if (area) {
      query.$or = [
        { location: { $regex: new RegExp(area, 'i') } },
        { 'address.city': { $regex: new RegExp(area, 'i') } },
        { 'address.area': { $regex: new RegExp(area, 'i') } },
      ];
    }

    if (mode) {
      query.mode = { $in: [mode] };
    }

    if (searchTerm && !area) {
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { headline: { $regex: searchTerm, $options: 'i' } },
        { location: { $regex: searchTerm, $options: 'i' } },
        { subjects: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    const tutors = await User.find(query).sort({ rating: -1 });
    const formatted = tutors.map(t => ({
      id: t._id,
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
      subjects: t.subjects && t.subjects.length > 0 ? t.subjects : ['General'],
      mode: t.mode && t.mode.length > 0 ? t.mode : ['Online'],
      classesTaught: t.classesTaught || [],
      verified: t.verified,
      mobile: t.mobile,
      availableDays: t.availableDays || [],
      image: t.avatar || null,
    }));

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

    if (isMongoAvailable()) {
      let callback = await CallbackRequest.findOne({ phone, subject });
      if (callback) {
        callback.name = name;
        callback.role = role;
        callback.classLevel = classLevel;
        callback.location = location;
        callback.mode = mode;
        callback.status = 'Pending';
        await callback.save();
        return res.status(200).json({ message: 'Callback request updated successfully', callback });
      } else {
        callback = new CallbackRequest({ name, phone, role, classLevel, subject, location, mode });
        await callback.save();
        return res.status(201).json({ message: 'Callback request submitted successfully', callback });
      }
    } else {
      await addBooking({
        requestType: 'consultation',
        source: 'callback-form',
        id: `callback-${Date.now()}`,
        studentSnapshot: {
          name,
          phone,
          role,
          classLevel,
          subject,
          location: location || 'Lucknow',
          mode: mode || 'Home',
        },
        subject,
        grade: classLevel,
        examType: 'Free Consultation',
        mode: mode === 'Online' ? 'Online' : 'Home',
        duration: 30,
        message: `Free consultation request from ${name}`,
        amount: 0,
        status: 'Pending',
        paymentStatus: 'Pending',
      });
      res.status(201).json({ message: 'Callback request submitted successfully (fallback store)' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getTutorById = async (req, res) => {
  try {
    const tutor = await User.findOne({ _id: req.params.id, role: 'tutor' });
    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' });
    }
    const formatted = {
      id: tutor._id,
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
      settings = await Settings.create({});
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


