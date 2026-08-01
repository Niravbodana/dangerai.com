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

  const generatePlan = useCallback(async (preferences) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchMealPlan({ ...preferences, ...buildPlannerContext() });
      setData(result);
      if (result.groceryList) saveGroceryFromPlan(result.groceryList, { diet: preferences.diet });
      localStorage.setItem("akb-prefs", JSON.stringify(preferences));
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

  const handleSavePreferences = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { diet, budget, familySize, maxCookTime, spice } = prefs;
      const result = await savePreferences({ diet, budget, familySize, maxCookTime, spice });
      updateUser(result.user);
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
          </div>

          <div className="space-y-6 lg:col-span-2">
            {error && <div className="glass rounded-xl p-4 text-sm text-red-600">{error}</div>}

            {data?.smart && data?.summary && (
              <p className="text-xs text-[var(--text-secondary)]">
                Smart plan · {data.summary.proteinDays} protein-balanced days · {data.summary.pantryAwareMeals} pantry meals · {data.summary.leftoverOptimized} leftover-friendly lunches · {data.summary.groceryItems} grocery items to buy
              </p>
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
                </h2>
                {dayNutrition && (
                  <div className="mb-4">
                    <NutritionSummary nutrition={dayNutrition} title="Daily totals" compact goals={goals} />
                  </div>
                )}
                <div className="space-y-4">
                  {day.meals.map((meal) => (
                    <MealCard key={`${day.date}-${meal.mealType}`} mealType={meal.mealType} recipe={meal.recipe} />
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
