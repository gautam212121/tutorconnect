import { query, execute } from '../config/db.js';

export function formatBlog(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    category: row.category,
    author: row.author,
    role: row.role || 'Educator',
    readTime: row.readTime || '5 min read',
    image: row.image,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class Blog {
  static async find(filter = {}) {
    let sql = 'SELECT * FROM blogs WHERE 1=1';
    const params = [];
    if (filter.category) { sql += ' AND category = ?'; params.push(filter.category); }
    sql += ' ORDER BY id DESC';
    const rows = await query(sql, params);
    return rows.map(formatBlog);
  }

  static async findById(id) {
    if (!id) return null;
    const rows = await query('SELECT * FROM blogs WHERE id = ? LIMIT 1', [id]);
    return rows[0] ? formatBlog(rows[0]) : null;
  }

  static async countDocuments(filter = {}) {
    let sql = 'SELECT COUNT(*) as count FROM blogs WHERE 1=1';
    const params = [];
    if (filter.category) { sql += ' AND category = ?'; params.push(filter.category); }
    const rows = await query(sql, params);
    return rows[0] ? Number(rows[0].count) : 0;
  }

  static async create(data) {
    const { title, excerpt, content, category, author, role = 'Educator', readTime = '5 min read', image } = data;
    const sql = `INSERT INTO blogs (title, excerpt, content, category, author, role, readTime, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [title, excerpt, content, category, author, role, readTime, image || null];
    const res = await execute(sql, params);
    return this.findById(res.insertId);
  }

  static async insertMany(items = []) {
    const inserted = [];
    for (const item of items) {
      const row = await this.create(item);
      inserted.push(row);
    }
    return inserted;
  }
}

export default Blog;
