import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMealPlan, savePreferences } from "../api";
import { useAuth } from "../context/AuthContext";
import GroceryList from "../components/GroceryList";
import MealCard from "../components/MealCard";
import PreferencesPanel from "../components/PreferencesPanel";
import { useLanguage } from "../context/LanguageContext";
import { trackPlannerUse } from "../lib/analytics";

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
      const result = await fetchMealPlan(preferences);
      setData(result);
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

            {data?.plans?.map((day) => (
              <div key={day.date}>
                <h2 className="mb-4 font-display text-xl text-[var(--text-primary)]">
                  {day.dayLabel}
                  <span className="ml-2 text-sm font-normal text-[var(--text-secondary)]">{day.date}</span>
                </h2>
                <div className="space-y-4">
                  {day.meals.map((meal) => (
                    <MealCard key={`${day.date}-${meal.mealType}`} mealType={meal.mealType} recipe={meal.recipe} />
                  ))}
                </div>
              </div>
            ))}

            {data?.groceryList && <GroceryList items={data.groceryList} />}
          </div>
        </div>
      </div>
    </div>
  );
}
