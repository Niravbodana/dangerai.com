/**
 * Recommendation service — personalized recipe picks from local signals.
 */
import { filterRecipeIndex, getRecipeById, toListItem } from "../../data/recipes.js";
import { rankRecipes } from "./personalizationPipeline.js";

export function recommendRecipes(context = {}, options = {}) {
  const {
    limit = 12,
    diet,
    cuisine,
    mealType,
    category,
    poolSize = 400,
    excludeIds = [],
  } = options;

  const exclude = new Set(excludeIds);
  const pool = filterRecipeIndex({ diet, cuisine, mealType, category })
    .filter((m) => !exclude.has(m.id))
    .slice(0, poolSize);

  const recipes = pool.map((m) => getRecipeById(m.id)).filter(Boolean);
  const ranked = rankRecipes(recipes, context, options);

  return {
    provider: "local-signals",
    total: ranked.length,
    recommendations: ranked.slice(0, limit).map((r) => ({
      ...toListItem(r.recipe),
      matchScore: Math.round(r.score),
      why: r.reasons.join(" · ") || "Recommended for you",
      signals: Object.fromEntries(
        Object.entries(r.signals)
          .filter(([, v]) => v)
          .map(([k, v]) => [k, v.score])
      ),
    })),
  };
}
