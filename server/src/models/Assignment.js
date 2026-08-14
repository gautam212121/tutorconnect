import { query, execute } from '../config/db.js';

export function formatAssignment(row) {
  if (!row) return null;
  return {
    id: row.id || row._id,
    title: row.title,
    description: row.description,
    courseId: row.courseId,
    tutorId: row.tutorId,
    dueDate: row.dueDate,
    status: row.status || 'active',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class Assignment {
  static async find(filter = {}) {
    let sql = 'SELECT * FROM assignments WHERE 1=1';
    const params = [];
    if (filter.tutorId) { sql += ' AND tutorId = ?'; params.push(filter.tutorId); }
    if (filter.courseId) { sql += ' AND courseId = ?'; params.push(filter.courseId); }
    sql += ' ORDER BY id DESC';
    const rows = await query(sql, params);
    return rows.map(formatAssignment);
  }

  static async findById(id) {
    if (!id) return null;
    const rows = await query('SELECT * FROM assignments WHERE id = ? LIMIT 1', [id]);
    return rows[0] ? formatAssignment(rows[0]) : null;
  }

  static async create(data) {
    const { title, description, courseId, tutorId, dueDate, status = 'active' } = data;
    const sql = `INSERT INTO assignments (title, description, courseId, tutorId, dueDate, status) VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [title, description, courseId, tutorId, dueDate, status];
    const res = await execute(sql, params);
    return this.findById(res.insertId);
  }

  static async update(id, data) {
    const fields = [];
    const params = [];
    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      params.push(value);
    }
    if (fields.length === 0) return this.findById(id);
    params.push(id);
    const sql = `UPDATE assignments SET ${fields.join(', ')} WHERE id = ?`;
    await execute(sql, params);
    return this.findById(id);
  }

  static async delete(id) {
    await execute('DELETE FROM assignments WHERE id = ?', [id]);
    return true;
  }
}

export default Assignment;
