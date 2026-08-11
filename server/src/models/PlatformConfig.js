import { query, execute } from '../config/db.js';

function parseJson(val, fallback) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

export function formatPlatformConfig(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    freeLeadsPerMonth: Number(row.freeLeadsPerMonth || 5),
    leadDisputeWindowHours: Number(row.leadDisputeWindowHours || 48),
    autoReplacementEnabled: Boolean(row.autoReplacementEnabled),
    otpVerificationForLeads: Boolean(row.otpVerificationForLeads),
    commissionTiers: parseJson(row.commissionTiers, []),
    payoutWindowDays: Number(row.payoutWindowDays || 5),
    minimumWithdrawalAmount: Number(row.minimumWithdrawalAmount || 500),
    platformName: row.platformName || 'TutorConnect',
    supportEmail: row.supportEmail || 'support@tutorconnect.com',
    supportPhone: row.supportPhone || '+91 123 456 7890',
    platformAddress: row.platformAddress || 'Lucknow, Uttar Pradesh, India',
    gstRate: Number(row.gstRate || 18),
    gstEnabled: Boolean(row.gstEnabled),
    maintenanceMode: Boolean(row.maintenanceMode),
    maintenanceMessage: row.maintenanceMessage || 'Platform is under maintenance.',
    smtp: parseJson(row.smtp, {}),
    razorpayKeyId: row.razorpayKeyId,
    razorpayKeySecret: row.razorpayKeySecret,
    cloudinaryCloudName: row.cloudinaryCloudName,
    cloudinaryApiKey: row.cloudinaryApiKey,
    cloudinaryApiSecret: row.cloudinaryApiSecret,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PlatformConfig {
  static async getConfig() {
    let rows = await query('SELECT * FROM platform_config LIMIT 1');
    if (!rows[0]) {
      const defaultTiers = [
        { minSessions: 0, maxSessions: 20, rate: 0.15, label: '0 – 20 Sessions' },
        { minSessions: 21, maxSessions: 100, rate: 0.10, label: '21 – 100 Sessions' },
        { minSessions: 101, maxSessions: 999999, rate: 0.05, label: '100+ Sessions' },
      ];
      await execute('INSERT INTO platform_config (freeLeadsPerMonth, commissionTiers) VALUES (?, ?)', [5, JSON.stringify(defaultTiers)]);
      rows = await query('SELECT * FROM platform_config LIMIT 1');
    }
    return formatPlatformConfig(rows[0]);
  }

  static async findOne() {
    return this.getConfig();
  }

  static async findOneAndUpdate(filter = {}, updates = {}, options = {}) {
    const config = await this.getConfig();
    const fields = [];
    const params = [];

    const u = updates.$set ? updates.$set : updates;

    if (u.freeLeadsPerMonth !== undefined) { fields.push('freeLeadsPerMonth = ?'); params.push(u.freeLeadsPerMonth); }
    if (u.leadDisputeWindowHours !== undefined) { fields.push('leadDisputeWindowHours = ?'); params.push(u.leadDisputeWindowHours); }
    if (u.autoReplacementEnabled !== undefined) { fields.push('autoReplacementEnabled = ?'); params.push(u.autoReplacementEnabled ? 1 : 0); }
    if (u.otpVerificationForLeads !== undefined) { fields.push('otpVerificationForLeads = ?'); params.push(u.otpVerificationForLeads ? 1 : 0); }
    if (u.commissionTiers !== undefined) { fields.push('commissionTiers = ?'); params.push(JSON.stringify(u.commissionTiers)); }
    if (u.payoutWindowDays !== undefined) { fields.push('payoutWindowDays = ?'); params.push(u.payoutWindowDays); }
    if (u.minimumWithdrawalAmount !== undefined) { fields.push('minimumWithdrawalAmount = ?'); params.push(u.minimumWithdrawalAmount); }
    if (u.platformName !== undefined) { fields.push('platformName = ?'); params.push(u.platformName); }
    if (u.supportEmail !== undefined) { fields.push('supportEmail = ?'); params.push(u.supportEmail); }
    if (u.supportPhone !== undefined) { fields.push('supportPhone = ?'); params.push(u.supportPhone); }
    if (u.platformAddress !== undefined) { fields.push('platformAddress = ?'); params.push(u.platformAddress); }
    if (u.gstRate !== undefined) { fields.push('gstRate = ?'); params.push(u.gstRate); }
    if (u.gstEnabled !== undefined) { fields.push('gstEnabled = ?'); params.push(u.gstEnabled ? 1 : 0); }
    if (u.maintenanceMode !== undefined) { fields.push('maintenanceMode = ?'); params.push(u.maintenanceMode ? 1 : 0); }
    if (u.maintenanceMessage !== undefined) { fields.push('maintenanceMessage = ?'); params.push(u.maintenanceMessage); }
    if (u.smtp !== undefined) { fields.push('smtp = ?'); params.push(JSON.stringify(u.smtp)); }
    if (u.razorpayKeyId !== undefined) { fields.push('razorpayKeyId = ?'); params.push(u.razorpayKeyId); }
    if (u.razorpayKeySecret !== undefined) { fields.push('razorpayKeySecret = ?'); params.push(u.razorpayKeySecret); }
    if (u.cloudinaryCloudName !== undefined) { fields.push('cloudinaryCloudName = ?'); params.push(u.cloudinaryCloudName); }
    if (u.cloudinaryApiKey !== undefined) { fields.push('cloudinaryApiKey = ?'); params.push(u.cloudinaryApiKey); }
    if (u.cloudinaryApiSecret !== undefined) { fields.push('cloudinaryApiSecret = ?'); params.push(u.cloudinaryApiSecret); }

    if (fields.length === 0) return config;

    params.push(config.id);
    await execute(`UPDATE platform_config SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.getConfig();
  }
}

export default PlatformConfig;
