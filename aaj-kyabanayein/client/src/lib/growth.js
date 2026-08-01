/** Growth systems — stats, milestones, referrals, home picks */
import { getLastActiveTimestamp, getRecentRecipeIds, getWeeklySummary } from "./analytics";
import { getBadgeCatalog, getStreak } from "./streak";
import { getTasteProfile } from "./tasteProfile";

const REFERRAL_KEY = "akb-referral-code";
const REFERRAL_CAPTURED_KEY = "akb-referral-captured";

export function getOrCreateReferralCode() {
  let code = localStorage.getItem(REFERRAL_KEY);
  if (!code) {
    code = `RAS${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    localStorage.setItem(REFERRAL_KEY, code);
  }
  return code;
}

export function buildReferralLink() {
  const code = getOrCreateReferralCode();
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/?ref=${code}`;
}

export function captureReferralFromUrl() {
  if (typeof window === "undefined") return null;
  const ref = new URLSearchParams(window.location.search).get("ref");
  if (!ref || localStorage.getItem(REFERRAL_CAPTURED_KEY)) return null;
  localStorage.setItem(REFERRAL_CAPTURED_KEY, ref);
  return ref;
}

export function getMilestones() {
  const streak = getStreak();
  return getBadgeCatalog().map((b) => {
    let current = 0;
    let target = 1;
    if (b.need) {
      current = streak.totalCooks;
      target = b.need;
    } else if (b.needStreak) {
      current = streak.current;
      target = b.needStreak;
    } else if (b.needVoice) {
      current = streak.voiceUses;
      target = b.needVoice;
    }
    return { ...b, current, target, progress: Math.min(100, Math.round((current / target) * 100)) };
  });
}

export function getCookingStats() {
  const streak = getStreak();
  const weekly = getWeeklySummary();
  return {
    totalCooks: streak.totalCooks,
    currentStreak: streak.current,
    bestStreak: streak.best,
    voiceUses: streak.voiceUses,
    badgesUnlocked: streak.badges.length,
    thisWeek: weekly,
  };
}

export function getHomeRecommendations() {
  return {
    recentRecipeIds: getRecentRecipeIds(4),
    taste: getTasteProfile(),
    streak: getStreak().current,
  };
}

export function daysSinceLastActive() {
  const last = getLastActiveTimestamp();
  if (!last) return 0;
  return Math.floor((Date.now() - new Date(last).getTime()) / 86400000);
}

export function shouldShowWinBack() {
  return daysSinceLastActive() >= 3;
}
