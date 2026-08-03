import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMealPlan, savePreferences } from "../api";
import { useAuth } from "../context/AuthContext";
import GroceryList from "../components/GroceryList";
import MealCard from "../components/MealCard";
import PreferencesPanel from "../components/PreferencesPanel";
import NutritionSummary from "../components/NutritionSummary";
import { useLanguage } from "../context/LanguageContext";
import { buildPlannerContext } from "../lib/plannerContext";
import { nutritionFromPlans } from "../lib/nutrition";
import { getNutritionGoals } from "../lib/nutritionGoals";
import { saveGroceryFromPlan } from "../lib/groceryStore";
import { trackPlannerUse } from "../lib/analytics";
import {
  disableMealReminders,
  enableMealReminders,
  getNotifyPref,
  getSmartNotificationSummary,
  initNotificationEngine,
  previewMealReminder,
  stopNotificationEngine,
  updateNotificationType,
  updateSmartPrefs,
} from "../lib/notifications";
import { getStreak } from "../lib/streak";

const DEFAULT_PREFS = {
  diet: "veg",
  budget: "medium",
  familySize: 4,
  maxCookTime: 45,
  spice: "medium",
};

function loadLocalPrefs() {
  try {
    const saved = localStorage.getItem("akb-prefs");
    return saved ? { ...DEFAULT_PREFS, ...JSON.parse(saved) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export default function Planner() {
  const { t } = useLanguage();
  const { user, updateUser } = useAuth();
  const [prefs, setPrefs] = useState(loadLocalPrefs);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notifyPrefs, setNotifyPrefs] = useState(getNotifyPref);
  const notifySummary = getSmartNotificationSummary();

  const generatePlan = useCallback(async (preferences) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchMealPlan({ ...preferences, ...buildPlannerContext() });
      setData(result);
      if (result.groceryList) saveGroceryFromPlan(result.groceryList, { diet: preferences.diet });
      localStorage.setItem("akb-prefs", JSON.stringify(preferences));
      trackPlannerUse("generate", { diet: preferences.diet, days: result?.plans?.length || 0 });
    } catch {
      setError("Plan generate nahi ho paya. Server check karein.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initial = user?.preferences
      ? { ...DEFAULT_PREFS, ...user.preferences }
      : loadLocalPrefs();
    setPrefs(initial);
    generatePlan(initial);
  }, [user, generatePlan]);

  useEffect(() => {
    if (!notifyPrefs.enabled) {
      stopNotificationEngine();
      return undefined;
    }
    initNotificationEngine({ mealPlan: data, streak: getStreak() });
    return () => stopNotificationEngine();
  }, [notifyPrefs.enabled, data]);

  const handleToggleNotifications = async () => {
    if (notifyPrefs.enabled) {
      disableMealReminders();
      setNotifyPrefs(getNotifyPref());
      return;
    }
    const res = await enableMealReminders();
    if (res.ok) setNotifyPrefs(getNotifyPref());
  };

  const mealPreview = data ? previewMealReminder(data) : null;

  const handleSavePreferences = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { diet, budget, familySize, maxCookTime, spice } = prefs;
      const result = await savePreferences({ diet, budget, familySize, maxCookTime, spice });
      updateUser(result.user);
      trackPlannerUse("save_prefs", { diet, budget });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const goals = getNutritionGoals();
  const planNutrition = data?.plans ? nutritionFromPlans(data.plans) : null;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="font-display text-3xl text-[var(--text-primary)]">{t("featPlanner")}</h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          {user ? `${user.name} — ` : ""}{t("featPlannerDesc")}
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="space-y-4">
            <PreferencesPanel prefs={prefs} onChange={setPrefs} />
            <button onClick={() => generatePlan(prefs)} disabled={loading} className="premium-btn w-full py-3 text-sm disabled:opacity-50">
              {loading ? "Ban raha hai..." : "Naya Plan Generate Karo"}
            </button>
            {user ? (
              <button onClick={handleSavePreferences} disabled={saving} className="premium-btn-outline w-full py-3 text-sm disabled:opacity-50">
                {saving ? "Save ho raha hai..." : "Account me Save Karo"}
              </button>
            ) : (
              <p className="text-center text-xs text-[var(--text-secondary)]">
                <Link to="/login" className="text-[var(--accent)] hover:underline">Login</Link> karke preferences save karo
              </p>
            )}

            <div className="recipe-card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Meal reminders</h3>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Local browser reminders from your plan — no push provider.
              </p>
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
                    <span>Meal reminders</span>
                    <input
                      type="checkbox"
                      checked={notifyPrefs.types.meal.enabled}
                      onChange={(e) => setNotifyPrefs(updateNotificationType("meal", { enabled: e.target.checked }))}
                      className="accent-[var(--accent)]"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-2">
                    <span>Pantry reminder</span>
                    <input
                      type="checkbox"
                      checked={notifyPrefs.types.pantry.enabled}
                      onChange={(e) => setNotifyPrefs(updateNotificationType("pantry", { enabled: e.target.checked }))}
                      className="accent-[var(--accent)]"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-2">
                    <span>Skip if already cooked today</span>
                    <input
                      type="checkbox"
                      checked={notifyPrefs.smart.skipIfCookedToday}
                      onChange={(e) => setNotifyPrefs(updateSmartPrefs({ skipIfCookedToday: e.target.checked }))}
                      className="accent-[var(--accent)]"
                    />
                  </label>
                  <p className="text-[10px]">Quiet hours: {notifySummary.quietHours}</p>
                  {mealPreview && (
                    <p className="text-[10px] text-[var(--accent-soft)]">Next: {mealPreview.title} — {mealPreview.body}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6 lg:col-span-2">
            {error && <div className="glass rounded-xl p-4 text-sm text-red-600">{error}</div>}

            {data?.smart && data?.summary && (
              <p className="text-xs text-[var(--text-secondary)]">
                Smart plan · {data.summary.proteinDays} protein days · {data.summary.pantryAwareMeals} pantry meals · {data.summary.leftoverOptimized} leftover lunches · {data.summary.festivalDays || 0} festival days · {data.summary.groceryItems} grocery items
              </p>
            )}

            {data?.planningHints?.upcomingFestivals?.length > 0 && (
              <div className="glass rounded-xl p-3 text-xs text-[var(--text-secondary)]">
                Upcoming: {data.planningHints.upcomingFestivals.slice(0, 3).map((f) => f.nameHi || f.name).join(" · ")}
              </div>
            )}

            {planNutrition && (
              <NutritionSummary
                nutrition={planNutrition.dailyAverage}
                title="Weekly average (daily) vs goals"
                goals={goals}
              />
            )}

            {data?.plans?.map((day) => {
              const dayNutrition = planNutrition?.days.find((d) => d.date === day.date)?.nutrition;
              return (
              <div key={day.date}>
                <h2 className="mb-2 font-display text-xl text-[var(--text-primary)]">
                  {day.dayLabel}
                  <span className="ml-2 text-sm font-normal text-[var(--text-secondary)]">{day.date}</span>
                  {day.festival && (
                    <span className="ml-2 text-xs text-[var(--accent-soft)]">🪔 {day.festival.nameHi || day.festival.name}</span>
                  )}
                </h2>
                {dayNutrition && (
                  <div className="mb-4">
                    <NutritionSummary nutrition={dayNutrition} title="Daily totals" compact goals={goals} />
                  </div>
                )}
                <div className="space-y-4">
                  {day.meals.map((meal) => (
                    <MealCard
                      key={`${day.date}-${meal.mealType}`}
                      mealType={meal.mealType}
                      recipe={meal.recipe}
                      variations={meal.variations}
                    />
                  ))}
                </div>
              </div>
            );})}

            {planNutrition && (
              <NutritionSummary nutrition={planNutrition.weekly} title="Weekly totals" />
            )}

            {data?.groceryList && <GroceryList items={data.groceryList} />}
          </div>
        </div>
      </div>
    </div>
  );
}
