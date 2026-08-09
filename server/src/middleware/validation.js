export const validateBookingPayload = (req, res, next) => {
  const {
    studentId,
    tutorId,
    subject,
    grade,
    examType,
    mode,
    scheduledAt,
    duration,
    amount,
    address,
  } = req.body;

  if (!studentId || !tutorId || !subject || !grade || !examType || !amount) {
    return res.status(400).json({ message: 'studentId, tutorId, subject, grade, examType and amount are required' });
  }

  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ message: 'amount must be a positive number' });
  }

  if (duration && (typeof duration !== 'number' || duration <= 0)) {
    return res.status(400).json({ message: 'duration must be a positive number' });
  }

  if (address && typeof address !== 'object') {
    return res.status(400).json({ message: 'address must be a valid object' });
  }

  return next();
};
