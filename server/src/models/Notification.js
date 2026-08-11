import { query, execute } from '../config/db.js';

function parseJson(val, fallback) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

export function formatNotification(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    recipient: row.recipient,
    title: row.title,
    message: row.message,
    type: row.type || 'general',
    read: Boolean(row.read),
    readAt: row.readAt,
    link: row.link,
    icon: row.icon,
    metadata: parseJson(row.metadata, {}),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class Notification {
  static async find(filter = {}) {
    let sql = 'SELECT * FROM notifications WHERE 1=1';
    const params = [];

    if (filter.recipient !== undefined) {
      if (filter.recipient === null) {
        sql += ' AND (recipient IS NULL)';
      } else {
        sql += ' AND (recipient = ? OR recipient IS NULL)';
        params.push(filter.recipient);
      }
    }
    if (filter.read !== undefined) {
      sql += ' AND `read` = ?';
      params.push(filter.read ? 1 : 0);
    }

    sql += ' ORDER BY createdAt DESC';

    const rows = await query(sql, params);
    return rows.map(formatNotification);
  }

  static async findById(id) {
    if (!id) return null;
    const rows = await query('SELECT * FROM notifications WHERE id = ? LIMIT 1', [id]);
    return rows[0] ? formatNotification(rows[0]) : null;
  }

  static async create(data) {
    const { recipient, title, message, type = 'general', read = false, readAt, link, icon, metadata } = data;
    const sql = `INSERT INTO notifications (recipient, title, message, type, \`read\`, readAt, link, icon, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      recipient || null, title, message, type, read ? 1 : 0, readAt || null,
      link || null, icon || null, metadata ? JSON.stringify(metadata) : null
    ];
    const res = await execute(sql, params);
    return this.findById(res.insertId);
  }

  static async updateMany(filter = {}, updates = {}) {
    let sql = 'UPDATE notifications SET ';
    const setFields = [];
    const params = [];

    if (updates.read !== undefined) { setFields.push('`read` = ?'); params.push(updates.read ? 1 : 0); }
    if (updates.readAt !== undefined) { setFields.push('readAt = ?'); params.push(updates.readAt); }

    if (setFields.length === 0) return { modifiedCount: 0 };

    sql += setFields.join(', ') + ' WHERE 1=1';

    if (filter.recipient) { sql += ' AND recipient = ?'; params.push(filter.recipient); }

    const res = await execute(sql, params);
    return { modifiedCount: res.affectedRows };
  }
}

export default Notification;
