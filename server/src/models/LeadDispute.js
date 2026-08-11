import { query, execute } from '../config/db.js';

export function formatLeadDispute(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    lead: row.lead,
    tutor: row.tutor,
    reason: row.reason,
    description: row.description,
    status: row.status || 'pending-review',
    autoResolved: Boolean(row.autoResolved),
    autoResolvedAt: row.autoResolvedAt,
    adminResolvedBy: row.adminResolvedBy,
    adminResolvedAt: row.adminResolvedAt,
    resolution: row.resolution,
    resolutionAction: row.resolutionAction,
    replacementLead: row.replacementLead,
    disputeDisplayId: row.disputeDisplayId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class LeadDispute {
  static async find(filter = {}) {
    let sql = 'SELECT * FROM lead_disputes WHERE 1=1';
    const params = [];
    if (filter.tutor) { sql += ' AND tutor = ?'; params.push(filter.tutor); }
    if (filter.status) { sql += ' AND status = ?'; params.push(filter.status); }
    if (filter.lead) { sql += ' AND lead = ?'; params.push(filter.lead); }
    sql += ' ORDER BY id DESC';
    const rows = await query(sql, params);
    return rows.map(formatLeadDispute);
  }

  static async findById(id) {
    if (!id) return null;
    const rows = await query('SELECT * FROM lead_disputes WHERE id = ? LIMIT 1', [id]);
    return rows[0] ? formatLeadDispute(rows[0]) : null;
  }

  static async create(data) {
    const countRows = await query('SELECT COUNT(*) as count FROM lead_disputes');
    const count = countRows[0] ? Number(countRows[0].count) : 0;
    const disputeDisplayId = data.disputeDisplayId || `#LD-${(7840 + count + 1).toString()}`;

    const {
      lead, tutor, reason, description, status = 'pending-review',
      autoResolved = false, autoResolvedAt, adminResolvedBy, adminResolvedAt,
      resolution, resolutionAction, replacementLead
    } = data;

    const sql = `INSERT INTO lead_disputes (
      lead, tutor, reason, description, status, autoResolved, autoResolvedAt,
      adminResolvedBy, adminResolvedAt, resolution, resolutionAction, replacementLead, disputeDisplayId
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
      lead, tutor, reason, description || null, status, autoResolved ? 1 : 0,
      autoResolvedAt || null, adminResolvedBy || null, adminResolvedAt || null,
      resolution || null, resolutionAction || null, replacementLead || null, disputeDisplayId
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
    if (updates.adminResolvedBy !== undefined) { fields.push('adminResolvedBy = ?'); params.push(updates.adminResolvedBy); }
    if (updates.adminResolvedAt !== undefined) { fields.push('adminResolvedAt = ?'); params.push(updates.adminResolvedAt); }
    if (updates.resolution !== undefined) { fields.push('resolution = ?'); params.push(updates.resolution); }
    if (updates.resolutionAction !== undefined) { fields.push('resolutionAction = ?'); params.push(updates.resolutionAction); }
    if (updates.replacementLead !== undefined) { fields.push('replacementLead = ?'); params.push(updates.replacementLead); }
    if (updates.autoResolved !== undefined) { fields.push('autoResolved = ?'); params.push(updates.autoResolved ? 1 : 0); }
    if (updates.autoResolvedAt !== undefined) { fields.push('autoResolvedAt = ?'); params.push(updates.autoResolvedAt); }

    if (fields.length === 0) return item;

    params.push(id);
    await execute(`UPDATE lead_disputes SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  }

  static async countDocuments(filter = {}) {
    let sql = 'SELECT COUNT(*) as count FROM lead_disputes WHERE 1=1';
    const params = [];
    if (filter.status) { sql += ' AND status = ?'; params.push(filter.status); }
    const rows = await query(sql, params);
    return rows[0] ? Number(rows[0].count) : 0;
  }
}

export default LeadDispute;
