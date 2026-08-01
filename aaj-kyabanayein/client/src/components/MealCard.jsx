import { useState } from "react";
import { Link } from "react-router-dom";
import { IconClock } from "./Icons";
import RecipeImage from "./RecipeImage";

const MEAL_LABEL = { breakfast: "Nashta", lunch: "Dopahar", dinner: "Raat", snack: "Snack" };

export default function MealCard({ mealType, recipe }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="recipe-card overflow-hidden">
      <div className="flex gap-4 p-4">
        <RecipeImage
          recipeId={recipe.id}
          alt={recipe.nameHi || recipe.name}
          className="h-24 w-24 shrink-0 rounded-xl object-cover bg-[#242018]"
          eager
        />
        <div className="flex flex-1 items-start justify-between gap-3">
          <div className="flex-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
              {MEAL_LABEL[mealType]}
            </span>
            <h3 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{recipe.nameHi}</h3>
            <p className="text-sm text-[var(--text-secondary)]">{recipe.name}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="flex items-center gap-1 rounded-lg bg-white/40 px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                <IconClock className="w-3 h-3" />
                {recipe.cookTime} min
              </span>
              <span className="rounded-lg bg-white/40 px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                {recipe.calories} cal
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => setExpanded(!expanded)} className="premium-btn-outline px-3 py-2 text-sm">
              {expanded ? "Close" : "Recipe"}
            </button>
            <Link to={`/cook/${recipe.id}`} className="premium-btn rounded-lg px-3 py-2 text-center text-sm">
              Cook
            </Link>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/40 px-5 py-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Ingredients</h4>
          <ul className="mb-4 grid gap-1 sm:grid-cols-2">
            {recipe.ingredients.map((ing) => (
              <li key={ing.name} className="text-sm text-[var(--text-primary)]">
                {ing.nameHi} — {ing.quantity}
              </li>
            ))}
          </ul>
          {recipe.stepsHi?.length > 0 && (
            <>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Steps</h4>
              <ol className="space-y-2">
                {recipe.stepsHi.map((step, i) => (
                  <li key={i} className="text-sm text-[var(--text-primary)]">
                    <span className="mr-2 font-medium text-[var(--accent)]">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      )}
    </article>
  );
}
