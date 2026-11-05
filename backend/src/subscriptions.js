export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    priceInr: 0,
    billingInterval: 'forever',
    limits: { monthlyVoiceMinutes: 0, monthlyVideoCalls: 0 },
    features: ['Profile and partner discovery', 'Text messaging', 'Public speaking rooms'],
  },
  basic: {
    id: 'basic',
    name: 'BYTALK Basic',
    priceInr: 199,
    billingInterval: 'month',
    limits: { monthlyVoiceMinutes: null, monthlyVideoCalls: 0 },
    features: ['Active 1-on-1 normal voice calling', 'Random partner matching', 'Unlimited ARYA AI speaking practice', 'Community discovery'],
  },
  plus: {
    id: 'plus',
    name: 'BYTALK Plus',
    priceInr: 299,
    billingInterval: 'month',
    limits: { monthlyVoiceMinutes: null, monthlyVideoCalls: 10 },
    features: ['Everything in Basic', 'HD Video-call practice', 'Advanced language and country filters', 'Standard premium rooms'],
  },
  pro: {
    id: 'pro',
    name: 'BYTALK Pro',
    priceInr: 399,
    billingInterval: 'month',
    limits: { monthlyVoiceMinutes: null, monthlyVideoCalls: null },
    features: ['Everything in Plus', 'Unlimited HD Video calling', 'Premium speaking rooms', 'Priority discovery', 'Advanced learning statistics'],
  },
};

export const DEFAULT_PRO_PLANS = [
  {
    id: 'basic',
    name: 'Basic Calling',
    duration: '1 Month Basic',
    durationDays: 30,
    price: 199,
    originalPrice: 499,
    savings: 'Save 60%',
    badge: 'Basic Calling',
    badgeColor: '#10B981',
    badgeBg: '#ECFDF5',
    unitText: '/Month',
    order: 1,
    active: true,
    features: [
      'Active 1-on-1 normal voice calling',
      'Instant partner audio calls',
      'Live random speaker matching',
      'Unlimited ARYA AI conversations',
    ],
  },
  {
    id: '1month',
    name: '1 Month Pro',
    duration: '1 Month',
    durationDays: 30,
    price: 399,
    originalPrice: 500,
    savings: 'Save 20%',
    badge: 'HD Video + Voice',
    badgeColor: '#6B7280',
    badgeBg: '#F3F4F6',
    unitText: '/Month',
    order: 2,
    active: true,
    features: [
      'Unlimited normal voice calls & HD video calls',
      'Unlimited ARYA AI conversations',
      'All topics unlocked',
      'One-time payment',
    ],
  },
  {
    id: '3months',
    name: '3 Months Pro',
    duration: '3 Months',
    durationDays: 90,
    price: 699,
    originalPrice: 1500,
    savings: 'Save 53%',
    badge: 'Most Popular',
    badgeColor: '#EA580C',
    badgeBg: '#FFEDD5',
    unitText: '/3 Months',
    order: 3,
    active: true,
    features: [
      'Unlimited normal voice calls & HD video calls',
      'Unlimited ARYA AI conversations',
      'All daily & business topics',
      'One-time payment, no autopay',
      'Priority matching',
    ],
  },
  {
    id: '1year',
    name: '1 Year Pro',
    duration: '1 Year',
    durationDays: 365,
    price: 1399,
    originalPrice: 6000,
    savings: 'Save 77%',
    badge: 'Most Valued',
    badgeColor: '#D97706',
    badgeBg: '#FEF3C7',
    unitText: '/Year',
    order: 4,
    active: true,
    features: [
      'Unlimited normal voice calls & HD video calls',
      'Unlimited ARYA AI conversations',
      'All interview preparation topics',
      'No autopay, 1-year full access',
      'Priority matching & zero wait time',
    ],
  },
];

export function getPlan(planId) {
  if (planId === 'basic') return SUBSCRIPTION_PLANS.basic;
  if (planId === 'plus') return SUBSCRIPTION_PLANS.plus;
  if (['pro', '1month', '3months', '1year'].includes(planId)) return SUBSCRIPTION_PLANS.pro;
  return SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.free;
}

