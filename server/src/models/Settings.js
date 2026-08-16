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
    platformName: row.platformName || 'VerifiedTutor',
    supportEmail: row.supportEmail,
    commissionRate: Number(row.commissionRate || 10),
    gstRate: Number(row.gstRate || 18),
    maintenanceMode: Boolean(row.maintenanceMode),
    heroTitle: row.heroTitle || 'Quality Home Tuition',
    heroSubtitle: row.heroSubtitle || 'Verified tutors at your doorstep',
    heroImage: row.heroImage || '/hero-banner.jpg',
    smtp: parseJson(row.smtp, {}),
    paymentMethods: parseJson(row.paymentMethods, []),
    
    // Unified setting parameters
    tagline: row.tagline || 'Learn from the Best Tutors Near You',
    siteUrl: row.siteUrl || 'https://verifiedtutor.in',
    phoneSupport: row.phoneSupport || '+91 90441 95981',
    minPayout: Number(row.minPayout || 500),
    payoutCycle: row.payoutCycle || 'weekly',
    emailVerification: Boolean(row.emailVerification),
    phoneVerification: Boolean(row.phoneVerification),
    registrationOpen: Boolean(row.registrationOpen),
    twoFactorAdmin: Boolean(row.twoFactorAdmin),
    autoApprove: Boolean(row.autoApprove),
    emailNewBooking: Boolean(row.emailNewBooking),
    emailPayment: Boolean(row.emailPayment),
    emailMarketing: Boolean(row.emailMarketing),
    smsBooking: Boolean(row.smsBooking),
    smsPayment: Boolean(row.smsPayment),
    primaryColor: row.primaryColor || '#056852',
    accentColor: row.accentColor || '#0ea5e9',
    darkMode: Boolean(row.darkMode),
    smtpHost: row.smtpHost || '',
    smtpPort: Number(row.smtpPort || 587),
    smtpUser: row.smtpUser || '',
    smtpPass: row.smtpPass || '',
    smsProvider: row.smsProvider || '',
    smsApiKey: row.smsApiKey || '',
    smsSenderId: row.smsSenderId || '',
    
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class Settings {
  static async findOne() {
    let rows = await query('SELECT * FROM settings LIMIT 1');
    if (!rows[0]) {
      await execute('INSERT INTO settings (platformName) VALUES (?)', ['VerifiedTutor']);
      rows = await query('SELECT * FROM settings LIMIT 1');
    }
    return formatSettings(rows[0]);
  }

  static async findOneAndUpdate(filter = {}, updates = {}, options = {}) {
    const s = await this.findOne();
    const u = updates.$set ? updates.$set : updates;
    const fields = [];
    const params = [];

    const stringFields = [
      'platformName', 'supportEmail', 'heroTitle', 'heroSubtitle', 'heroImage',
      'tagline', 'siteUrl', 'phoneSupport', 'payoutCycle', 'primaryColor',
      'accentColor', 'smtpHost', 'smtpUser', 'smtpPass', 'smsProvider',
      'smsApiKey', 'smsSenderId'
    ];

    const numFields = ['commissionRate', 'gstRate', 'minPayout', 'smtpPort'];

    const boolFields = [
      'maintenanceMode', 'emailVerification', 'phoneVerification', 'registrationOpen',
      'twoFactorAdmin', 'autoApprove', 'emailNewBooking', 'emailPayment',
      'emailMarketing', 'smsBooking', 'smsPayment', 'darkMode'
    ];

    const jsonFields = ['smtp', 'paymentMethods'];

    // Map strings
    for (const f of stringFields) {
      if (u[f] !== undefined) {
        fields.push(`\`${f}\` = ?`);
        params.push(u[f]);
      }
    }

    // Map numbers
    for (const f of numFields) {
      if (u[f] !== undefined) {
        fields.push(`\`${f}\` = ?`);
        params.push(u[f] !== null ? Number(u[f]) : null);
      }
    }

    // Map booleans
    for (const f of boolFields) {
      if (u[f] !== undefined) {
        fields.push(`\`${f}\` = ?`);
        params.push(u[f] ? 1 : 0);
      }
    }

    // Map JSON
    for (const f of jsonFields) {
      if (u[f] !== undefined) {
        fields.push(`\`${f}\` = ?`);
        params.push(JSON.stringify(u[f]));
      }
    }

    if (fields.length === 0) return s;

    params.push(s.id);
    await execute(`UPDATE settings SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findOne();
  }
}

export default Settings;
