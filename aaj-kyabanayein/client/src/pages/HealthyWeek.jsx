import { useEffect, useState } from "react";
import { fetchHealthyPlan } from "../api";
import { useLanguage } from "../context/LanguageContext";
import { loadPantry } from "../lib/pantryStore";
import DailyHealthyPlan from "../components/DailyHealthyPlan";
import GroceryList from "../components/GroceryList";
import MealCard from "../components/MealCard";

export default function HealthyWeek() {
  const { t } = useLanguage();
  const [diet, setDiet] = useState("veg");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchHealthyPlan(diet, { pantry: loadPantry().map((i) => i.key) }).then(setData).finally(() => setLoading(false));
  }, [diet]);

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
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/40 border-t-[var(--accent-green)]" />
          </div>
        ) : (
          <div className="mt-6 space-y-8">
            {data?.plans?.map((day) => (
              <div key={day.date} className="glass-strong rounded-2xl p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-display text-xl text-[var(--text-primary)]">{day.dayLabel}</h2>
                    <p className="text-sm text-[var(--text-secondary)]">{day.date}</p>
                  </div>
                  <span className="rounded-full bg-[var(--accent-green)]/10 px-3 py-1 text-sm text-[var(--accent-green)]">
                    {day.totalCalories} cal
                  </span>
                </div>
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
