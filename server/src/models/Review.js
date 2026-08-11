import { query, execute } from '../config/db.js';

export function formatReview(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    booking: row.booking,
    student: row.student,
    tutor: row.tutor,
    rating: Number(row.rating || 0),
    comment: row.comment,
    status: row.status || 'visible',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class Review {
  static async find(filter = {}) {
    let sql = 'SELECT * FROM reviews WHERE 1=1';
    const params = [];
    if (filter.tutor) { sql += ' AND tutor = ?'; params.push(filter.tutor); }
    if (filter.student) { sql += ' AND student = ?'; params.push(filter.student); }
    if (filter.status) { sql += ' AND status = ?'; params.push(filter.status); }
    sql += ' ORDER BY id DESC';
    const rows = await query(sql, params);
    return rows.map(formatReview);
  }

  static async findById(id) {
    if (!id) return null;
    const rows = await query('SELECT * FROM reviews WHERE id = ? LIMIT 1', [id]);
    return rows[0] ? formatReview(rows[0]) : null;
  }

  static async create(data) {
    const { booking, student, tutor, rating, comment, status = 'visible' } = data;
    const sql = `INSERT INTO reviews (booking, student, tutor, rating, comment, status) VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [booking || null, student, tutor, rating, comment || null, status];
    const res = await execute(sql, params);
    return this.findById(res.insertId);
  }

  static async aggregate(pipeline = []) {
    // Basic aggregation handler for tutor rating calculation
    // e.g. [{ $match: { tutor: tutorId } }, { $group: { _id: '$tutor', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }]
    let tutorId = null;
    for (const stage of pipeline) {
      if (stage.$match && stage.$match.tutor) {
        tutorId = stage.$match.tutor;
      }
    }
    if (!tutorId) return [];

    const rows = await query('SELECT AVG(rating) as avgRating, COUNT(*) as count FROM reviews WHERE tutor = ? AND status = "visible"', [tutorId]);
    const row = rows[0] || {};
    return [
      {
        _id: tutorId,
        avgRating: Number(row.avgRating || 0),
        count: Number(row.count || 0),
      }
    ];
  }
}

export default Review;
