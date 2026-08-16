import { execute } from '../config/db.js';

/**
 * Logs an administrative action in the audit trail.
 * @param {number} userId 
 * @param {string} userEmail 
 * @param {string} action 
 * @param {string|object} details 
 * @param {string} ipAddress 
 */
export async function logAudit(userId, userEmail, action, details = '', ipAddress = '') {
  try {
    const detailStr = typeof details === 'object' ? JSON.stringify(details) : details;
    await execute(
      'INSERT INTO audit_logs (userId, userEmail, action, details, ipAddress) VALUES (?, ?, ?, ?, ?)',
      [userId, userEmail, action, detailStr, ipAddress]
    );
  } catch (err) {
    console.error('Audit log write failed:', err);
  }
}
