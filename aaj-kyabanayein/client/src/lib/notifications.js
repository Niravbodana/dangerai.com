/**
 * Local notification engine — browser Notification API only (no FCM/push provider).
 * Architecture: prefs → scheduler tick → builders → showLocalNotification
 */
import { daysSinceLastActive, getCookingStats } from "./growth";
import { getWeeklySummary } from "./analytics";

const DAILY_SENT_KEY = "akb-daily-reminder-sent";
const WINBACK_SENT_KEY = "akb-winback-reminder-sent";
const WEEKLY_SENT_KEY = "akb-weekly-summary-sent";

const PREFS_KEY = "akb-notify-pref";
const LOG_KEY = "akb-notify-log";
const PANTRY_KEY = "akb-pantry-v2";

export const NOTIFICATION_TYPES = {
  DAILY_COOKING: "dailyCooking",
  PANTRY: "pantry",
  MEAL: "meal",
  WEEKLY_RECAP: "weeklyRecap",
};

export const DEFAULT_NOTIFICATION_PREFS = {
  enabled: false,
  types: {
    dailyCooking: { enabled: true, time: "09:00" },
    pantry: { enabled: true, time: "10:00", expiringDays: 3 },
    meal: {
      enabled: true,
      times: { breakfast: "08:00", lunch: "12:30", snack: "16:30", dinner: "19:00" },
    },
    weeklyRecap: { enabled: true, day: 0, time: "18:00" },
  },
  smart: {
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
    skipIfCookedToday: true,
    streakNudge: true,
    maxPerDay: 6,
  },
};

