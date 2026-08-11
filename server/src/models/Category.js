import { query, execute } from '../config/db.js';

function parseJson(val, fallback) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

export function formatCategory(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    image: row.image,
    description: row.description,
    priority: row.priority || 'Medium',
    status: row.status || 'active',
    type: row.type || 'Academics',
    curriculum: parseJson(row.curriculum, []),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class Category {
  static async find(filter = {}) {
    let sql = 'SELECT * FROM categories WHERE 1=1';
    const params = [];
    if (filter.status) { sql += ' AND status = ?'; params.push(filter.status); }
    if (filter.type) { sql += ' AND type = ?'; params.push(filter.type); }
    sql += ' ORDER BY id ASC';
    const rows = await query(sql, params);
    return rows.map(formatCategory);
  }

  static async findOne(filter = {}) {
    if (filter.name) {
      const rows = await query('SELECT * FROM categories WHERE name = ? LIMIT 1', [filter.name]);
      return rows[0] ? formatCategory(rows[0]) : null;
    }
    if (filter.id || filter._id) return this.findById(filter.id || filter._id);
    const rows = await query('SELECT * FROM categories LIMIT 1');
    return rows[0] ? formatCategory(rows[0]) : null;
  }

  static async findById(id) {
    if (!id) return null;
    const rows = await query('SELECT * FROM categories WHERE id = ? LIMIT 1', [id]);
    return rows[0] ? formatCategory(rows[0]) : null;
  }

  static async create(data) {
    const { name, image, description, priority = 'Medium', status = 'active', type = 'Academics', curriculum } = data;
    const sql = `INSERT INTO categories (name, image, description, priority, status, type, curriculum) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const params = [name, image || null, description || null, priority, status, type, curriculum ? JSON.stringify(curriculum) : null];
    const res = await execute(sql, params);
    return this.findById(res.insertId);
  }
}

export default Category;
