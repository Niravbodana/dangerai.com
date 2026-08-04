import { filterRecipeIndex, getRecipeById } from "../data/recipes.js";

/** 2–3 swap options for a planned meal without regenerating the whole week. */
export function findMealVariations(recipe, { count = 3, excludeIds = new Set(), diet } = {}) {
  if (!recipe?.id) return [];
  const pool = filterRecipeIndex({
    mealType: recipe.mealType,
    diet: diet || (recipe.diet?.includes("non-veg") ? "non-veg" : "veg"),
    cuisine: recipe.cuisine,
  });

  const baseKeys = new Set([
    ...(recipe.pantryKeys || []),
    ...(recipe.ingredients || []).map((i) => i.name.toLowerCase()),
  ]);

  const ranked = pool
    .filter((m) => m.id !== recipe.id && !excludeIds.has(m.id))
    .map((m) => {
      const r = getRecipeById(m.id);
      if (!r) return null;
      let score = 0;
      if (r.cuisine === recipe.cuisine) score += 15;
      if (Math.abs((r.cookTime || 30) - (recipe.cookTime || 30)) <= 15) score += 10;
      const keys = [...(r.pantryKeys || []), ...(r.ingredients || []).map((i) => i.name.toLowerCase())];
      for (const k of keys) {
        for (const b of baseKeys) {
          if (k.includes(b) || b.includes(k)) {
            score += 4;
            break;
          }
        }
      }
      return { recipe: r, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  return ranked.slice(0, count).map((x) => ({
    id: x.recipe.id,
    name: x.recipe.name,
    nameHi: x.recipe.nameHi,
    cookTime: x.recipe.cookTime,
    calories: x.recipe.calories,
    cuisine: x.recipe.cuisine,
  }));
}

export function attachVariationsToPlan(plans, options = {}) {
  const used = new Set();
  for (const day of plans) {
    for (const meal of day.meals || []) {
      if (meal.recipe?.id) used.add(meal.recipe.id);
    }
  }
  return plans.map((day) => ({
    ...day,
    meals: (day.meals || []).map((meal) => ({
      ...meal,
      variations: meal.recipe
        ? findMealVariations(meal.recipe, { excludeIds: used, diet: options.diet })
        : [],
    })),
  }));
}
