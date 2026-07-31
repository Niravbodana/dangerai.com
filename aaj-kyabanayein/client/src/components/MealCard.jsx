import { useState } from "react";
import { Link } from "react-router-dom";
import { IconClock } from "./Icons";

const MEAL_LABEL = { breakfast: "Nashta", lunch: "Dopahar", dinner: "Raat", snack: "Snack" };

export default function MealCard({ mealType, recipe }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="recipe-card overflow-hidden transition hover:shadow-lg">
      <div className="flex gap-4 p-4">
        {recipe.image && (
          <img
            src={recipe.image}
            alt={recipe.nameHi}
            className="h-24 w-24 shrink-0 rounded-xl object-cover"
            loading="lazy"
          />
        )}
        <div className="flex flex-1 items-start justify-between gap-3">
          <div className="flex-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-orange-600">
              {MEAL_LABEL[mealType]}
            </span>
            <h3 className="mt-1 text-lg font-semibold text-stone-900">{recipe.nameHi}</h3>
            <p className="text-sm text-stone-500">{recipe.name}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="flex items-center gap-1 rounded-lg bg-stone-50 px-2 py-0.5 text-xs text-stone-600">
                <IconClock className="w-3 h-3" />
                {recipe.cookTime} min
              </span>
              <span className="rounded-lg bg-stone-50 px-2 py-0.5 text-xs text-stone-600">
                {recipe.calories} cal
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-50"
            >
              {expanded ? "Close" : "Recipe"}
            </button>
            <Link
              to={`/cook/${recipe.id}`}
              className="premium-btn rounded-lg px-3 py-2 text-center text-sm"
            >
              Cook
            </Link>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-stone-100 bg-stone-50/50 px-5 py-4">
          <div className="mb-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">Saman</h4>
            <ul className="grid gap-1 sm:grid-cols-2">
              {recipe.ingredients.map((ing) => (
                <li key={ing.name} className="text-sm text-stone-600">
                  {ing.nameHi} — {ing.quantity}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">Steps</h4>
            <ol className="space-y-2">
              {recipe.stepsHi.map((step, i) => (
                <li key={i} className="text-sm text-stone-600">
                  <span className="mr-2 font-medium text-orange-600">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </article>
  );
}
