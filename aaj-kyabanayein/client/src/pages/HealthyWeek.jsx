import { useEffect, useState } from "react";
import { fetchHealthyPlan } from "../api";
import { useLanguage } from "../context/LanguageContext";
import DailyHealthyPlan from "../components/DailyHealthyPlan";
import GroceryList from "../components/GroceryList";
import MealCard from "../components/MealCard";
import EmptyState from "../components/EmptyState";
import LoadingSpinner from "../components/LoadingSpinner";
import NutritionSummary from "../components/NutritionSummary";
import { getNutritionGoals } from "../lib/nutritionGoals";

export default function HealthyWeek() {
  const { t } = useLanguage();
  const [diet, setDiet] = useState("veg");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    fetchHealthyPlan(diet)
      .then(setData)
      .catch(() => {
        setData(null);
        setError(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [diet]);

  const goals = getNutritionGoals();

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="font-display text-3xl text-[var(--text-primary)]">{t("featHealthy")}</h1>
        <p className="mb-6 text-[var(--text-secondary)]">{t("featHealthyDesc")}</p>

        <DailyHealthyPlan compact diet={diet} onDietChange={setDiet} />

        <div className="mt-10 flex items-center justify-between">
          <h2 className="font-display text-xl text-[var(--text-primary)]">7 Din ka Plan</h2>
          <div className="flex gap-2">
            {[
              { value: "veg", label: `${t("veg")} Healthy` },
              { value: "non-veg", label: `${t("nonVeg")} Healthy` },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDiet(opt.value)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  diet === opt.value
                    ? "bg-[var(--accent-green)] text-white"
                    : "glass text-[var(--text-secondary)] hover:bg-white/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <EmptyState
            icon="🥗"
            title="Could not load healthy week plan"
            message="Check your connection and try again."
            action={
              <button type="button" onClick={load} className="premium-btn px-6 py-2.5 text-sm">
                Retry
              </button>
            }
          />
        ) : (
          <div className="mt-6 space-y-8">
            {data?.weeklyNutrition && (
              <NutritionSummary
                nutrition={data.weeklyNutrition}
                title="Weekly nutrition totals vs goals"
                goals={goals}
              />
            )}
            {data?.plans?.map((day) => (
              <div key={day.date} className="glass-strong rounded-2xl p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-display text-xl text-[var(--text-primary)]">{day.dayLabel}</h2>
                    <p className="text-sm text-[var(--text-secondary)]">{day.date}</p>
                  </div>
                  <span className="rounded-full bg-[var(--accent-green)]/10 px-3 py-1 text-sm text-[var(--accent-green)]">
                    {day.nutrition?.calories ?? day.totalCalories} cal
                  </span>
                </div>
                {day.nutrition && (
                  <div className="mb-4">
                    <NutritionSummary nutrition={day.nutrition} title="Daily nutrition" compact goals={goals} />
                  </div>
                )}
                <p className="mb-4 rounded-xl border border-white/8 bg-white/5 px-4 py-2.5 text-sm text-[var(--text-primary)]">
                  {day.healthTip}
                </p>
                <div className="space-y-4">
                  {day.meals.map((meal) => (
                    <MealCard key={`${day.date}-${meal.mealType}`} mealType={meal.mealType} recipe={meal.recipe} />
                  ))}
                </div>
              </div>
            ))}
            {data?.groceryList && <GroceryList items={data.groceryList} />}
          </div>
        )}
      </div>
    </div>
  );
}
