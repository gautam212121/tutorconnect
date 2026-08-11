import { query, execute } from '../config/db.js';

export function formatCallbackRequest(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    phone: row.phone,
    role: row.role || 'student',
    classLevel: row.classLevel,
    subject: row.subject,
    location: row.location || 'Lucknow',
    mode: row.mode || 'Home',
    tutor: row.tutor,
    status: row.status || 'Pending',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class CallbackRequest {
  static async find(filter = {}) {
    let sql = 'SELECT * FROM callback_requests WHERE 1=1';
    const params = [];
    if (filter.status) { sql += ' AND status = ?'; params.push(filter.status); }
    if (filter.tutor) { sql += ' AND tutor = ?'; params.push(filter.tutor); }
    sql += ' ORDER BY id DESC';
    const rows = await query(sql, params);
    return rows.map(formatCallbackRequest);
  }

  static async findById(id) {
    if (!id) return null;
    const rows = await query('SELECT * FROM callback_requests WHERE id = ? LIMIT 1', [id]);
    return rows[0] ? formatCallbackRequest(rows[0]) : null;
  }

  static async create(data) {
    const { name, phone, role = 'student', classLevel, subject, location = 'Lucknow', mode = 'Home', tutor, status = 'Pending' } = data;
    const sql = `INSERT INTO callback_requests (name, phone, role, classLevel, subject, location, mode, tutor, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [name, phone, role, classLevel, subject, location, mode, tutor || null, status];
    const res = await execute(sql, params);
    return this.findById(res.insertId);
  }

  static async findByIdAndUpdate(id, updates = {}) {
    if (!id) return null;
    const item = await this.findById(id);
    if (!item) return null;

    const fields = [];
    const params = [];

    if (updates.status !== undefined) { fields.push('status = ?'); params.push(updates.status); }

    if (fields.length === 0) return item;

    params.push(id);
    await execute(`UPDATE callback_requests SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  }
}

export default CallbackRequest;
