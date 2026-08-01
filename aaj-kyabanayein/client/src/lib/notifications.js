/** Soft push / reminder scaffolding — browsers that support Notification API */
const KEY = "akb-notify-pref";

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
