import { query, execute } from '../config/db.js';

export function formatStudyMaterial(row) {
  if (!row) return null;
  return {
    id: row.id || row._id,
    title: row.title,
    fileUrl: row.fileUrl,
    courseId: row.courseId,
    studentId: row.studentId,
    tutorId: row.tutorId,
    type: row.type || 'PDF',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class StudyMaterial {
  static async find(filter = {}) {
    let sql = 'SELECT * FROM study_materials WHERE 1=1';
    const params = [];
    if (filter.tutorId) { sql += ' AND tutorId = ?'; params.push(filter.tutorId); }
    if (filter.courseId) { sql += ' AND courseId = ?'; params.push(filter.courseId); }
    if (filter.studentId) { sql += ' AND studentId = ?'; params.push(filter.studentId); }
    sql += ' ORDER BY id DESC';
    const rows = await query(sql, params);
    return rows.map(formatStudyMaterial);
  }

  static async findById(id) {
    if (!id) return null;
    const rows = await query('SELECT * FROM study_materials WHERE id = ? LIMIT 1', [id]);
    return rows[0] ? formatStudyMaterial(rows[0]) : null;
  }

  static async create(data) {
    const { title, fileUrl, courseId, studentId, tutorId, type = 'PDF' } = data;
    const sql = `INSERT INTO study_materials (title, fileUrl, courseId, studentId, tutorId, type) VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [title, fileUrl, courseId || null, studentId || null, tutorId, type];
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
    const sql = `UPDATE study_materials SET ${fields.join(', ')} WHERE id = ?`;
    await execute(sql, params);
    return this.findById(id);
  }

  static async delete(id) {
    await execute('DELETE FROM study_materials WHERE id = ?', [id]);
    return true;
  }
}

export default StudyMaterial;
