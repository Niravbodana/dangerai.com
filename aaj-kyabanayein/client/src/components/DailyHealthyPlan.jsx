import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDailyHealthyPlan } from "../api";
import { useLanguage } from "../context/LanguageContext";
import { IconArrowRight, IconClock } from "./Icons";

const MEAL_LABELS = {
  breakfast: { en: "Breakfast", hi: "नाश्ता" },
  lunch: { en: "Lunch", hi: "दोपहर" },
  snack: { en: "Snack", hi: "स्नैक" },
  dinner: { en: "Dinner", hi: "रात" },
};

export default function DailyHealthyPlan({ compact = false, diet: dietProp, onDietChange }) {
  const { lang, t } = useLanguage();
  const [dietLocal, setDietLocal] = useState("veg");
  const diet = dietProp ?? dietLocal;
  const setDiet = onDietChange ?? setDietLocal;
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchDailyHealthyPlan(diet)
      .then((data) => setPlan(data.plan))
      .catch(() => setPlan(null))
      .finally(() => setLoading(false));
  }, [diet]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/30 border-t-[var(--accent-green)]" />
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className={compact ? "" : "glass-strong rounded-2xl p-6"}>
      {!compact && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-green)]">
              {lang === "hi" ? "आज का प्लान" : "Today's Plan"}
            </p>
            <h2 className="font-display text-2xl text-[var(--text-primary)]">
              {lang === "hi" ? "स्वस्थ शरीर के लिए" : "Healthy Body Meal Plan"}
            </h2>
          </div>
          <div className="flex gap-2">
            {["veg", "non-veg"].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDiet(d)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  diet === d
                    ? "bg-[var(--accent-green)] text-white"
                    : "border border-white/12 text-[var(--text-secondary)] hover:border-white/25"
                }`}
              >
                {d === "veg" ? t("veg") : t("nonVeg")}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="mb-4 rounded-xl bg-[var(--accent-green)]/10 px-4 py-2.5 text-sm text-[var(--text-primary)]">
        💡 {plan.healthTip}
      </p>

      <div className={`grid gap-3 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
        {plan.meals.map((meal) => {
          const label = lang === "hi"
            ? (meal.labelHi || MEAL_LABELS[meal.mealType]?.hi)
            : (meal.label || MEAL_LABELS[meal.mealType]?.en);
          const name = lang === "hi"
            ? (meal.recipe.nameHi || meal.recipe.name)
            : meal.recipe.name;

          return (
            <Link
              key={meal.mealType}
              to={`/recipe/${meal.recipe.id}`}
              className="group rounded-xl border border-white/8 bg-white/5 p-4 transition hover:border-[var(--accent-green)]/30 hover:bg-white/8"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{meal.icon}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-green)]">
                  {label}
                </span>
              </div>
              <h3 className="mt-2 font-semibold text-[var(--text-primary)] line-clamp-2 group-hover:text-[var(--accent-soft)]">
                {name}
              </h3>
              <div className="mt-2 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <IconClock className="h-3.5 w-3.5" />
                {meal.recipe.cookTime} min · {meal.recipe.calories} cal
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-[var(--text-secondary)]">
          {lang === "hi" ? "कुल" : "Total"}: <strong className="text-[var(--accent-green)]">{plan.totalCalories} cal</strong>
        </span>
        <Link
          to="/healthy-week"
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--accent-soft)] hover:underline"
        >
          {lang === "hi" ? "पूरा हफ्ता देखें" : "Full week plan"}
          <IconArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
