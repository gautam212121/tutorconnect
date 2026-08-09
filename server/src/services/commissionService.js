import { PlatformConfig } from '../models/PlatformConfig.js';
import { User } from '../models/User.js';

/**
 * Commission Calculation Service
 * Implements FR-MON-3, FR-MON-4, FR-MON-5 from the monetization spec.
 *
 * Commission is charged ONLY on a confirmed conversion (first completed paid session).
 * Rate decreases with tutor tenure. Subscription can reduce/eliminate it.
 */

/**
 * Calculate the effective commission rate for a tutor.
 * Checks subscription first, then falls back to tenure-based tiers.
 */
export async function calculateCommissionRate(tutorId) {
  const tutor = await User.findById(tutorId).populate('activeSubscription');
  if (!tutor) throw new Error('Tutor not found');

  // FR-MON-4: If tutor has active subscription, use subscription's commission rate
  if (tutor.activeSubscription && tutor.activeSubscription.status === 'active') {
    const now = new Date();
    if (tutor.activeSubscription.endDate > now) {
      return {
        rate: tutor.activeSubscription.commissionRate,
        source: 'subscription',
        tier: tutor.activeSubscription.plan?.name || 'Premium',
      };
    }
  }

  // FR-MON-5: Tenure-based decreasing commission
  const config = await PlatformConfig.getConfig();
  const sessions = tutor.completedSessions || 0;

  const tier = config.commissionTiers.find(
    t => sessions >= t.minSessions && sessions <= t.maxSessions
  );

  const rate = tier ? tier.rate : 0.15; // default 15%

  return {
    rate,
    source: 'tenure',
    tier: tier?.label || '0 – 20 Sessions',
    sessions,
  };
}

/**
 * Calculate commission amounts for a payment.
 * Returns { totalAmount, commissionAmount, tutorEarning, commissionRate }
 */
export async function calculateCommissionAmounts(tutorId, totalAmount) {
  const { rate, source, tier } = await calculateCommissionRate(tutorId);

  const commissionAmount = Math.round(totalAmount * rate);
  const tutorEarning = totalAmount - commissionAmount;

  return {
    totalAmount,
    commissionAmount,
    tutorEarning,
    commissionRate: rate,
    commissionSource: source,
    commissionTier: tier,
  };
}

/**
 * After a session is completed, increment the tutor's completed sessions
 * and recalculate their commission rate.
 */
export async function incrementTutorSessions(tutorId) {
  const tutor = await User.findById(tutorId);
  if (!tutor) return;

  tutor.completedSessions = (tutor.completedSessions || 0) + 1;

  // Recalculate commission rate based on new session count
  const { rate } = await calculateCommissionRate(tutorId);
  tutor.currentCommissionRate = rate;

  await tutor.save();
  return tutor;
}

/**
 * Check if a tutor has free leads remaining this month.
 * Resets counter if the reset date has passed.
 */
export async function checkFreeLeadsAvailable(tutorId) {
  const tutor = await User.findById(tutorId);
  if (!tutor) throw new Error('Tutor not found');

  const config = await PlatformConfig.getConfig();
  const now = new Date();

  // Reset free leads counter if month has changed
  if (!tutor.freeLeadsResetDate || tutor.freeLeadsResetDate < new Date(now.getFullYear(), now.getMonth(), 1)) {
    tutor.freeLeadsUsed = 0;
    tutor.freeLeadsResetDate = new Date(now.getFullYear(), now.getMonth(), 1);
    await tutor.save();
  }

  // Check subscription for extra lead limit
  let totalLeadLimit = config.freeLeadsPerMonth;
  if (tutor.activeSubscription) {
    const sub = await tutor.populate('activeSubscription');
    if (sub.activeSubscription?.status === 'active' && sub.activeSubscription.endDate > now) {
      totalLeadLimit = sub.activeSubscription.leadLimit === -1
        ? Infinity
        : sub.activeSubscription.leadLimit;
    }
  }

  return {
    used: tutor.freeLeadsUsed,
    limit: totalLeadLimit === Infinity ? 'Unlimited' : totalLeadLimit,
    remaining: totalLeadLimit === Infinity ? 'Unlimited' : Math.max(0, totalLeadLimit - tutor.freeLeadsUsed),
    canReceiveLead: totalLeadLimit === Infinity || tutor.freeLeadsUsed < totalLeadLimit,
  };
}

/**
 * Credit a lead back to tutor's free leads (after dispute auto-resolution).
 */
export async function creditLeadBack(tutorId) {
  const tutor = await User.findById(tutorId);
  if (!tutor) return;

  if (tutor.freeLeadsUsed > 0) {
    tutor.freeLeadsUsed -= 1;
    await tutor.save();
  }
}

/**
 * Get the full commission structure for display.
 */
export async function getCommissionStructure() {
  const config = await PlatformConfig.getConfig();
  return {
    tiers: config.commissionTiers.map(t => ({
      label: t.label,
      minSessions: t.minSessions,
      maxSessions: t.maxSessions,
      rate: t.rate,
      ratePercent: `${Math.round(t.rate * 100)}%`,
    })),
    freeLeadsPerMonth: config.freeLeadsPerMonth,
    leadDisputeWindowHours: config.leadDisputeWindowHours,
    autoReplacementEnabled: config.autoReplacementEnabled,
  };
}
