import { useState } from "react";

const MEAL_EMOJI = { breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🥗" };
const MEAL_LABEL = { breakfast: "Nashta", lunch: "Dopahar", dinner: "Raat", snack: "Snack" };

export default function MealCard({ mealType, recipe }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm transition hover:shadow-md">
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
            <div className="mb-1 flex items-center gap-2">
              <span className="text-lg">{MEAL_EMOJI[mealType]}</span>
              <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-600">
                {MEAL_LABEL[mealType]}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900">{recipe.nameHi}</h3>
            <p className="text-sm text-gray-500">{recipe.name}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-lg bg-green-50 px-2 py-0.5 text-xs text-green-700">
                ⏱ {recipe.cookTime} min
              </span>
              <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                🔥 {recipe.calories} cal
              </span>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="rounded-xl bg-orange-50 px-3 py-2 text-sm font-medium text-orange-600 transition hover:bg-orange-100"
          >
            {expanded ? "Band" : "Recipe"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-orange-50 bg-orange-50/30 px-5 py-4">
          <div className="mb-4">
            <h4 className="mb-2 text-sm font-semibold text-gray-800">Samaan</h4>
            <ul className="grid gap-1 sm:grid-cols-2">
              {recipe.ingredients.map((ing) => (
                <li key={ing.name} className="text-sm text-gray-600">
                  • {ing.nameHi} — {ing.quantity}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-semibold text-gray-800">Kaise banayein</h4>
            <ol className="space-y-2">
              {recipe.stepsHi.map((step, i) => (
                <li key={i} className="text-sm text-gray-600">
                  <span className="mr-2 font-medium text-orange-500">{i + 1}.</span>
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
