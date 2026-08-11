import { query, execute } from '../config/db.js';

function parseJson(val, fallback) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

export function formatCareer(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    gender: row.gender,
    dob: row.dob,
    address: parseJson(row.address, {}),
    education: parseJson(row.education, {}),
    teaching: parseJson(row.teaching, {}),
    experienceDetails: parseJson(row.experienceDetails, {}),
    availability: parseJson(row.availability, {}),
    fees: parseJson(row.fees, {}),
    skills: parseJson(row.skills, {}),
    documents: parseJson(row.documents, {}),
    password: row.password,
    status: row.status || 'pending',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class Career {
  static async find(filter = {}) {
    let sql = 'SELECT * FROM careers WHERE 1=1';
    const params = [];
    if (filter.status) { sql += ' AND status = ?'; params.push(filter.status); }
    sql += ' ORDER BY id DESC';
    const rows = await query(sql, params);
    return rows.map(formatCareer);
  }

  static async findById(id) {
    if (!id) return null;
    const rows = await query('SELECT * FROM careers WHERE id = ? LIMIT 1', [id]);
    return rows[0] ? formatCareer(rows[0]) : null;
  }

  static async create(data) {
    const {
      name, email, phone, gender, dob, address, education, teaching,
      experienceDetails, availability, fees, skills, documents, password, status = 'pending'
    } = data;

    const sql = `INSERT INTO careers (
      name, email, phone, gender, dob, address, education, teaching,
      experienceDetails, availability, fees, skills, documents, password, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
      name, email, phone, gender || null, dob || null,
      address ? JSON.stringify(address) : null,
      education ? JSON.stringify(education) : null,
      teaching ? JSON.stringify(teaching) : null,
      experienceDetails ? JSON.stringify(experienceDetails) : null,
      availability ? JSON.stringify(availability) : null,
      fees ? JSON.stringify(fees) : null,
      skills ? JSON.stringify(skills) : null,
      documents ? JSON.stringify(documents) : null,
      password || null, status
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

    if (fields.length === 0) return item;

    params.push(id);
    await execute(`UPDATE careers SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  }
}

export default Career;
