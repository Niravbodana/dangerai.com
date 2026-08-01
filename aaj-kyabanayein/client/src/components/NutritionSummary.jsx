import { goalProgress } from "../lib/nutrition";

function Macro({ label, value, unit = "g", goal, progress }) {
  return (
    <div className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-center">
      <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">{label}</p>
      <p className="mt-1 font-display text-lg text-[var(--text-primary)]">
        {value}
        <span className="text-xs font-normal text-[var(--text-secondary)]">{unit === "g" ? "g" : ""}</span>
      </p>
      {goal != null && (
        <p className="mt-1 text-[10px] text-[var(--accent-soft)]">
          {progress}% of {goal}{unit === "g" ? "g" : " cal"}
        </p>
      )}
    </div>
  );
}

export default function NutritionSummary({ nutrition, title, goals, compact = false }) {
  if (!nutrition) return null;
  const progress = goals ? goalProgress(nutrition, goals) : null;

  return (
    <div className={`rounded-xl border border-white/8 bg-white/[0.03] ${compact ? "p-3" : "p-4"}`}>
      {title && <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{title}</h3>}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Macro label="Calories" value={nutrition.calories} unit="cal" goal={goals?.calories} progress={progress?.calories} />
        <Macro label="Protein" value={nutrition.protein} goal={goals?.protein} progress={progress?.protein} />
        <Macro label="Carbs" value={nutrition.carbs} goal={goals?.carbs} progress={progress?.carbs} />
        <Macro label="Fat" value={nutrition.fat} goal={goals?.fat} progress={progress?.fat} />
        <Macro label="Fiber" value={nutrition.fiber} goal={goals?.fiber} progress={progress?.fiber} />
      </div>
    </div>
  );
}
