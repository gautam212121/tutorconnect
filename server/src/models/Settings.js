import { query, execute } from '../config/db.js';

function parseJson(val, fallback) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

export function formatSettings(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    platformName: row.platformName || 'TutorConnect',
    supportEmail: row.supportEmail,
    commissionRate: Number(row.commissionRate || 10),
    gstRate: Number(row.gstRate || 18),
    maintenanceMode: Boolean(row.maintenanceMode),
    heroTitle: row.heroTitle || 'Quality Home Tuition',
    heroSubtitle: row.heroSubtitle || 'Verified tutors at your doorstep',
    heroImage: row.heroImage || '/hero-banner.jpg',
    smtp: parseJson(row.smtp, {}),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class Settings {
  static async findOne() {
    let rows = await query('SELECT * FROM settings LIMIT 1');
    if (!rows[0]) {
      await execute('INSERT INTO settings (platformName) VALUES (?)', ['TutorConnect']);
      rows = await query('SELECT * FROM settings LIMIT 1');
    }
    return formatSettings(rows[0]);
  }

  static async findOneAndUpdate(filter = {}, updates = {}, options = {}) {
    const s = await this.findOne();
    const u = updates.$set ? updates.$set : updates;
    const fields = [];
    const params = [];

    if (u.platformName !== undefined) { fields.push('platformName = ?'); params.push(u.platformName); }
    if (u.supportEmail !== undefined) { fields.push('supportEmail = ?'); params.push(u.supportEmail); }
    if (u.commissionRate !== undefined) { fields.push('commissionRate = ?'); params.push(u.commissionRate); }
    if (u.gstRate !== undefined) { fields.push('gstRate = ?'); params.push(u.gstRate); }
    if (u.maintenanceMode !== undefined) { fields.push('maintenanceMode = ?'); params.push(u.maintenanceMode ? 1 : 0); }
    if (u.heroTitle !== undefined) { fields.push('heroTitle = ?'); params.push(u.heroTitle); }
    if (u.heroSubtitle !== undefined) { fields.push('heroSubtitle = ?'); params.push(u.heroSubtitle); }
    if (u.heroImage !== undefined) { fields.push('heroImage = ?'); params.push(u.heroImage); }
    if (u.smtp !== undefined) { fields.push('smtp = ?'); params.push(JSON.stringify(u.smtp)); }

    if (fields.length === 0) return s;

    params.push(s.id);
    await execute(`UPDATE settings SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findOne();
  }
}

export default Settings;
