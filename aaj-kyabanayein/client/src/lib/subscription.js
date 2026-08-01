/** Soft subscription tiers — Free / Plus / Family */
const KEY = "akb-subscription";
const USAGE_PREFIX = "akb-usage";
const TRIAL_DAYS = 7;

export const PLANS = {
  free: {
    id: "free",
    name: "Free",
    nameHi: "मुफ़्त",
    price: 0,
    features: [
      "791+ real recipes",
      "Cooking mode + voice",
      "Basic meal plan",
      "Pantry suggestions",
      "Daily Aaj Kya Banaye (1/day)",
    ],
  },
  plus: {
    id: "plus",
    name: "Rasoira Plus",
    nameHi: "रसोइरा प्लस",
    price: 99,
    period: "month",
    features: [
      "Unlimited AI daily plans",
      "Offline cook packs",
      "Hands-free voice chef",
      "Grocery WhatsApp + Instamart",
      "No ads · Priority photos",
      "Taste profile sync",
    ],
  },
  family: {
    id: "family",
    name: "Family",
    nameHi: "फ़ैमिली",
    price: 199,
    period: "month",
    features: [
      "Everything in Plus",
      "Up to 5 family profiles",
      "Shared pantry & meal plan",
      "Kids / Jain / diabetic filters",
    ],
  },
};

/** Feature flags — tier + optional free usage limits */
export const FEATURES = {
  dailyBrief: {
    id: "dailyBrief",
    label: "Aaj Kya Banaye",
    tier: "plus",
    freeLimit: 1,
    period: "day",
  },
  mealPlanner: {
    id: "mealPlanner",
    label: "Meal planner",
    tier: "free",
    freeLimit: 3,
    period: "week",
  },
  pantrySuggest: {
    id: "pantrySuggest",
    label: "Pantry suggestions",
    tier: "free",
    freeLimit: 5,
    period: "day",
  },
  offlinePacks: {
    id: "offlinePacks",
    label: "Offline cook packs",
    tier: "plus",
  },
  handsFreeVoice: {
    id: "handsFreeVoice",
    label: "Hands-free voice chef",
    tier: "plus",
  },
  familyProfiles: {
    id: "familyProfiles",
    label: "Family profiles",
    tier: "family",
    freeLimit: 1,
    plusLimit: 2,
    familyLimit: 5,
  },
};

const UPGRADE_PROMPTS = {
  dailyBrief: {
    title: "Unlock unlimited daily plans",
    message: "Free plan includes 1 Aaj Kya Banaye per day. Plus gives unlimited personalised briefs.",
    plan: "plus",
  },
  mealPlanner: {
    title: "More meal plans",
    message: "Free plan: 3 planner runs per week. Plus unlocks unlimited planning.",
    plan: "plus",
  },
  pantrySuggest: {
    title: "More pantry suggestions",
    message: "Free plan: 5 pantry suggestions per day. Plus removes the limit.",
    plan: "plus",
  },
  offlinePacks: {
    title: "Save recipes offline",
    message: "Offline cook packs are a Plus feature — cook without network.",
    plan: "plus",
  },
  handsFreeVoice: {
    title: "Hands-free voice chef",
    message: "Voice commands in cooking mode are included with Plus.",
    plan: "plus",
  },
  familyProfiles: {
    title: "Add more family profiles",
    message: "Family plan supports up to 5 profiles with shared pantry and plans.",
    plan: "family",
  },
  plus_required: {
    title: "Upgrade to Rasoira Plus",
    message: "This feature needs Plus — unlimited plans, offline packs, and more.",
    plan: "plus",
  },
  family_required: {
    title: "Upgrade to Family",
    message: "Multiple family profiles need the Family plan.",
    plan: "family",
  },
  trial_expired: {
    title: "Your trial has ended",
    message: "Subscribe to keep Plus features, or continue on the free plan.",
    plan: "plus",
  },
};

