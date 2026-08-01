/** Cook streak + badges — local habit loop */
const KEY = "akb-streak";

const BADGES = [
  { id: "first-cook", name: "Pehli Rasoi", nameHi: "पहली रसोई", need: 1, icon: "🍳" },
  { id: "streak-3", name: "3 Din Streak", nameHi: "३ दिन स्ट्रीक", needStreak: 3, icon: "🔥" },
  { id: "streak-7", name: "Hafta Complete", nameHi: "हफ़्ता पूरा", needStreak: 7, icon: "⭐" },
  { id: "cooks-10", name: "10 Meals", nameHi: "१० भोजन", need: 10, icon: "🍲" },
  { id: "cooks-30", name: "Ghar Ka Chef", nameHi: "घर का शेफ़", need: 30, icon: "👨‍🍳" },
  { id: "voice-5", name: "Voice Chef", nameHi: "वॉइस शेफ़", needVoice: 5, icon: "🔊" },
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function write(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function getStreak() {
  const data = read();
  return {
    current: data.current || 0,
    best: data.best || 0,
    totalCooks: data.totalCooks || 0,
    voiceUses: data.voiceUses || 0,
    lastCookDate: data.lastCookDate || null,
    badges: data.badges || [],
    cookDates: data.cookDates || [],
  };
}

function unlockBadges(data) {
  const unlocked = new Set(data.badges || []);
  for (const b of BADGES) {
    if (unlocked.has(b.id)) continue;
    if (b.need && (data.totalCooks || 0) >= b.need) unlocked.add(b.id);
    if (b.needStreak && (data.current || 0) >= b.needStreak) unlocked.add(b.id);
    if (b.needVoice && (data.voiceUses || 0) >= b.needVoice) unlocked.add(b.id);
  }
  data.badges = [...unlocked];
  return data;
}

/** Call when user finishes cooking a recipe */
export function recordCookFinish(recipeId) {
  const data = read();
  const today = todayKey();
  const dates = new Set(data.cookDates || []);

  if (!dates.has(today)) {
    if (data.lastCookDate === yesterdayKey()) {
      data.current = (data.current || 0) + 1;
    } else {
      data.current = 1;
    }
    data.lastCookDate = today;
    dates.add(today);
  }

  data.totalCooks = (data.totalCooks || 0) + 1;
  data.best = Math.max(data.best || 0, data.current || 0);
  data.cookDates = [...dates].slice(-90);
  data.lastRecipeId = recipeId;
  unlockBadges(data);
  write(data);
  return getStreak();
}

export function recordVoiceUse() {
  const data = read();
  data.voiceUses = (data.voiceUses || 0) + 1;
  unlockBadges(data);
  write(data);
  return getStreak();
}

export function getBadgeCatalog() {
  const { badges } = getStreak();
  return BADGES.map((b) => ({ ...b, unlocked: badges.includes(b.id) }));
}

export function getCooksBeforeAccountWall() {
  return getStreak().totalCooks;
}
