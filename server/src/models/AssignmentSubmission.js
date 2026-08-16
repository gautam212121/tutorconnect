import { query, execute } from '../config/db.js';

export function formatAssignmentSubmission(row) {
  if (!row) return null;
  return {
    id: row.id || row._id,
    assignmentId: row.assignmentId,
    studentId: row.studentId,
    content: row.content,
    fileUrl: row.fileUrl,
    status: row.status || 'Submitted',
    grade: row.grade,
    feedback: row.feedback,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class AssignmentSubmission {
  static async find(filter = {}) {
    let sql = 'SELECT * FROM assignment_submissions WHERE 1=1';
    const params = [];
    if (filter.assignmentId) { sql += ' AND assignmentId = ?'; params.push(filter.assignmentId); }
    if (filter.studentId) { sql += ' AND studentId = ?'; params.push(filter.studentId); }
    if (filter.status) { sql += ' AND status = ?'; params.push(filter.status); }
    sql += ' ORDER BY id DESC';
    const rows = await query(sql, params);
    return rows.map(formatAssignmentSubmission);
  }

  static async findById(id) {
    if (!id) return null;
    const rows = await query('SELECT * FROM assignment_submissions WHERE id = ? LIMIT 1', [id]);
    return rows[0] ? formatAssignmentSubmission(rows[0]) : null;
  }

  static async create(data) {
    const { assignmentId, studentId, content, fileUrl, status = 'Submitted' } = data;
    const sql = `INSERT INTO assignment_submissions (assignmentId, studentId, content, fileUrl, status) VALUES (?, ?, ?, ?, ?)`;
    const params = [assignmentId, studentId, content || null, fileUrl || null, status];
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
    const sql = `UPDATE assignment_submissions SET ${fields.join(', ')} WHERE id = ?`;
    await execute(sql, params);
    return this.findById(id);
  }

  static async delete(id) {
    await execute('DELETE FROM assignment_submissions WHERE id = ?', [id]);
    return true;
  }
}

export default AssignmentSubmission;
