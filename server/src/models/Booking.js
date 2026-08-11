import { query, execute } from '../config/db.js';

function parseJson(val, fallback) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

export function formatBooking(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    requestType: row.requestType || 'booking',
    source: row.source || 'website',
    student: row.student,
    tutor: row.tutor,
    course: row.course,
    studentSnapshot: parseJson(row.studentSnapshot, {}),
    tutorSnapshot: parseJson(row.tutorSnapshot, {}),
    subject: row.subject,
    grade: row.grade,
    examType: row.examType,
    mode: row.mode || 'Home',
    scheduledAt: row.scheduledAt,
    duration: Number(row.duration || 60),
    message: row.message,
    address: {
      full: row.addressFull || '',
      area: row.addressArea || '',
      city: row.addressCity || '',
      pincode: row.addressPincode || '',
    },
    meetLink: row.meetLink,
    status: row.status || 'Pending',
    amount: Number(row.amount || 0),
    adminRate: Number(row.adminRate || 0.20),
    tutorRate: Number(row.tutorRate || 0.80),
    tutorEarning: Number(row.tutorEarning || 0),
    adminCommission: Number(row.adminCommission || 0),
    paymentStatus: row.paymentStatus || 'Pending',
    razorpayOrderId: row.razorpayOrderId,
    razorpayPaymentId: row.razorpayPaymentId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class Booking {
  static async find(filter = {}) {
    let sql = 'SELECT * FROM bookings WHERE 1=1';
    const params = [];
    if (filter.student) { sql += ' AND student = ?'; params.push(filter.student); }
    if (filter.tutor) { sql += ' AND tutor = ?'; params.push(filter.tutor); }
    if (filter.status) { sql += ' AND status = ?'; params.push(filter.status); }
    if (filter.paymentStatus) { sql += ' AND paymentStatus = ?'; params.push(filter.paymentStatus); }
    sql += ' ORDER BY id DESC';
    const rows = await query(sql, params);
    return rows.map(formatBooking);
  }

  static async findById(id) {
    if (!id) return null;
    const rows = await query('SELECT * FROM bookings WHERE id = ? LIMIT 1', [id]);
    return rows[0] ? formatBooking(rows[0]) : null;
  }

  static async findOne(filter = {}) {
    if (filter.id || filter._id) return this.findById(filter.id || filter._id);
    const keys = Object.keys(filter);
    if (keys.length > 0) {
      const where = keys.map(k => `${k} = ?`).join(' AND ');
      const values = keys.map(k => filter[k]);
      const rows = await query(`SELECT * FROM bookings WHERE ${where} LIMIT 1`, values);
      return rows[0] ? formatBooking(rows[0]) : null;
    }
    const rows = await query('SELECT * FROM bookings LIMIT 1');
    return rows[0] ? formatBooking(rows[0]) : null;
  }

  static async create(data) {
    const {
      requestType = 'booking', source = 'website', student, tutor, course,
      studentSnapshot, tutorSnapshot, subject, grade, examType, mode = 'Home',
      scheduledAt, duration = 60, message, address = {}, meetLink, status = 'Pending',
      amount = 0, adminRate = 0.20, tutorRate = 0.80, tutorEarning = 0,
      adminCommission = 0, paymentStatus = 'Pending', razorpayOrderId, razorpayPaymentId
    } = data;

    const sql = `INSERT INTO bookings (
      requestType, source, student, tutor, course, studentSnapshot, tutorSnapshot,
      subject, grade, examType, mode, scheduledAt, duration, message,
      addressFull, addressArea, addressCity, addressPincode, meetLink, status,
      amount, adminRate, tutorRate, tutorEarning, adminCommission, paymentStatus,
      razorpayOrderId, razorpayPaymentId
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
      requestType, source, student || null, tutor || null, course || null,
      studentSnapshot ? JSON.stringify(studentSnapshot) : null,
      tutorSnapshot ? JSON.stringify(tutorSnapshot) : null,
      subject || null, grade || null, examType || null, mode,
      scheduledAt || null, duration, message || null,
      address.full || null, address.area || null, address.city || null, address.pincode || null,
      meetLink || null, status, amount, adminRate, tutorRate, tutorEarning, adminCommission,
      paymentStatus, razorpayOrderId || null, razorpayPaymentId || null
    ];

    const res = await execute(sql, params);
    return this.findById(res.insertId);
  }

  static async findByIdAndUpdate(id, updates = {}) {
    if (!id) return null;
    const booking = await this.findById(id);
    if (!booking) return null;

    const fields = [];
    const params = [];

    if (updates.status !== undefined) { fields.push('status = ?'); params.push(updates.status); }
    if (updates.paymentStatus !== undefined) { fields.push('paymentStatus = ?'); params.push(updates.paymentStatus); }
    if (updates.amount !== undefined) { fields.push('amount = ?'); params.push(updates.amount); }
    if (updates.meetLink !== undefined) { fields.push('meetLink = ?'); params.push(updates.meetLink); }
    if (updates.tutorEarning !== undefined) { fields.push('tutorEarning = ?'); params.push(updates.tutorEarning); }
    if (updates.adminCommission !== undefined) { fields.push('adminCommission = ?'); params.push(updates.adminCommission); }
    if (updates.razorpayPaymentId !== undefined) { fields.push('razorpayPaymentId = ?'); params.push(updates.razorpayPaymentId); }
    if (updates.razorpayOrderId !== undefined) { fields.push('razorpayOrderId = ?'); params.push(updates.razorpayOrderId); }

    if (fields.length === 0) return booking;

    params.push(id);
    await execute(`UPDATE bookings SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  }

  static async countDocuments(filter = {}) {
    let sql = 'SELECT COUNT(*) as count FROM bookings WHERE 1=1';
    const params = [];
    if (filter.status) { sql += ' AND status = ?'; params.push(filter.status); }
    if (filter.tutor) { sql += ' AND tutor = ?'; params.push(filter.tutor); }
    if (filter.student) { sql += ' AND student = ?'; params.push(filter.student); }
    const rows = await query(sql, params);
    return rows[0] ? Number(rows[0].count) : 0;
  }
}

export default Booking;
