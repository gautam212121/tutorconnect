import { query, execute } from '../config/db.js';

function parseJson(val, fallback) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

export function formatMessage(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    booking: row.booking,
    from: row.from,
    to: row.to,
    type: row.type || 'text',
    content: row.content,
    meetUrl: row.meetUrl,
    attachments: parseJson(row.attachments, []),
    read: Boolean(row.read),
    readAt: row.readAt,
    delivered: Boolean(row.delivered),
    deliveredAt: row.deliveredAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class Message {
  static async find(filter = {}) {
    let sql = 'SELECT * FROM messages WHERE 1=1';
    const params = [];

    if (filter.$or && Array.isArray(filter.$or)) {
      const orConditions = [];
      for (const cond of filter.$or) {
        if (cond.from && cond.to) {
          orConditions.push('(`from` = ? AND `to` = ?)');
          params.push(cond.from, cond.to);
        }
      }
      if (orConditions.length > 0) {
        sql += ` AND (${orConditions.join(' OR ')})`;
      }
    } else {
      if (filter.booking) { sql += ' AND booking = ?'; params.push(filter.booking); }
      if (filter.from) { sql += ' AND `from` = ?'; params.push(filter.from); }
      if (filter.to) { sql += ' AND `to` = ?'; params.push(filter.to); }
    }

    sql += ' ORDER BY createdAt ASC';
    const rows = await query(sql, params);
    return rows.map(formatMessage);
  }

  static async findById(id) {
    if (!id) return null;
    const rows = await query('SELECT * FROM messages WHERE id = ? LIMIT 1', [id]);
    return rows[0] ? formatMessage(rows[0]) : null;
  }

  static async create(data) {
    const {
      booking, from, to, type = 'text', content, meetUrl,
      attachments, read = false, readAt, delivered = false, deliveredAt
    } = data;

    const sql = `INSERT INTO messages (
      booking, \`from\`, \`to\`, type, content, meetUrl, attachments, \`read\`, readAt, delivered, deliveredAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
      booking || null, from, to, type, content, meetUrl || null,
      attachments ? JSON.stringify(attachments) : null, read ? 1 : 0, readAt || null,
      delivered ? 1 : 0, deliveredAt || null
    ];

    const res = await execute(sql, params);
    return this.findById(res.insertId);
  }

  static async updateMany(filter = {}, updates = {}) {
    let sql = 'UPDATE messages SET ';
    const setFields = [];
    const params = [];

    if (updates.read !== undefined) { setFields.push('`read` = ?'); params.push(updates.read ? 1 : 0); }
    if (updates.readAt !== undefined) { setFields.push('readAt = ?'); params.push(updates.readAt); }

    if (setFields.length === 0) return { modifiedCount: 0 };

    sql += setFields.join(', ') + ' WHERE 1=1';

    if (filter.to) { sql += ' AND `to` = ?'; params.push(filter.to); }
    if (filter.from) { sql += ' AND `from` = ?'; params.push(filter.from); }
    if (filter._id && filter._id.$in) {
      const ids = filter._id.$in;
      if (ids.length > 0) {
        sql += ` AND id IN (${ids.map(() => '?').join(',')})`;
        params.push(...ids);
      }
    }

    const res = await execute(sql, params);
    return { modifiedCount: res.affectedRows };
  }
}

export default Message;
