import { useCallback, useEffect, useState } from "react";
import { fetchMealPlan, savePreferences } from "../api";
import { useAuth } from "../context/AuthContext";
import GroceryList from "../components/GroceryList";
import MealCard from "../components/MealCard";
import Navbar from "../components/Navbar";
import PreferencesPanel from "../components/PreferencesPanel";

const DEFAULT_PREFS = {
  diet: "veg",
  budget: "medium",
  familySize: 4,
  maxCookTime: 45,
  spice: "medium",
};

export default function Planner() {
  const { user, updateUser } = useAuth();
  const [prefs, setPrefs] = useState(() => ({
    ...DEFAULT_PREFS,
    ...(user?.preferences || {}),
    plan: user?.plan || "free",
  }));
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
    } catch {
      setError("Plan generate nahi ho paya. Server check karein.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.preferences) {
      const userPrefs = { ...user.preferences, plan: user.plan };
      setPrefs(userPrefs);
      generatePlan(userPrefs);
    }
  }, [user]);

  const handlePrefsChange = (newPrefs) => {
    setPrefs({ ...newPrefs, plan: user?.plan || "free" });
  };

  const handleGenerate = async () => {
    const prefsWithPlan = { ...prefs, plan: user?.plan || "free" };
    await generatePlan(prefsWithPlan);
  };

  const handleSavePreferences = async () => {
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

  return (
    <div className="min-h-screen bg-[#fffbf7]">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🍳 Aapka Meal Plan</h1>
          <p className="mt-1 text-gray-600">
            Namaste {user?.name}! Preferences set karo aur plan generate karo
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4">
            <PreferencesPanel prefs={prefs} onChange={handlePrefsChange} userPlan={user?.plan} />
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full rounded-2xl bg-orange-500 py-3 font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
            >
              {loading ? "Ban raha hai..." : "🔄 Naya Plan Generate Karo"}
            </button>
            <button
              onClick={handleSavePreferences}
              disabled={saving}
              className="w-full rounded-2xl border border-green-300 bg-green-50 py-3 font-semibold text-green-700 transition hover:bg-green-100 disabled:opacity-50"
            >
              {saving ? "Save ho raha hai..." : "💾 Preferences Save Karo"}
            </button>
          </div>

          <div className="space-y-6 lg:col-span-2">
            {error && (
              <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>
            )}

            {data?.plans?.map((day) => (
              <div key={day.date}>
                <h2 className="mb-4 text-xl font-bold text-gray-900">
                  📅 {day.dayLabel}
                  <span className="ml-2 text-sm font-normal text-gray-400">{day.date}</span>
                </h2>
                <div className="space-y-4">
                  {day.meals.map((meal) => (
                    <MealCard
                      key={`${day.date}-${meal.mealType}`}
                      mealType={meal.mealType}
                      recipe={meal.recipe}
                    />
                  ))}
                </div>
              </div>
            ))}

            {data?.groceryLocked && (
              <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50 p-6 text-center">
                <p className="text-sm text-orange-700">
                  🔒 Bazaar list sirf Pro plan me milegi —{" "}
                  <a href="/pricing" className="font-semibold underline">
                    ₹99/month
                  </a>
                </p>
              </div>
            )}

            {!data?.groceryLocked && data?.groceryList && (
              <GroceryList items={data.groceryList} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
