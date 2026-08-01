/** Soft push / reminder scaffolding — browsers that support Notification API */
import { daysSinceLastActive, getCookingStats } from "./growth";
import { getWeeklySummary } from "./analytics";

const KEY = "akb-notify-pref";
const DAILY_SENT_KEY = "akb-daily-reminder-sent";
const WINBACK_SENT_KEY = "akb-winback-reminder-sent";
const WEEKLY_SENT_KEY = "akb-weekly-summary-sent";

export function getNotifyPref() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{"enabled":false}');
  } catch {
    return { enabled: false };
  }
}

export async function enableMealReminders() {
  if (!("Notification" in window)) {
    return { ok: false, reason: "unsupported" };
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, reason: "denied" };
  }
  localStorage.setItem(KEY, JSON.stringify({ enabled: true, at: new Date().toISOString() }));
  return { ok: true };
}

export function disableMealReminders() {
  localStorage.setItem(KEY, JSON.stringify({ enabled: false }));
}

/** Demo local reminder — real FCM can replace this later */
export function scheduleDemoReminder(title = "Aaj Kya Banaye?", body = "Breakfast decide kar lo — Rasoira ready hai.") {
  const pref = getNotifyPref();
  if (!pref.enabled || Notification.permission !== "granted") return false;
  setTimeout(() => {
    new Notification(title, { body, icon: "/logo.svg", tag: "rasoira-daily" });
  }, 3000);
  return true;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function weekKey() {
  const d = new Date();
  return `${d.getFullYear()}-W${Math.ceil((d.getDate() + 6 - d.getDay()) / 7)}`;
}

/** Fire daily / weekly / win-back reminders on app open (when enabled) */
export function initGrowthNotifications() {
  const pref = getNotifyPref();
  if (!pref.enabled || !("Notification" in window) || Notification.permission !== "granted") return;

  const today = todayKey();
  const hour = new Date().getHours();

  if (hour >= 8 && localStorage.getItem(DAILY_SENT_KEY) !== today) {
    new Notification("Aaj Kya Banaye?", {
      body: "Aaj ka meal plan tayyar hai — breakfast se dinner tak.",
      icon: "/logo.svg",
      tag: "rasoira-daily",
    });
    localStorage.setItem(DAILY_SENT_KEY, today);
  }

  const inactive = daysSinceLastActive();
  if (inactive >= 3 && localStorage.getItem(WINBACK_SENT_KEY) !== today) {
    new Notification("Miss you in the kitchen!", {
      body: `${inactive} din se cook nahi kiya — ek quick recipe try karo?`,
      icon: "/logo.svg",
      tag: "rasoira-winback",
    });
    localStorage.setItem(WINBACK_SENT_KEY, today);
  }

  const wk = weekKey();
  const isSunday = new Date().getDay() === 0;
  if (isSunday && hour >= 10 && localStorage.getItem(WEEKLY_SENT_KEY) !== wk) {
    const summary = getWeeklySummary();
    const stats = getCookingStats();
    new Notification("Weekly cooking summary", {
      body: `${summary.cookFinish} cooks · ${summary.activeDays} active days · 🔥 ${stats.currentStreak} streak`,
      icon: "/logo.svg",
      tag: "rasoira-weekly",
    });
    localStorage.setItem(WEEKLY_SENT_KEY, wk);
  }
}
