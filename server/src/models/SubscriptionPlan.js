import { query, execute } from '../config/db.js';

function parseJson(val, fallback) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

export function formatSubscriptionPlan(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    price: Number(row.price || 0),
    duration: Number(row.duration || 1),
    durationLabel: row.durationLabel || '1 Month',
    leadLimit: Number(row.leadLimit || 20),
    leadLimitLabel: row.leadLimitLabel || '20 Leads',
    commissionRate: Number(row.commissionRate || 0.10),
    searchBoost: Boolean(row.searchBoost),
    priorityBadge: Boolean(row.priorityBadge),
    premiumSupport: Boolean(row.premiumSupport),
    features: parseJson(row.features, []),
    status: row.status || 'active',
    sortOrder: Number(row.sortOrder || 0),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class SubscriptionPlan {
  static async find(filter = {}) {
    let sql = 'SELECT * FROM subscription_plans WHERE 1=1';
    const params = [];
    if (filter.status) { sql += ' AND status = ?'; params.push(filter.status); }
    sql += ' ORDER BY sortOrder ASC, id ASC';
    const rows = await query(sql, params);
    return rows.map(formatSubscriptionPlan);
  }

  static async findById(id) {
    if (!id) return null;
    const rows = await query('SELECT * FROM subscription_plans WHERE id = ? LIMIT 1', [id]);
    return rows[0] ? formatSubscriptionPlan(rows[0]) : null;
  }

  static async countDocuments(filter = {}) {
    let sql = 'SELECT COUNT(*) as count FROM subscription_plans WHERE 1=1';
    const params = [];
    if (filter.status) { sql += ' AND status = ?'; params.push(filter.status); }
    const rows = await query(sql, params);
    return rows[0] ? Number(rows[0].count) : 0;
  }

  static async insertMany(items = []) {
    const inserted = [];
    for (const item of items) {
      const {
        name, price, duration = 1, durationLabel = '1 Month', leadLimit = 20,
        leadLimitLabel = '20 Leads', commissionRate = 0.10, searchBoost = false,
        priorityBadge = false, premiumSupport = false, features = [], status = 'active', sortOrder = 0
      } = item;

      const sql = `INSERT INTO subscription_plans (
        name, price, duration, durationLabel, leadLimit, leadLimitLabel,
        commissionRate, searchBoost, priorityBadge, premiumSupport, features, status, sortOrder
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      const params = [
        name, price, duration, durationLabel, leadLimit, leadLimitLabel,
        commissionRate, searchBoost ? 1 : 0, priorityBadge ? 1 : 0, premiumSupport ? 1 : 0,
        JSON.stringify(features), status, sortOrder
      ];

      const res = await execute(sql, params);
      const row = await this.findById(res.insertId);
      inserted.push(row);
    }
    return inserted;
  }
}

export default SubscriptionPlan;
