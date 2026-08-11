import { query, execute } from '../config/db.js';

export function formatSubscription(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    tutor: row.tutor,
    plan: row.plan,
    startDate: row.startDate,
    endDate: row.endDate,
    status: row.status || 'pending',
    amount: Number(row.amount || 0),
    razorpayOrderId: row.razorpayOrderId,
    razorpayPaymentId: row.razorpayPaymentId,
    razorpaySubscriptionId: row.razorpaySubscriptionId,
    leadLimit: row.leadLimit != null ? Number(row.leadLimit) : undefined,
    commissionRate: row.commissionRate != null ? Number(row.commissionRate) : undefined,
    autoRenew: Boolean(row.autoRenew),
    cancelledAt: row.cancelledAt,
    cancelReason: row.cancelReason,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class Subscription {
  static async find(filter = {}) {
    let sql = 'SELECT * FROM subscriptions WHERE 1=1';
    const params = [];
    if (filter.tutor) { sql += ' AND tutor = ?'; params.push(filter.tutor); }
    if (filter.status) { sql += ' AND status = ?'; params.push(filter.status); }
    sql += ' ORDER BY id DESC';
    const rows = await query(sql, params);
    return rows.map(formatSubscription);
  }

  static async findById(id) {
    if (!id) return null;
    const rows = await query('SELECT * FROM subscriptions WHERE id = ? LIMIT 1', [id]);
    return rows[0] ? formatSubscription(rows[0]) : null;
  }

  static async findOne(filter = {}) {
    if (filter.tutor && filter.status) {
      const rows = await query('SELECT * FROM subscriptions WHERE tutor = ? AND status = ? ORDER BY id DESC LIMIT 1', [filter.tutor, filter.status]);
      return rows[0] ? formatSubscription(rows[0]) : null;
    }
    if (filter.id || filter._id) return this.findById(filter.id || filter._id);
    const keys = Object.keys(filter);
    if (keys.length > 0) {
      const where = keys.map(k => `${k} = ?`).join(' AND ');
      const values = keys.map(k => filter[k]);
      const rows = await query(`SELECT * FROM subscriptions WHERE ${where} LIMIT 1`, values);
      return rows[0] ? formatSubscription(rows[0]) : null;
    }
    const rows = await query('SELECT * FROM subscriptions LIMIT 1');
    return rows[0] ? formatSubscription(rows[0]) : null;
  }

  static async create(data) {
    const {
      tutor, plan, startDate = new Date(), endDate, status = 'pending',
      amount, razorpayOrderId, razorpayPaymentId, razorpaySubscriptionId,
      leadLimit, commissionRate, autoRenew = false, cancelledAt, cancelReason
    } = data;

    const sql = `INSERT INTO subscriptions (
      tutor, plan, startDate, endDate, status, amount, razorpayOrderId,
      razorpayPaymentId, razorpaySubscriptionId, leadLimit, commissionRate,
      autoRenew, cancelledAt, cancelReason
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
      tutor, plan, startDate, endDate, status, amount,
      razorpayOrderId || null, razorpayPaymentId || null, razorpaySubscriptionId || null,
      leadLimit || null, commissionRate || null, autoRenew ? 1 : 0,
      cancelledAt || null, cancelReason || null
    ];

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
    if (updates.cancelledAt !== undefined) { fields.push('cancelledAt = ?'); params.push(updates.cancelledAt); }
    if (updates.cancelReason !== undefined) { fields.push('cancelReason = ?'); params.push(updates.cancelReason); }
    if (updates.razorpayPaymentId !== undefined) { fields.push('razorpayPaymentId = ?'); params.push(updates.razorpayPaymentId); }

    if (fields.length === 0) return item;

    params.push(id);
    await execute(`UPDATE subscriptions SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  }
}

export default Subscription;
