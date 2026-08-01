/** Soft subscription tiers — Free / Plus / Family */
const KEY = "akb-subscription";

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

export function getSubscription() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || "{}");
    return {
      plan: data.plan || "free",
      trialEnds: data.trialEnds || null,
      activatedAt: data.activatedAt || null,
    };
  } catch {
    return { plan: "free", trialEnds: null, activatedAt: null };
  }
}

export function setSubscriptionPlan(planId) {
  const plan = PLANS[planId] ? planId : "free";
  const data = {
    plan,
    activatedAt: new Date().toISOString(),
    trialEnds: plan !== "free"
      ? new Date(Date.now() + 7 * 86400000).toISOString()
      : null,
  };
  localStorage.setItem(KEY, JSON.stringify(data));
  return data;
}

export function isPlusOrAbove() {
  const { plan, trialEnds } = getSubscription();
  if (plan === "free") return false;
  if (trialEnds && new Date(trialEnds).getTime() < Date.now()) return false;
  return plan === "plus" || plan === "family";
}

export function isFamilyPlan() {
  const { plan } = getSubscription();
  return plan === "family";
}

/** Soft locks — free users get limited daily AI plans */
export function canUseDailyBrief() {
  if (isPlusOrAbove()) return { ok: true };
  const day = new Date().toISOString().slice(0, 10);
  const key = `akb-daily-brief-${day}`;
  const used = Number(localStorage.getItem(key) || 0);
  if (used >= 1) return { ok: false, reason: "plus_required", message: "Free plan: 1 daily brief. Unlock Plus for unlimited." };
  return { ok: true, remaining: 1 - used };
}

export function markDailyBriefUsed() {
  const day = new Date().toISOString().slice(0, 10);
  const key = `akb-daily-brief-${day}`;
  localStorage.setItem(key, String(Number(localStorage.getItem(key) || 0) + 1));
}

export function canAddFamilyMember(currentCount) {
  if (isFamilyPlan()) return { ok: currentCount < 5 };
  if (isPlusOrAbove()) return { ok: currentCount < 2, reason: "family_required" };
  return { ok: currentCount < 1, reason: "family_required" };
}