export function activeSubscription(user) {
  if (!user) {
    return {
      plan: SUBSCRIPTION_PLANS.free,
      status: 'inactive',
      expiresAt: null,
      renewalStatus: 'not_applicable',
      provider: null,
      providerCustomerId: null,
      providerPurchaseId: null,
      startedAt: null,
      entitlementId: null,
    };
  }
  const planId = user.subscriptionPlan || 'free';
  const expiresAt = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null;
  const providerStatus = user.subscriptionStatus || 'inactive';
  const active = planId !== 'free'
    && ['active', 'cancelled'].includes(providerStatus)
    && (!expiresAt || expiresAt > new Date());
  const remainingDays = active
    ? (expiresAt ? Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 30)
    : 0;

  return {
    plan: active ? getPlan(planId) : SUBSCRIPTION_PLANS.free,
    status: active ? (user.subscriptionStatus || 'active') : planId === 'free' ? 'inactive' : 'expired',
    expiresAt: active ? user.subscriptionExpiresAt || null : null,
    remainingDays,
    renewalStatus: user.subscriptionRenewalStatus || 'not_applicable',
    provider: user.subscriptionProvider || null,
    providerCustomerId: user.subscriptionProviderCustomerId || null,
    providerPurchaseId: user.subscriptionProviderPurchaseId || null,
    startedAt: user.subscriptionStartedAt || null,
    entitlementId: user.subscriptionEntitlementId || null,
  };
}

export function monthKey(date = new Date()) {
  const value = new Date(date);
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function resetUsageIfNeeded(user) {
  if (!user) return;
  const currentMonth = monthKey();
  if (user.usageMonth !== currentMonth) {
    user.usageMonth = currentMonth;
    user.voiceMinutesUsed = 0;
    user.videoCallsUsed = 0;
  }
}

export function dayKey(date = new Date()) {
  const value = new Date(date);
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}-${String(value.getUTCDate()).padStart(2, '0')}`;
}

export function resetDailyFreeVoiceIfNeeded(user) {
  if (!user) return;
  const currentDay = dayKey();
  if (user.freeVoiceDay !== currentDay) {
    user.freeVoiceDay = currentDay;
    user.voiceSecondsUsed = 0;
  }
}

export const FREE_TRIAL_VOICE_SECONDS = 600; // 10 minutes free trial every day
export const FREE_TRIAL_VOICE_MINUTES = 10;

export function isPaidSubscriber(user) {
  if (!user) return false;
  const subscription = activeSubscription(user);
  return subscription.plan.id !== 'free';
}

export function getFreeTrialSecondsRemaining(user) {
  if (!user) return 0;
  if (isPaidSubscriber(user)) return Infinity;
  resetDailyFreeVoiceIfNeeded(user);
  const usedSeconds = user.voiceSecondsUsed ?? ((user.voiceMinutesUsed || 0) * 60);
  return Math.max(0, FREE_TRIAL_VOICE_SECONDS - usedSeconds);
}

/**
 * Normal voice/audio calling:
 * - Paid subscribers have unlimited/plan-based calling.
 * - Every user gets 10 minutes free every day.
 */
export function canUseAudio(user) {
  if (!user) return false;
  const subscription = activeSubscription(user);
  if (subscription.plan.id !== 'free') {
    resetUsageIfNeeded(user);
    const limit = subscription.plan.limits?.monthlyVoiceMinutes;
    return limit === null || (user.voiceMinutesUsed || 0) < limit;
  }
  const remainingSeconds = getFreeTrialSecondsRemaining(user);
  return remainingSeconds > 0;
}

/**
 * Video calling requires an active Plus or Pro subscription (Basic is audio-only).
 */
export function canUseVideo(user) {
  if (!user) return false;
  const subscription = activeSubscription(user);
  if (['free', 'basic'].includes(subscription.plan.id)) return false;
  resetUsageIfNeeded(user);
  const limit = subscription.plan.limits?.monthlyVideoCalls;
  return limit === null || (user.videoCallsUsed || 0) < limit;
}

export function entitlementPayload(user) {
  const subscription = activeSubscription(user);
  resetUsageIfNeeded(user);
  resetDailyFreeVoiceIfNeeded(user);
  const isPaid = subscription.plan.id !== 'free';
  const freeSecondsRemaining = getFreeTrialSecondsRemaining(user);
  return {
    ...subscription,
    isPaidSubscriber: isPaid,
    freeTrial: {
      totalSeconds: FREE_TRIAL_VOICE_SECONDS,
      remainingSeconds: isPaid ? null : freeSecondsRemaining,
      remainingMinutes: isPaid ? null : Math.ceil(freeSecondsRemaining / 60),
      isExpired: !isPaid && freeSecondsRemaining <= 0,
    },
    usage: {
      month: user?.usageMonth || monthKey(),
      voiceMinutesUsed: user?.voiceMinutesUsed || 0,
      videoCallsUsed: user?.videoCallsUsed || 0,
    },
  };
}
