import { query, execute } from '../config/db.js';

function parseJson(val, fallback) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

export function formatLead(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    student: row.student,
    tutor: row.tutor,
    subject: row.subject,
    classLevel: row.classLevel,
    board: row.board,
    location: {
      city: row.locationCity || '',
      area: row.locationArea || '',
      pincode: row.locationPincode || '',
      full: row.locationFull || '',
    },
    mode: row.mode || 'Home',
    budget: row.budget != null ? Number(row.budget) : undefined,
    preferredGender: row.preferredGender || 'Any',
    message: row.message,
    preferredTiming: row.preferredTiming,
    weeklyDays: parseJson(row.weeklyDays, []),
    isOtpVerified: Boolean(row.isOtpVerified),
    studentPhone: row.studentPhone,
    studentEmail: row.studentEmail,
    status: row.status || 'new',
    source: row.source || 'search',
    deliveredAt: row.deliveredAt,
    contactedAt: row.contactedAt,
    respondedAt: row.respondedAt,
    convertedAt: row.convertedAt,
    disputeReason: row.disputeReason,
    disputedAt: row.disputedAt,
    replacementLeadId: row.replacementLeadId,
    isFreeLeadSlot: Boolean(row.isFreeLeadSlot),
    booking: row.booking,
    leadDisplayId: row.leadDisplayId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class Lead {
  static async find(filter = {}) {
    let sql = 'SELECT * FROM leads WHERE 1=1';
    const params = [];
    if (filter.tutor) { sql += ' AND tutor = ?'; params.push(filter.tutor); }
    if (filter.student) { sql += ' AND student = ?'; params.push(filter.student); }
    if (filter.status) { sql += ' AND status = ?'; params.push(filter.status); }
    sql += ' ORDER BY id DESC';
    const rows = await query(sql, params);
    return rows.map(formatLead);
  }

  static async findById(id) {
    if (!id) return null;
    const rows = await query('SELECT * FROM leads WHERE id = ? LIMIT 1', [id]);
    return rows[0] ? formatLead(rows[0]) : null;
  }

  static async create(data) {
    const countRows = await query('SELECT COUNT(*) as count FROM leads');
    const count = countRows[0] ? Number(countRows[0].count) : 0;
    const leadDisplayId = data.leadDisplayId || `#LD-${(7840 + count + 1).toString()}`;

    const {
      student, tutor, subject, classLevel, board, location = {}, mode = 'Home', budget,
      preferredGender = 'Any', message, preferredTiming, weeklyDays, isOtpVerified = false,
      studentPhone, studentEmail, status = 'new', source = 'search', isFreeLeadSlot = true,
      booking, replacementLeadId
    } = data;

    const sql = `INSERT INTO leads (
      student, tutor, subject, classLevel, board, locationCity, locationArea,
      locationPincode, locationFull, mode, budget, preferredGender, message,
      preferredTiming, weeklyDays, isOtpVerified, studentPhone, studentEmail,
      status, source, isFreeLeadSlot, booking, replacementLeadId, leadDisplayId
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
      student, tutor, subject, classLevel, board || null, location.city || null,
      location.area || null, location.pincode || null, location.full || null, mode,
      budget || null, preferredGender, message || null, preferredTiming || null,
      weeklyDays ? JSON.stringify(weeklyDays) : null, isOtpVerified ? 1 : 0,
      studentPhone || null, studentEmail || null, status, source, isFreeLeadSlot ? 1 : 0,
      booking || null, replacementLeadId || null, leadDisplayId
    ];

    const res = await execute(sql, params);
    return this.findById(res.insertId);
  }

  static async findByIdAndUpdate(id, updates = {}) {
    if (!id) return null;
    const lead = await this.findById(id);
    if (!lead) return null;

    const fields = [];
    const params = [];

    if (updates.status !== undefined) { fields.push('status = ?'); params.push(updates.status); }
    if (updates.contactedAt !== undefined) { fields.push('contactedAt = ?'); params.push(updates.contactedAt); }
    if (updates.respondedAt !== undefined) { fields.push('respondedAt = ?'); params.push(updates.respondedAt); }
    if (updates.convertedAt !== undefined) { fields.push('convertedAt = ?'); params.push(updates.convertedAt); }
    if (updates.disputeReason !== undefined) { fields.push('disputeReason = ?'); params.push(updates.disputeReason); }
    if (updates.disputedAt !== undefined) { fields.push('disputedAt = ?'); params.push(updates.disputedAt); }
    if (updates.replacementLeadId !== undefined) { fields.push('replacementLeadId = ?'); params.push(updates.replacementLeadId); }
    if (updates.booking !== undefined) { fields.push('booking = ?'); params.push(updates.booking); }

    if (fields.length === 0) return lead;

    params.push(id);
    await execute(`UPDATE leads SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  }

  static async countDocuments(filter = {}) {
    let sql = 'SELECT COUNT(*) as count FROM leads WHERE 1=1';
    const params = [];
    if (filter.status) { sql += ' AND status = ?'; params.push(filter.status); }
    if (filter.tutor) { sql += ' AND tutor = ?'; params.push(filter.tutor); }
    if (filter.student) { sql += ' AND student = ?'; params.push(filter.student); }
    const rows = await query(sql, params);
    return rows[0] ? Number(rows[0].count) : 0;
  }
}

export default Lead;
