import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDailyBrief } from "../api";
import { buildDailyBriefProfile } from "../lib/buildDailyBriefProfile";
import { canUseDailyBrief, markDailyBriefUsed } from "../lib/subscription";
import { track } from "../lib/analytics";
import { getStreak } from "../lib/streak";
import { enableMealReminders, getNotifyPref, scheduleDemoReminder } from "../lib/notifications";
import RecipeCard from "../components/RecipeCard";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";

const MEAL_LABELS = {
  breakfast: { en: "Breakfast", hi: "नाश्ता" },
  lunch: { en: "Lunch", hi: "लंच" },
  snack: { en: "Snack", hi: "स्नैक" },
  dinner: { en: "Dinner", hi: "डिनर" },
};

export default function Today() {
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [locked, setLocked] = useState(null);
  const [notifyOn, setNotifyOn] = useState(() => getNotifyPref().enabled);
  const streak = getStreak();

  const load = () => {
    const gate = canUseDailyBrief();
    if (!gate.ok) {
      setLocked(gate);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    const profile = buildDailyBriefProfile();
    fetchDailyBrief(profile)
      .then((data) => {
        setBrief(data.brief);
        markDailyBriefUsed();
        track("daily_brief_open", { diet: profile.diet });
      })
      .catch(() => {
        setBrief(null);
        setError(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (locked) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-4xl">☀️</p>
        <h1 className="mt-4 font-display text-3xl text-[var(--text-primary)]">Aaj Kya Banaye</h1>
        <p className="mt-3 text-[var(--text-secondary)]">{locked.message}</p>
        <Link to="/pricing" className="premium-btn mt-8 inline-block px-8 py-3 text-sm">
          Unlock Rasoira Plus
        </Link>
        <Link to="/healthy-week" className="mt-4 block text-sm text-[var(--accent-soft)]">
          Or see healthy week plan →
        </Link>
      </div>
    );
  }

  if (error || !brief) {
    return (
      <EmptyState
        icon="☀️"
        title="Could not load today's brief"
        message="Check your connection and try again."
        action={
          <button type="button" onClick={load} className="premium-btn px-6 py-2.5 text-sm">
            Retry
          </button>
        }
      />
    );
  }

  const meals = brief?.meals || {};

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-soft)]">Daily Brief</p>
          <h1 className="mt-2 font-display text-3xl text-[var(--text-primary)] sm:text-4xl">Aaj Kya Banaye?</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {brief?.date} · Personalised for your taste · Streak 🔥 {streak.current} din
          </p>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {["breakfast", "lunch", "snack", "dinner"].map((key) => {
            const recipe = meals[key];
            if (!recipe) return null;
            return (
              <div key={key} className="recipe-card overflow-hidden">
                <div className="border-b border-white/8 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-soft)]">
                    {MEAL_LABELS[key].en} · {MEAL_LABELS[key].hi}
                  </p>
                  {recipe.why && (
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">{recipe.why}</p>
                  )}
                </div>
                <div className="p-3">
                  <RecipeCard recipe={recipe} />
                </div>
              </div>
            );
          })}
        </div>

        {brief?.alternatives?.length > 0 && (
          <div className="mt-10">
            <h2 className="font-display text-xl text-[var(--text-primary)]">Swap options</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Mood change? Pick an alternative.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {brief.alternatives.map((r) => (
                <RecipeCard key={r.id} recipe={r} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to="/taste" className="premium-btn-outline px-5 py-2.5 text-sm">Edit taste profile</Link>
          <Link to="/pantry" className="premium-btn-outline px-5 py-2.5 text-sm">Use pantry</Link>
          <Link to="/collections" className="premium-btn px-5 py-2.5 text-sm">Browse collections</Link>
          <button
            type="button"
            onClick={async () => {
              const res = await enableMealReminders();
              if (res.ok) {
                setNotifyOn(true);
                scheduleDemoReminder();
                track("notify_enable");
              }
            }}
            className="premium-btn-outline px-5 py-2.5 text-sm"
          >
            {notifyOn ? "Reminders on" : "Enable meal reminder"}
          </button>
        </div>
      </div>
    </div>
  );
}
