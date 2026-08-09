import { Notification } from '../models/Notification.js';
import { ActivityLog } from '../models/ActivityLog.js';

/**
 * Create and emit a real-time notification.
 */
export async function createNotification(io, { recipientId, title, message, type = 'general', link, icon, metadata }) {
  const notification = await Notification.create({
    recipient: recipientId,
    title,
    message,
    type,
    link,
    icon,
    metadata,
  });

  // Emit to specific user room
  if (recipientId && io) {
    io.to(`user:${recipientId}`).emit('notification:new', notification);
  }

  return notification;
}

/**
 * Create an activity log entry.
 */
export async function logActivity({ userId, action, category = 'system', details, metadata, req }) {
  return ActivityLog.create({
    user: userId,
    action,
    category,
    details,
    metadata,
    ip: req?.ip || req?.connection?.remoteAddress,
    userAgent: req?.headers?.['user-agent'],
  });
}

/**
 * Emit a dashboard stats update to all connected admins.
 */
export function emitStatsUpdate(io, data) {
  if (io) {
    io.to('role:admin').emit('stats:update', data);
  }
}

/**
 * Emit a wallet update to a specific tutor.
 */
export function emitWalletUpdate(io, tutorId, walletData) {
  if (io) {
    io.to(`user:${tutorId}`).emit('wallet:updated', walletData);
  }
}