let engineTimer = null;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function readLog() {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeLog(log) {
  localStorage.setItem(LOG_KEY, JSON.stringify(log));
}

function mergePrefs(stored = {}) {
  return {
    ...DEFAULT_NOTIFICATION_PREFS,
    ...stored,
    types: {
      ...DEFAULT_NOTIFICATION_PREFS.types,
      ...stored.types,
      dailyCooking: { ...DEFAULT_NOTIFICATION_PREFS.types.dailyCooking, ...stored.types?.dailyCooking },
      pantry: { ...DEFAULT_NOTIFICATION_PREFS.types.pantry, ...stored.types?.pantry },
      meal: {
        ...DEFAULT_NOTIFICATION_PREFS.types.meal,
        ...stored.types?.meal,
        times: { ...DEFAULT_NOTIFICATION_PREFS.types.meal.times, ...stored.types?.meal?.times },
      },
      weeklyRecap: { ...DEFAULT_NOTIFICATION_PREFS.types.weeklyRecap, ...stored.types?.weeklyRecap },
    },
    smart: { ...DEFAULT_NOTIFICATION_PREFS.smart, ...stored.smart },
  };
}

export function getNotifyPref() {
  try {
    return mergePrefs(JSON.parse(localStorage.getItem(PREFS_KEY) || "{}"));
  } catch {
    return mergePrefs();
  }
}

export function saveNotificationPrefs(partial) {
  const next = mergePrefs({ ...getNotifyPref(), ...partial });
  localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  return next;
}

export function updateNotificationType(type, partial) {
  const prefs = getNotifyPref();
  prefs.types[type] = { ...prefs.types[type], ...partial };
  return saveNotificationPrefs(prefs);
}

export function updateSmartPrefs(partial) {
  const prefs = getNotifyPref();
  prefs.smart = { ...prefs.smart, ...partial };
  return saveNotificationPrefs(prefs);
}

export async function requestNotificationPermission() {
  if (!("Notification" in window)) return { ok: false, reason: "unsupported" };
  const permission = await Notification.requestPermission();
  return { ok: permission === "granted", reason: permission };
}

export async function enableMealReminders() {
  const res = await requestNotificationPermission();
  if (!res.ok) return res;
  saveNotificationPrefs({ enabled: true, enabledAt: new Date().toISOString() });
  return { ok: true };
}

export function disableMealReminders() {
  saveNotificationPrefs({ enabled: false });
  stopNotificationEngine();
}

function parseTimeHM(timeStr) {
  const [h, m] = String(timeStr || "09:00").split(":").map(Number);
  return { hour: h || 0, minute: m || 0 };
}

function isSameMinute(now, timeStr) {
  const { hour, minute } = parseTimeHM(timeStr);
  return now.getHours() === hour && now.getMinutes() === minute;
}

function isQuietHours(now, prefs) {
  const start = parseTimeHM(prefs.smart.quietHoursStart);
  const end = parseTimeHM(prefs.smart.quietHoursEnd);
  const mins = now.getHours() * 60 + now.getMinutes();
  const startMins = start.hour * 60 + start.minute;
  const endMins = end.hour * 60 + end.minute;
  if (startMins <= endMins) return mins >= startMins && mins < endMins;
  return mins >= startMins || mins < endMins;
}

function firedKey(type, slot = "default") {
  return `${type}:${slot}:${todayKey()}`;
}

function alreadyFired(type, slot) {
  return !!readLog()[firedKey(type, slot)];
}

function markFired(type, slot = "default") {
  const log = readLog();
  log[firedKey(type, slot)] = new Date().toISOString();
  const dayPrefix = todayKey();
  const todayCount = Object.keys(log).filter((k) => k.endsWith(`:${dayPrefix}`)).length;
  if (todayCount >= (getNotifyPref().smart.maxPerDay || 6)) return;
  writeLog(log);
}

function canNotifyNow() {
  return typeof window !== "undefined"
    && "Notification" in window
    && Notification.permission === "granted"
    && getNotifyPref().enabled;
}

export function showLocalNotification({ type, title, body, tag }) {
  if (!canNotifyNow()) return false;
  const prefs = getNotifyPref();
  if (isQuietHours(new Date(), prefs)) return false;

  try {
    new Notification(title, { body, icon: "/logo.svg", tag: tag || `rasoira-${type}` });
    markFired(type, tag);
    return true;
  } catch {
    return false;
  }
}

function loadPantryExpiring(withinDays = 3) {
  try {
    const items = JSON.parse(localStorage.getItem(PANTRY_KEY) || "[]");
    const now = Date.now();
    const limit = withinDays * 86400000;
    return items.filter((i) => {
      if (!i.expiry) return false;
      const t = new Date(i.expiry).getTime();
      return t >= now && t - now <= limit;
    });
  } catch {
    return [];
  }
}

export function buildDailyCookingReminder(streak = {}) {
  const current = streak.current || 0;
  return {
    title: "Aaj Kya Banaye?",
    body: current > 0
      ? `🔥 ${current} din streak — aaj cook karke badhao!`
      : "Breakfast decide kar lo — Rasoira ready hai.",
    tag: "daily-cooking",
  };
}

export function buildPantryReminder(items = []) {
  if (!items.length) return null;
  const names = items.slice(0, 3).map((i) => i.label || i.key).join(", ");
  return {
    title: "Pantry reminder",
    body: items.length > 3
      ? `${names} +${items.length - 3} more expiring soon`
      : `${names} expiring soon — use before waste!`,
    tag: "pantry",
  };
}

export function buildMealReminder(mealType = "lunch", recipeName) {
  const labels = {
    breakfast: "Breakfast",
    lunch: "Lunch",
    snack: "Snack",
    dinner: "Dinner",
  };
  const label = labels[mealType] || "Meal";
  return {
    title: `${label} time`,
    body: recipeName
      ? `Planned: ${recipeName}`
      : `Check your meal plan for ${label.toLowerCase()} ideas.`,
    tag: `meal-${mealType}`,
  };
}

export function buildWeeklyRecap(streak = {}) {
  const cooks = streak.totalCooks || 0;
  const current = streak.current || 0;
  const badges = streak.badges?.length || 0;
  return {
    title: "Weekly cooking recap",
    body: `Streak: ${current} days · ${cooks} total cooks · ${badges} badges unlocked. Keep going!`,
    tag: "weekly-recap",
  };
}

function getPlannedMealForNow(mealPlan, mealType) {
  if (!mealPlan?.plans?.length) return null;
  const today = mealPlan.plans[0];
  const meal = today?.meals?.find((m) => m.mealType === mealType);
  return meal?.recipe?.name || null;
}

function inferMealTypeByHour(hour) {
  if (hour < 11) return "breakfast";
  if (hour < 15) return "lunch";
  if (hour < 18) return "snack";
  return "dinner";
}

export function tickNotificationEngine(context = {}) {
  if (!canNotifyNow()) return { fired: [] };

  const prefs = getNotifyPref();
  const now = new Date();
  if (isQuietHours(now, prefs)) return { fired: [] };

  const fired = [];
  const streak = context.streak || {};
  const cookedToday = streak.lastCookDate === todayKey();

  if (prefs.types.dailyCooking.enabled && isSameMinute(now, prefs.types.dailyCooking.time)) {
    if (!(prefs.smart.skipIfCookedToday && cookedToday) && !alreadyFired(NOTIFICATION_TYPES.DAILY_COOKING)) {
      const payload = buildDailyCookingReminder(streak);
      if (showLocalNotification({ type: NOTIFICATION_TYPES.DAILY_COOKING, ...payload })) {
        fired.push(NOTIFICATION_TYPES.DAILY_COOKING);
      }
    }
  }

  if (prefs.types.pantry.enabled && isSameMinute(now, prefs.types.pantry.time)) {
    if (!alreadyFired(NOTIFICATION_TYPES.PANTRY)) {
      const expiring = loadPantryExpiring(prefs.types.pantry.expiringDays);
      const payload = buildPantryReminder(expiring);
      if (payload && showLocalNotification({ type: NOTIFICATION_TYPES.PANTRY, ...payload })) {
        fired.push(NOTIFICATION_TYPES.PANTRY);
      }
    }
  }

  if (prefs.types.meal.enabled) {
    const mealTimes = prefs.types.meal.times || {};
    for (const [mealType, time] of Object.entries(mealTimes)) {
      if (!isSameMinute(now, time)) continue;
      const slot = `meal-${mealType}`;
      if (alreadyFired(NOTIFICATION_TYPES.MEAL, slot)) continue;
      const recipeName = getPlannedMealForNow(context.mealPlan, mealType);
      const payload = buildMealReminder(mealType, recipeName);
      if (showLocalNotification({ type: NOTIFICATION_TYPES.MEAL, ...payload, tag: slot })) {
        fired.push(slot);
      }
    }
  }

  if (prefs.types.weeklyRecap.enabled
    && now.getDay() === prefs.types.weeklyRecap.day
    && isSameMinute(now, prefs.types.weeklyRecap.time)) {
    if (!alreadyFired(NOTIFICATION_TYPES.WEEKLY_RECAP)) {
      const payload = buildWeeklyRecap(streak);
      if (showLocalNotification({ type: NOTIFICATION_TYPES.WEEKLY_RECAP, ...payload })) {
        fired.push(NOTIFICATION_TYPES.WEEKLY_RECAP);
      }
    }
  }

  return { fired };
}

export function initNotificationEngine(context = {}) {
  stopNotificationEngine();
  const prefs = getNotifyPref();
  if (!prefs.enabled) return;

  const run = () => tickNotificationEngine(context);
  run();
  engineTimer = setInterval(run, 60_000);
}

export function stopNotificationEngine() {
  if (engineTimer) {
    clearInterval(engineTimer);
    engineTimer = null;
  }
}

export function getSmartNotificationSummary() {
  const prefs = getNotifyPref();
  const enabledTypes = Object.entries(prefs.types)
    .filter(([, v]) => v.enabled)
    .map(([k]) => k);
  return {
    enabled: prefs.enabled,
    types: enabledTypes,
    quietHours: `${prefs.smart.quietHoursStart}–${prefs.smart.quietHoursEnd}`,
    skipIfCookedToday: prefs.smart.skipIfCookedToday,
  };
}

/** Demo local reminder — backward compatible with Today page */
export function scheduleDemoReminder(title = "Aaj Kya Banaye?", body = "Breakfast decide kar lo — Rasoira ready hai.") {
  if (!canNotifyNow()) return false;
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

/** Preview weekly recap without scheduling */
export function previewWeeklyRecap(streak) {
  return buildWeeklyRecap(streak);
}

/** Preview next meal reminder from plan */
export function previewMealReminder(mealPlan) {
  const mealType = inferMealTypeByHour(new Date().getHours());
  const recipeName = getPlannedMealForNow(mealPlan, mealType);
  return buildMealReminder(mealType, recipeName);
}