function periodKey(period = "day") {
  const d = new Date();
  if (period === "week") {
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil((((d - jan1) / 86400000) + jan1.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${week}`;
  }
  return d.toISOString().slice(0, 10);
}

export function getSubscription() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || "{}");
    return {
      plan: data.plan || "free",
      trialEnds: data.trialEnds || null,
      activatedAt: data.activatedAt || null,
      trialStartedAt: data.trialStartedAt || null,
    };
  } catch {
    return { plan: "free", trialEnds: null, activatedAt: null, trialStartedAt: null };
  }
}

function saveSubscription(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
  return data;
}

export function getEffectivePlan() {
  const sub = getSubscription();
  if (sub.plan === "free") return "free";
  if (sub.trialEnds && new Date(sub.trialEnds).getTime() < Date.now()) return "free";
  return sub.plan;
}

export function isOnTrial() {
  const sub = getSubscription();
  return sub.plan !== "free" && sub.trialEnds && new Date(sub.trialEnds).getTime() > Date.now();
}

export function getTrialDaysLeft() {
  const { trialEnds } = getSubscription();
  if (!trialEnds) return 0;
  return Math.max(0, Math.ceil((new Date(trialEnds).getTime() - Date.now()) / 86400000));
}

export function setSubscriptionPlan(planId) {
  const plan = PLANS[planId] ? planId : "free";
  const now = new Date().toISOString();
  const data = {
    plan,
    activatedAt: now,
    trialStartedAt: plan !== "free" ? now : null,
    trialEnds: plan !== "free"
      ? new Date(Date.now() + TRIAL_DAYS * 86400000).toISOString()
      : null,
  };
  return saveSubscription(data);
}

export function startTrial(planId = "plus") {
  if (getSubscription().trialStartedAt) {
    return { ok: false, reason: "trial_used", message: "Trial already used on this device." };
  }
  setSubscriptionPlan(planId);
  return { ok: true, ...getSubscription() };
}

export function isPlusOrAbove() {
  const plan = getEffectivePlan();
  return plan === "plus" || plan === "family";
}

export function isFamilyPlan() {
  return getEffectivePlan() === "family";
}

export function hasFeature(featureId) {
  const feature = FEATURES[featureId];
  if (!feature) return true;
  if (feature.tier === "free") return true;
  if (feature.tier === "plus") return isPlusOrAbove();
  if (feature.tier === "family") return isFamilyPlan();
  return false;
}

export function getUsageCount(featureId) {
  const feature = FEATURES[featureId];
  if (!feature?.freeLimit && !feature?.period) return 0;
  const key = `${USAGE_PREFIX}-${featureId}-${periodKey(feature.period)}`;
  return Number(localStorage.getItem(key) || 0);
}

export function incrementUsage(featureId) {
  const feature = FEATURES[featureId];
  if (!feature) return 0;
  const key = `${USAGE_PREFIX}-${featureId}-${periodKey(feature.period)}`;
  const next = getUsageCount(featureId) + 1;
  localStorage.setItem(key, String(next));
  return next;
}

export function getUpgradePrompt(featureOrReason) {
  const prompt = UPGRADE_PROMPTS[featureOrReason] || UPGRADE_PROMPTS.plus_required;
  return {
    ok: false,
    reason: featureOrReason in UPGRADE_PROMPTS ? featureOrReason : "plus_required",
    feature: featureOrReason,
    upgradeUrl: "/pricing",
    cta: prompt.plan === "family" ? "Upgrade to Family" : "Start 7-day trial",
    ...prompt,
  };
}

export function checkFeature(featureId, context = {}) {
  const feature = FEATURES[featureId];
  if (!feature) return { ok: true };

  if (getSubscription().plan !== "free" && !isPlusOrAbove() && getSubscription().trialEnds) {
    return getUpgradePrompt("trial_expired");
  }

  if (featureId === "familyProfiles") {
    const count = context.count ?? 0;
    if (isFamilyPlan()) return count < (feature.familyLimit || 5) ? { ok: true } : getUpgradePrompt("familyProfiles");
    if (isPlusOrAbove()) {
      return count < (feature.plusLimit || 2)
        ? { ok: true }
        : { ...getUpgradePrompt("familyProfiles"), reason: "family_required" };
    }
    return count < (feature.freeLimit || 1)
      ? { ok: true }
      : { ...getUpgradePrompt("familyProfiles"), reason: "family_required" };
  }

  if (feature.tier === "plus" && !isPlusOrAbove()) {
    if (feature.freeLimit) {
      const used = getUsageCount(featureId);
      if (used >= feature.freeLimit) return getUpgradePrompt(featureId);
      return { ok: true, remaining: feature.freeLimit - used };
    }
    return getUpgradePrompt(featureId);
  }

  if (feature.tier === "family" && !isFamilyPlan()) {
    return getUpgradePrompt("familyProfiles");
  }

  if (feature.freeLimit && !isPlusOrAbove()) {
    const used = getUsageCount(featureId);
    if (used >= feature.freeLimit) return getUpgradePrompt(featureId);
    return { ok: true, remaining: feature.freeLimit - used };
  }

  return { ok: true };
}

export function getUsageSummary() {
  return Object.values(FEATURES)
    .filter((f) => f.freeLimit)
    .map((f) => ({
      id: f.id,
      label: f.label,
      used: getUsageCount(f.id),
      limit: f.freeLimit,
      period: f.period || "day",
      unlimited: isPlusOrAbove() || f.tier === "free" && !f.freeLimit,
    }));
}

/** Soft locks — free users get limited daily AI plans */
export function canUseDailyBrief() {
  const result = checkFeature("dailyBrief");
  if (!result.ok) return { ...result, message: result.message };
  return result;
}

export function markDailyBriefUsed() {
  incrementUsage("dailyBrief");
}

export function canUseMealPlanner() {
  return checkFeature("mealPlanner");
}

export function markMealPlannerUsed() {
  incrementUsage("mealPlanner");
}

export function canUsePantrySuggest() {
  return checkFeature("pantrySuggest");
}

export function markPantrySuggestUsed() {
  incrementUsage("pantrySuggest");
}

export function canSaveOfflinePack() {
  return checkFeature("offlinePacks");
}

export function canAddFamilyMember(currentCount) {
  const result = checkFeature("familyProfiles", { count: currentCount });
  if (result.ok) return { ok: true };
  return { ok: false, reason: result.reason, message: result.message };
}
