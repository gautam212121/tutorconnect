import { query, execute } from '../config/db.js';

function parseJson(val, fallback) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

export function formatWithdrawal(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    tutor: row.tutor,
    amount: Number(row.amount || 0),
    status: row.status || 'pending',
    payoutMethod: row.payoutMethod || 'bank',
    bankDetails: parseJson(row.bankDetails, {}),
    upiId: row.upiId,
    processedAt: row.processedAt,
    processedBy: row.processedBy,
    transactionId: row.transactionId,
    rejectionReason: row.rejectionReason,
    payoutDisplayId: row.payoutDisplayId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class Withdrawal {
  static async find(filter = {}) {
    let sql = 'SELECT * FROM withdrawals WHERE 1=1';
    const params = [];
    if (filter.tutor) { sql += ' AND tutor = ?'; params.push(filter.tutor); }
    if (filter.status) { sql += ' AND status = ?'; params.push(filter.status); }
    sql += ' ORDER BY id DESC';
    const rows = await query(sql, params);
    return rows.map(formatWithdrawal);
  }

  static async findById(id) {
    if (!id) return null;
    const rows = await query('SELECT * FROM withdrawals WHERE id = ? LIMIT 1', [id]);
    return rows[0] ? formatWithdrawal(rows[0]) : null;
  }

  static async create(data) {
    const countRows = await query('SELECT COUNT(*) as count FROM withdrawals');
    const count = countRows[0] ? Number(countRows[0].count) : 0;
    const payoutDisplayId = data.payoutDisplayId || `#TC${(9800 + count + 1).toString()}`;

    const {
      tutor, amount, status = 'pending', payoutMethod = 'bank', bankDetails = {},
      upiId, processedAt, processedBy, transactionId, rejectionReason
    } = data;

    const sql = `INSERT INTO withdrawals (
      tutor, amount, status, payoutMethod, bankDetails, upiId,
      processedAt, processedBy, transactionId, rejectionReason, payoutDisplayId
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
      tutor, amount, status, payoutMethod, JSON.stringify(bankDetails), upiId || null,
      processedAt || null, processedBy || null, transactionId || null, rejectionReason || null, payoutDisplayId
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
    if (updates.processedAt !== undefined) { fields.push('processedAt = ?'); params.push(updates.processedAt); }
    if (updates.processedBy !== undefined) { fields.push('processedBy = ?'); params.push(updates.processedBy); }
    if (updates.transactionId !== undefined) { fields.push('transactionId = ?'); params.push(updates.transactionId); }
    if (updates.rejectionReason !== undefined) { fields.push('rejectionReason = ?'); params.push(updates.rejectionReason); }

    if (fields.length === 0) return item;

    params.push(id);
    await execute(`UPDATE withdrawals SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  }
}

export default Withdrawal;
