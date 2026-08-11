import PlatformConfig from '../models/PlatformConfig.js';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';

export async function calculateCommissionRate(tutorId) {
  const tutor = await User.findById(tutorId);
  if (!tutor) throw new Error('Tutor not found');

  if (tutor.activeSubscription) {
    const sub = await Subscription.findById(tutor.activeSubscription);
    if (sub && sub.status === 'active' && new Date(sub.endDate) > new Date()) {
      return {
        rate: sub.commissionRate,
        source: 'subscription',
        tier: 'Premium',
      };
    }
  }

  const config = await PlatformConfig.getConfig();
  const sessions = tutor.completedSessions || 0;

  const tier = (config.commissionTiers || []).find(
    t => sessions >= t.minSessions && sessions <= t.maxSessions
  );

  const rate = tier ? tier.rate : 0.15;

  return {
    rate,
    source: 'tenure',
    tier: tier?.label || '0 – 20 Sessions',
    sessions,
  };
}

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

export async function incrementTutorSessions(tutorId) {
  const tutor = await User.findById(tutorId);
  if (!tutor) return;

  const newSessions = (tutor.completedSessions || 0) + 1;
  const { rate } = await calculateCommissionRate(tutorId);

  return User.findByIdAndUpdate(tutorId, {
    completedSessions: newSessions,
    currentCommissionRate: rate,
  });
}

export async function checkFreeLeadsAvailable(tutorId) {
  const tutor = await User.findById(tutorId);
  if (!tutor) throw new Error('Tutor not found');

  const config = await PlatformConfig.getConfig();
  const now = new Date();

  let used = tutor.freeLeadsUsed || 0;
  if (!tutor.freeLeadsResetDate || new Date(tutor.freeLeadsResetDate) < new Date(now.getFullYear(), now.getMonth(), 1)) {
    used = 0;
    await User.findByIdAndUpdate(tutorId, {
      freeLeadsUsed: 0,
      freeLeadsResetDate: new Date(now.getFullYear(), now.getMonth(), 1),
    });
  }

  let totalLeadLimit = config.freeLeadsPerMonth;
  if (tutor.activeSubscription) {
    const sub = await Subscription.findById(tutor.activeSubscription);
    if (sub && sub.status === 'active' && new Date(sub.endDate) > now) {
      totalLeadLimit = sub.leadLimit === -1 ? Infinity : sub.leadLimit;
    }
  }

  return {
    used,
    limit: totalLeadLimit === Infinity ? 'Unlimited' : totalLeadLimit,
    remaining: totalLeadLimit === Infinity ? 'Unlimited' : Math.max(0, totalLeadLimit - used),
    canReceiveLead: totalLeadLimit === Infinity || used < totalLeadLimit,
  };
}

export async function creditLeadBack(tutorId) {
  const tutor = await User.findById(tutorId);
  if (!tutor) return;

  if (tutor.freeLeadsUsed > 0) {
    await User.findByIdAndUpdate(tutorId, { freeLeadsUsed: tutor.freeLeadsUsed - 1 });
  }
}

export async function getCommissionStructure() {
  const config = await PlatformConfig.getConfig();
  return {
    tiers: (config.commissionTiers || []).map(t => ({
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
