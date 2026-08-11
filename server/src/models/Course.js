import { query, execute } from '../config/db.js';

export function formatCourse(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    title: row.title,
    description: row.description,
    subject: row.subject,
    classLevel: row.classLevel,
    price: Number(row.price || 0),
    duration: row.duration,
    mode: row.mode || 'Online',
    status: row.status || 'active',
    tutor: row.tutor,
    enrollments: Number(row.enrollments || 0),
    thumbnail: row.thumbnail,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class Course {
  static async find(filter = {}) {
    let sql = 'SELECT * FROM courses WHERE 1=1';
    const params = [];
    if (filter.status) { sql += ' AND status = ?'; params.push(filter.status); }
    if (filter.tutor) { sql += ' AND tutor = ?'; params.push(filter.tutor); }
    if (filter.subject) { sql += ' AND subject = ?'; params.push(filter.subject); }
    sql += ' ORDER BY id DESC';
    const rows = await query(sql, params);
    return rows.map(formatCourse);
  }

  static async findById(id) {
    if (!id) return null;
    const rows = await query('SELECT * FROM courses WHERE id = ? LIMIT 1', [id]);
    return rows[0] ? formatCourse(rows[0]) : null;
  }

  static async create(data) {
    const { title, description, subject, classLevel, price, duration, mode = 'Online', status = 'active', tutor, enrollments = 0, thumbnail } = data;
    const sql = `INSERT INTO courses (title, description, subject, classLevel, price, duration, mode, status, tutor, enrollments, thumbnail) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [title, description || null, subject, classLevel || null, price, duration || null, mode, status, tutor || null, enrollments, thumbnail || null];
    const res = await execute(sql, params);
    return this.findById(res.insertId);
  }
}

export default Course;
