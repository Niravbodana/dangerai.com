import { useCallback, useEffect, useState } from "react";
import { fetchMealPlan } from "../api";
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
  plan: "free",
};

export default function Planner() {
  const [prefs, setPrefs] = useState(() => {
    const saved = localStorage.getItem("akb-prefs");
    return saved ? JSON.parse(saved) : DEFAULT_PREFS;
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generatePlan = useCallback(async (preferences) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchMealPlan(preferences);
      setData(result);
      localStorage.setItem("akb-prefs", JSON.stringify(preferences));
    } catch {
      setError("Plan generate nahi ho paya. Server check karein.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    generatePlan(prefs);
  }, []);

  const handlePrefsChange = (newPrefs) => {
    setPrefs(newPrefs);
  };

  const handleGenerate = () => {
    generatePlan(prefs);
  };

  return (
    <div className="min-h-screen bg-[#fffbf7]">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🍳 Aapka Meal Plan</h1>
          <p className="mt-1 text-gray-600">Preferences set karo aur plan generate karo</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4">
            <PreferencesPanel prefs={prefs} onChange={handlePrefsChange} />
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full rounded-2xl bg-orange-500 py-3 font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
            >
              {loading ? "Ban raha hai..." : "🔄 Naya Plan Generate Karo"}
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
