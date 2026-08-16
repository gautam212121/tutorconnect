import { query, execute } from '../config/db.js';

export function formatSupportTicket(row) {
  if (!row) return null;
  return {
    id: row.id || row._id,
    studentId: row.studentId,
    subject: row.subject,
    message: row.message,
    status: row.status || 'Open',
    adminReply: row.adminReply,
    repliedAt: row.repliedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class SupportTicket {
  static async find(filter = {}) {
    let sql = 'SELECT * FROM support_tickets WHERE 1=1';
    const params = [];
    if (filter.studentId) { sql += ' AND studentId = ?'; params.push(filter.studentId); }
    if (filter.status) { sql += ' AND status = ?'; params.push(filter.status); }
    sql += ' ORDER BY id DESC';
    const rows = await query(sql, params);
    return rows.map(formatSupportTicket);
  }

  static async findById(id) {
    if (!id) return null;
    const rows = await query('SELECT * FROM support_tickets WHERE id = ? LIMIT 1', [id]);
    return rows[0] ? formatSupportTicket(rows[0]) : null;
  }

  static async create(data) {
    const { studentId, subject, message, status = 'Open' } = data;
    const sql = `INSERT INTO support_tickets (studentId, subject, message, status) VALUES (?, ?, ?, ?)`;
    const params = [studentId, subject, message, status];
    const res = await execute(sql, params);
    return this.findById(res.insertId);
  }

  static async update(id, data) {
    const fields = [];
    const params = [];
    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      params.push(value === undefined ? null : value);
    }
    if (fields.length === 0) return this.findById(id);
    params.push(id);
    const sql = `UPDATE support_tickets SET ${fields.join(', ')} WHERE id = ?`;
    await execute(sql, params);
    return this.findById(id);
  }

  static async delete(id) {
    await execute('DELETE FROM support_tickets WHERE id = ?', [id]);
    return true;
  }
}

export default SupportTicket;
