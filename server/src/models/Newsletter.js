import { query, execute } from '../config/db.js';

export function formatNewsletter(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    email: row.email,
    subscribedAt: row.subscribedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class Newsletter {
  static async find(filter = {}) {
    let sql = 'SELECT * FROM newsletters WHERE 1=1';
    const params = [];
    if (filter.email) { sql += ' AND email = ?'; params.push(filter.email); }
    const rows = await query(sql, params);
    return rows.map(formatNewsletter);
  }

  static async findOne(filter = {}) {
    if (filter.email) {
      const rows = await query('SELECT * FROM newsletters WHERE email = ? LIMIT 1', [filter.email]);
      return rows[0] ? formatNewsletter(rows[0]) : null;
    }
    return null;
  }

  static async create(data) {
    const { email } = data;
    const sql = `INSERT INTO newsletters (email, subscribedAt) VALUES (?, ?)`;
    const subscribedAt = new Date().toISOString();
    const res = await execute(sql, [email, subscribedAt]);
    return this.findOne({ email });
  }
}

export default Newsletter;
