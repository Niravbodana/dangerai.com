const MEAL_EMOJI = { breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🥗" };
const MEAL_LABEL = { breakfast: "Nashta", lunch: "Dopahar", dinner: "Raat", snack: "Snack" };

export default function RecipeCard({ recipe, matchPercent, onClick }) {
  return (
    <article
      className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm transition hover:shadow-md cursor-pointer"
      onClick={onClick}
    >
      <div className="relative h-40 overflow-hidden bg-orange-50">
        {recipe.image ? (
          <img
            src={recipe.image}
            alt={recipe.nameHi}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">🍽️</div>
        )}
        {matchPercent && (
          <span className="absolute right-2 top-2 rounded-full bg-green-500 px-2 py-0.5 text-xs font-bold text-white">
            {matchPercent}% match
          </span>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-orange-600">
          {MEAL_EMOJI[recipe.mealType]} {MEAL_LABEL[recipe.mealType]}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900">{recipe.nameHi}</h3>
        <p className="text-sm text-gray-500">{recipe.name}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="text-xs text-green-600">⏱ {recipe.cookTime} min</span>
          <span className="text-xs text-blue-600">🔥 {recipe.calories} cal</span>
          {recipe.healthScore >= 8 && (
            <span className="text-xs text-emerald-600">💚 Healthy</span>
          )}
        </div>
      </div>
    </article>
  );
}
