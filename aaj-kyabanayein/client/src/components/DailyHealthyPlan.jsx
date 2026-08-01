import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDailyHealthyPlan } from "../api";
import { useLanguage } from "../context/LanguageContext";
import RecipeImage from "./RecipeImage";
import { IconArrowRight, IconClock } from "./Icons";

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
    <div className={compact ? "" : "glass-strong rounded-2xl p-6 sm:p-8"}>
      {!compact && (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-green)]">
              {lang === "hi" ? "आज का प्लान" : "Today's Plan"}
            </p>
            <h2 className="font-display text-2xl text-[var(--text-primary)] sm:text-3xl">
              {lang === "hi" ? "स्वस्थ शरीर के लिए" : "Healthy Body Meal Plan"}
            </h2>
          </div>
          <div className="flex gap-2">
            {["veg", "non-veg"].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDiet(d)}
                className={`rounded-full px-4 py-2 text-xs font-medium transition ${
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

      <p className="mb-5 rounded-xl border border-[var(--accent-green)]/20 bg-[var(--accent-green)]/10 px-4 py-3 text-sm text-[var(--text-primary)]">
        {plan.healthTip}
      </p>

      <div className={`grid gap-4 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
        {plan.meals.map((meal) => {
          const label = lang === "hi"
            ? (meal.labelHi || meal.label)
            : meal.label;
          const name = lang === "hi"
            ? (meal.recipe.nameHi || meal.recipe.name)
            : meal.recipe.name;

          return (
            <Link
              key={meal.mealType}
              to={`/recipe/${meal.recipe.id}`}
              className="group flex gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-3 transition hover:border-[var(--accent-green)]/30 hover:bg-white/[0.06]"
            >
              <RecipeImage
                recipeId={meal.recipe.id}
                alt={name}
                className="h-16 w-16 shrink-0 rounded-lg object-cover bg-[#242018]"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-green)]">
                  {label}
                </p>
                <h3 className="mt-0.5 font-semibold text-[var(--text-primary)] line-clamp-2 group-hover:text-[var(--accent-soft)]">
                  {name}
                </h3>
                <div className="mt-1.5 flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                  <IconClock className="h-3 w-3" />
                  {meal.recipe.cookTime} min
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-white/8 pt-4">
        <span className="text-sm text-[var(--text-secondary)]">
          {lang === "hi" ? "कुल" : "Total"}:{" "}
          <strong className="text-[var(--accent-green)]">{plan.totalCalories} cal</strong>
        </span>
        <Link
          to="/healthy-week"
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--accent-soft)] hover:underline"
        >
          {lang === "hi" ? "पूरा हफ्ता" : "Full week plan"}
          <IconArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
