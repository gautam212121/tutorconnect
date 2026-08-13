import { query, execute } from '../config/db.js';

function parseJson(val, fallback) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

export function formatSchedule(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    booking: row.booking,
    student: row.student,
    tutor: row.tutor,
    date: row.date,
    startTime: row.startTime,
    endTime: row.endTime,
    subject: row.subject,
    grade: row.grade,
    selectedSubjects: parseJson(row.selectedSubjects, [row.subject]),
    duration: Number(row.duration || 60),
    location: row.location,
    address: {
      full: row.addressFull || '',
      area: row.addressArea || '',
      city: row.addressCity || '',
      pincode: row.addressPincode || '',
    },
    status: row.status || 'Pending',
    notes: row.notes || '',
    adminNotes: row.adminNotes || '',
    approvedBy: row.approvedBy,
    approvedAt: row.approvedAt,
    rejectedBy: row.rejectedBy,
    rejectedAt: row.rejectedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class Schedule {
  static async find(filter = {}) {
    let sql = 'SELECT * FROM schedules WHERE 1=1';
    const params = [];
    if (filter.student) { sql += ' AND student = ?'; params.push(filter.student); }
    if (filter.tutor) { sql += ' AND tutor = ?'; params.push(filter.tutor); }
    if (filter.booking) { sql += ' AND booking = ?'; params.push(filter.booking); }
    if (filter.status) { sql += ' AND status = ?'; params.push(filter.status); }
    sql += ' ORDER BY date DESC, startTime DESC';
    const rows = await query(sql, params);
    return rows.map(formatSchedule);
  }

  static async findById(id) {
    if (!id) return null;
    const rows = await query('SELECT * FROM schedules WHERE id = ? LIMIT 1', [id]);
    return rows[0] ? formatSchedule(rows[0]) : null;
  }

  static async findOne(filter = {}) {
    if (filter.id || filter._id) return this.findById(filter.id || filter._id);
    const keys = Object.keys(filter);
    if (keys.length > 0) {
      const where = keys.map(k => `${k} = ?`).join(' AND ');
      const values = keys.map(k => filter[k]);
      const rows = await query(`SELECT * FROM schedules WHERE ${where} LIMIT 1`, values);
      return rows[0] ? formatSchedule(rows[0]) : null;
    }
    const rows = await query('SELECT * FROM schedules LIMIT 1');
    return rows[0] ? formatSchedule(rows[0]) : null;
  }

  static async create(data) {
    const {
      booking = null,
      student,
      tutor,
      date,
      startTime,
      endTime,
      subject,
      grade,
      selectedSubjects,
      duration,
      location,
      address = {},
      status = 'Pending',
      notes = '',
    } = data;

    if (!student || !tutor || !date || !startTime || !endTime) {
      throw new Error('student, tutor, date, startTime, endTime are required');
    }

    const sql = `
      INSERT INTO schedules (
        booking, student, tutor, date, startTime, endTime,
        subject, grade, selectedSubjects, duration, location,
        addressFull, addressArea, addressCity, addressPincode,
        status, notes, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const params = [
      booking,
      student,
      tutor,
      date,
      startTime,
      endTime,
      subject,
      grade,
      Array.isArray(selectedSubjects) ? JSON.stringify(selectedSubjects) : JSON.stringify([subject]),
      duration,
      location,
      address.full || '',
      address.area || '',
      address.city || '',
      address.pincode || '',
      status,
      notes,
    ];

    const result = await execute(sql, params);
    return this.findById(result.insertId);
  }

  static async findByIdAndUpdate(id, data) {
    const current = await this.findById(id);
    if (!current) return null;

    const updates = [];
    const params = [];

    if (data.date !== undefined) { updates.push('date = ?'); params.push(data.date); }
    if (data.startTime !== undefined) { updates.push('startTime = ?'); params.push(data.startTime); }
    if (data.endTime !== undefined) { updates.push('endTime = ?'); params.push(data.endTime); }
    if (data.subject !== undefined) { updates.push('subject = ?'); params.push(data.subject); }
    if (data.grade !== undefined) { updates.push('grade = ?'); params.push(data.grade); }
    if (data.selectedSubjects !== undefined) { updates.push('selectedSubjects = ?'); params.push(JSON.stringify(data.selectedSubjects)); }
    if (data.duration !== undefined) { updates.push('duration = ?'); params.push(data.duration); }
    if (data.location !== undefined) { updates.push('location = ?'); params.push(data.location); }
    if (data.address) {
      if (data.address.full !== undefined) { updates.push('addressFull = ?'); params.push(data.address.full); }
      if (data.address.area !== undefined) { updates.push('addressArea = ?'); params.push(data.address.area); }
      if (data.address.city !== undefined) { updates.push('addressCity = ?'); params.push(data.address.city); }
      if (data.address.pincode !== undefined) { updates.push('addressPincode = ?'); params.push(data.address.pincode); }
    }
    if (data.status !== undefined) { updates.push('status = ?'); params.push(data.status); }
    if (data.notes !== undefined) { updates.push('notes = ?'); params.push(data.notes); }
    if (data.adminNotes !== undefined) { updates.push('adminNotes = ?'); params.push(data.adminNotes); }
    if (data.approvedBy !== undefined) { updates.push('approvedBy = ?'); params.push(data.approvedBy); }
    if (data.approvedAt !== undefined) { updates.push('approvedAt = ?'); params.push(data.approvedAt); }
    if (data.rejectedBy !== undefined) { updates.push('rejectedBy = ?'); params.push(data.rejectedBy); }
    if (data.rejectedAt !== undefined) { updates.push('rejectedAt = ?'); params.push(data.rejectedAt); }

    if (updates.length === 0) return current;

    updates.push('updatedAt = NOW()');
    params.push(id);

    const sql = `UPDATE schedules SET ${updates.join(', ')} WHERE id = ?`;
    await execute(sql, params);

    return this.findById(id);
  }

  static async delete(id) {
    const sql = 'DELETE FROM schedules WHERE id = ?';
    const result = await execute(sql, [id]);
    return result.affectedRows > 0;
  }
}

export default Schedule;
