import { query, execute } from '../config/db.js';

export function formatOTP(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    email: row.email,
    otp: row.otp,
    expiresAt: row.expiresAt,
    used: Boolean(row.used),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class OTP {
  static async findOne(filter = {}) {
    let sql = 'SELECT * FROM otps WHERE 1=1';
    const params = [];
    if (filter.email) { sql += ' AND email = ?'; params.push(filter.email); }
    if (filter.otp) { sql += ' AND otp = ?'; params.push(filter.otp); }
    if (filter.used !== undefined) { sql += ' AND used = ?'; params.push(filter.used ? 1 : 0); }
    sql += ' ORDER BY id DESC LIMIT 1';
    const rows = await query(sql, params);
    return rows[0] ? formatOTP(rows[0]) : null;
  }

  static async create(data) {
    const { email, otp, expiresAt, used = false } = data;
    const sql = `INSERT INTO otps (email, otp, expiresAt, used) VALUES (?, ?, ?, ?)`;
    const params = [email, otp, expiresAt, used ? 1 : 0];
    const res = await execute(sql, params);
    const rows = await query('SELECT * FROM otps WHERE id = ? LIMIT 1', [res.insertId]);
    return rows[0] ? formatOTP(rows[0]) : null;
  }

  static async updateOne(filter = {}, updates = {}) {
    let sql = 'UPDATE otps SET ';
    const setFields = [];
    const params = [];

    if (updates.used !== undefined) { setFields.push('used = ?'); params.push(updates.used ? 1 : 0); }
    if (updates.$set && updates.$set.used !== undefined) { setFields.push('used = ?'); params.push(updates.$set.used ? 1 : 0); }

    if (setFields.length === 0) return { modifiedCount: 0 };

    sql += setFields.join(', ') + ' WHERE 1=1';

    if (filter.email) { sql += ' AND email = ?'; params.push(filter.email); }
    if (filter.otp) { sql += ' AND otp = ?'; params.push(filter.otp); }
    if (filter._id || filter.id) { sql += ' AND id = ?'; params.push(filter._id || filter.id); }

    const res = await execute(sql, params);
    return { modifiedCount: res.affectedRows };
  }
}

export default OTP;
