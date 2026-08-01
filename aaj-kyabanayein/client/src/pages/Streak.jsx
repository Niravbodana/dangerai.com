import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getBadgeCatalog, getStreak } from "../lib/streak";
import {
  disableMealReminders,
  enableMealReminders,
  getNotifyPref,
  initNotificationEngine,
  previewWeeklyRecap,
  stopNotificationEngine,
  updateNotificationType,
  updateSmartPrefs,
} from "../lib/notifications";

export default function StreakPage() {
  const streak = getStreak();
  const badges = getBadgeCatalog();
  const [notifyPrefs, setNotifyPrefs] = useState(getNotifyPref);
  const weeklyPreview = previewWeeklyRecap(streak);

  useEffect(() => {
    if (!notifyPrefs.enabled) {
      stopNotificationEngine();
      return undefined;
    }
    initNotificationEngine({ streak });
    return () => stopNotificationEngine();
  }, [notifyPrefs.enabled, streak.current, streak.totalCooks]);

  const handleToggleNotifications = async () => {
    if (notifyPrefs.enabled) {
      disableMealReminders();
      setNotifyPrefs(getNotifyPref());
      return;
    }
    const res = await enableMealReminders();
    if (res.ok) setNotifyPrefs(getNotifyPref());
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-3xl text-[var(--text-primary)]">Cook Streak</h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Ghar ka khana — roz thoda pride. Streak todna mat!
      </p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { n: streak.current, l: "Current" },
          { n: streak.best, l: "Best" },
          { n: streak.totalCooks, l: "Total cooks" },
        ].map((s) => (
          <div key={s.l} className="recipe-card p-4 text-center">
            <p className="font-display text-3xl text-[var(--accent-soft)]">{s.n}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="recipe-card mt-6 p-5">
        <h2 className="font-display text-lg text-[var(--text-primary)]">Weekly recap</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{weeklyPreview.body}</p>
        <p className="mt-2 text-[10px] text-[var(--text-secondary)]">
          Sent Sundays at {notifyPrefs.types.weeklyRecap.time} when reminders are on.
        </p>
      </div>

      <div className="recipe-card mt-4 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Reminders</h2>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">Browser-only — architecture ready for future push.</p>
        <button
          type="button"
          onClick={handleToggleNotifications}
          className="premium-btn-outline mt-3 w-full py-2 text-xs"
        >
          {notifyPrefs.enabled ? "Reminders on" : "Enable reminders"}
        </button>
        {notifyPrefs.enabled && (
          <div className="mt-3 space-y-2 text-xs text-[var(--text-secondary)]">
            <label className="flex items-center justify-between gap-2">
              <span>Daily cooking reminder ({notifyPrefs.types.dailyCooking.time})</span>
              <input
                type="checkbox"
                checked={notifyPrefs.types.dailyCooking.enabled}
                onChange={(e) => setNotifyPrefs(updateNotificationType("dailyCooking", { enabled: e.target.checked }))}
                className="accent-[var(--accent)]"
              />
            </label>
            <label className="flex items-center justify-between gap-2">
              <span>Weekly recap</span>
              <input
                type="checkbox"
                checked={notifyPrefs.types.weeklyRecap.enabled}
                onChange={(e) => setNotifyPrefs(updateNotificationType("weeklyRecap", { enabled: e.target.checked }))}
                className="accent-[var(--accent)]"
              />
            </label>
            <label className="flex items-center justify-between gap-2">
              <span>Streak nudge when behind</span>
              <input
                type="checkbox"
                checked={notifyPrefs.smart.streakNudge}
                onChange={(e) => setNotifyPrefs(updateSmartPrefs({ streakNudge: e.target.checked }))}
                className="accent-[var(--accent)]"
              />
            </label>
          </div>
        )}
      </div>

      <h2 className="mt-10 font-display text-xl text-[var(--text-primary)]">Badges</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {badges.map((b) => (
          <div
            key={b.id}
            className={`recipe-card flex items-center gap-3 p-4 ${b.unlocked ? "" : "opacity-40"}`}
          >
            <span className="text-3xl">{b.icon}</span>
            <div>
              <p className="font-medium text-[var(--text-primary)]">{b.name}</p>
              <p className="text-xs text-[var(--text-secondary)]">{b.nameHi}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-[var(--accent-soft)]">
                {b.unlocked ? "Unlocked" : "Locked"}
              </p>
            </div>
          </div>
        ))}
      </div>

      <Link to="/today" className="premium-btn mt-8 inline-block px-6 py-3 text-sm">
        Aaj cook karo →
      </Link>
    </div>
  );
}
