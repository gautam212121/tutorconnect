import { query, execute } from '../config/db.js';

function parseJson(val, fallback) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

export function formatActivityLog(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    user: row.user,
    action: row.action,
    category: row.category || 'system',
    details: row.details,
    metadata: parseJson(row.metadata, {}),
    ip: row.ip,
    userAgent: row.userAgent,
    targetModel: row.targetModel,
    targetId: row.targetId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class ActivityLog {
  static async find(filter = {}) {
    let sql = 'SELECT * FROM activity_logs WHERE 1=1';
    const params = [];
    if (filter.user) { sql += ' AND user = ?'; params.push(filter.user); }
    if (filter.category) { sql += ' AND category = ?'; params.push(filter.category); }
    sql += ' ORDER BY createdAt DESC';
    const rows = await query(sql, params);
    return rows.map(formatActivityLog);
  }

  static async findById(id) {
    if (!id) return null;
    const rows = await query('SELECT * FROM activity_logs WHERE id = ? LIMIT 1', [id]);
    return rows[0] ? formatActivityLog(rows[0]) : null;
  }

  static async create(data) {
    const { user, action, category = 'system', details, metadata, ip, userAgent, targetModel, targetId } = data;
    const sql = `INSERT INTO activity_logs (user, action, category, details, metadata, ip, userAgent, targetModel, targetId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      user || null, action, category, details || null, metadata ? JSON.stringify(metadata) : null,
      ip || null, userAgent || null, targetModel || null, targetId || null
    ];
    const res = await execute(sql, params);
    return this.findById(res.insertId);
  }
}

export default ActivityLog;
