import express from 'express';
import Schedule from '../models/Schedule.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { requireAnyRole } from '../middleware/auth.js';

const router = express.Router();

const getIo = (req) => req.app.get('io');

// ── Create Schedule ──────────────────────────────────────────────────────────
router.post('/', requireAnyRole(['student']), async (req, res) => {
  try {
    const {
      bookingId, tutorId, date, startTime, endTime,
      subject, grade, selectedSubjects, duration,
      location, address, notes
    } = req.body;

    const studentId = req.user.id;

    if (!tutorId || !date || !startTime || !endTime) {
      return res.status(400).json({ message: 'tutorId, date, startTime, endTime are required' });
    }

    // Verify tutor exists
    const tutor = await User.findById(tutorId);
    if (!tutor || tutor.role !== 'tutor') {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    const scheduleData = {
      booking: bookingId || null,
      student: studentId,
      tutor: tutorId,
      date,
      startTime,
      endTime,
      subject: subject || 'General',
      grade: grade || 'N/A',
      selectedSubjects: selectedSubjects || [subject || 'General'],
      duration: duration || 60,
      location: location || '',
      address: address || {},
      status: 'Pending',
      notes: notes || '',
    };

    const schedule = await Schedule.create(scheduleData);

    // Emit real-time event
    const io = getIo(req);
    if (io) {
      io.to(`tutor_${tutorId}`).emit('scheduleCreated', schedule);
      io.to('admin').emit('scheduleCreated', schedule);
    }

    res.status(201).json(schedule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Get My Schedules (Student) ───────────────────────────────────────────────
router.get('/my-schedules', requireAnyRole(['student']), async (req, res) => {
  try {
    const studentId = req.user.id;
    const schedules = await Schedule.find({ student: studentId });

    // Populate tutor data
    for (const s of schedules) {
      s.tutor = await User.findById(s.tutor);
    }

    res.json(schedules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Get Tutor's Student Schedules (Tutor) ────────────────────────────────────
router.get('/tutor-schedules', requireAnyRole(['tutor']), async (req, res) => {
  try {
    const tutorId = req.user.id;
    const status = req.query.status || undefined;

    const filter = { tutor: tutorId };
    if (status) filter.status = status;

    const schedules = await Schedule.find(filter);

    // Populate student data
    for (const s of schedules) {
      s.student = await User.findById(s.student);
    }

    res.json(schedules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Get Single Schedule ──────────────────────────────────────────────────────
router.get('/:id', requireAnyRole(['student', 'tutor', 'admin']), async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });

    // Authorization check
    if (req.user.role === 'student' && schedule.student !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (req.user.role === 'tutor' && schedule.tutor !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Populate related data
    schedule.student = await User.findById(schedule.student);
    schedule.tutor = await User.findById(schedule.tutor);

    res.json(schedule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Update Schedule (Student) ────────────────────────────────────────────────
router.put('/:id', requireAnyRole(['student']), async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });

    if (schedule.student !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Only allow updates if status is Pending
    if (schedule.status !== 'Pending') {
      return res.status(400).json({ message: `Cannot update ${schedule.status} schedule` });
    }

    const { date, startTime, endTime, location, address, notes } = req.body;

    const updatedSchedule = await Schedule.findByIdAndUpdate(req.params.id, {
      date: date || schedule.date,
      startTime: startTime || schedule.startTime,
      endTime: endTime || schedule.endTime,
      location: location !== undefined ? location : schedule.location,
      address: address || schedule.address,
      notes: notes !== undefined ? notes : schedule.notes,
    });

    // Emit real-time event
    const io = getIo(req);
    if (io) {
      io.to(`tutor_${schedule.tutor}`).emit('scheduleUpdated', updatedSchedule);
      io.to('admin').emit('scheduleUpdated', updatedSchedule);
    }

    res.json(updatedSchedule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Approve Schedule (Admin) ─────────────────────────────────────────────────
router.post('/:id/approve', requireAnyRole(['admin']), async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });

    const { adminNotes } = req.body;

    const updatedSchedule = await Schedule.findByIdAndUpdate(req.params.id, {
      status: 'Approved',
      approvedBy: req.user.id,
      approvedAt: new Date(),
      adminNotes: adminNotes || '',
    });

    // Emit real-time events
    const io = getIo(req);
    if (io) {
      io.to(`student_${schedule.student}`).emit('scheduleApproved', updatedSchedule);
      io.to(`tutor_${schedule.tutor}`).emit('scheduleApproved', updatedSchedule);
      io.to('admin').emit('scheduleApproved', updatedSchedule);
    }

    res.json(updatedSchedule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Reject Schedule (Admin) ──────────────────────────────────────────────────
router.post('/:id/reject', requireAnyRole(['admin']), async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });

    const { adminNotes } = req.body;

    const updatedSchedule = await Schedule.findByIdAndUpdate(req.params.id, {
      status: 'Rejected',
      rejectedBy: req.user.id,
      rejectedAt: new Date(),
      adminNotes: adminNotes || '',
    });

    // Emit real-time events
    const io = getIo(req);
    if (io) {
      io.to(`student_${schedule.student}`).emit('scheduleRejected', updatedSchedule);
      io.to(`tutor_${schedule.tutor}`).emit('scheduleRejected', updatedSchedule);
      io.to('admin').emit('scheduleRejected', updatedSchedule);
    }

    res.json(updatedSchedule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Cancel Schedule (Student/Tutor) ──────────────────────────────────────────
router.post('/:id/cancel', requireAnyRole(['student', 'tutor']), async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });

    // Authorization check
    if (req.user.role === 'student' && schedule.student !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (req.user.role === 'tutor' && schedule.tutor !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedSchedule = await Schedule.findByIdAndUpdate(req.params.id, {
      status: 'Cancelled',
    });

    // Emit real-time events
    const io = getIo(req);
    if (io) {
      io.to(`student_${schedule.student}`).emit('scheduleCancelled', updatedSchedule);
      io.to(`tutor_${schedule.tutor}`).emit('scheduleCancelled', updatedSchedule);
      io.to('admin').emit('scheduleCancelled', updatedSchedule);
    }

    res.json(updatedSchedule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Get All Schedules (Admin) ────────────────────────────────────────────────
router.get('/', requireAnyRole(['admin']), async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const schedules = await Schedule.find(filter);

    // Populate related data
    for (const s of schedules) {
      s.student = await User.findById(s.student);
      s.tutor = await User.findById(s.tutor);
    }

    res.json(schedules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
