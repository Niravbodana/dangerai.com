import { RECIPES } from "../data/recipes.js";
import { getRating } from "./ratingsStore.js";

const TRENDING_IDS = [
  "chole-bhature", "butter-chicken", "paneer-butter-masala", "biryani-veg",
  "masala-dosa", "pav-bhaji", "poha", "idli-sambar", "dal-chawal",
  "palak-paneer", "rajma-chawal", "chicken-curry", "mutton-rogan-josh",
  "kadhi-pakora", "misal-pav", "fish-fry",
];

function trendingScore(average, count) {
  return average * Math.log10(count + 10) + count * 0.02;
}

export function getTrendingRecipes(limit = 12) {
  const scored = TRENDING_IDS.map((id) => {
    const recipe = RECIPES.find((r) => r.id === id);
    if (!recipe) return null;
    const rating = getRating(id);
    return {
      recipe,
      rating,
      score: trendingScore(rating.average, rating.count),
    };
  }).filter(Boolean);

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ recipe, rating }, index) => ({
      ...recipe,
      trendingRank: index + 1,
      rating,
      isTrending: true,
    }));
}

export function isTrendingRecipe(recipeId) {
  const trending = getTrendingRecipes(20);
  return trending.some((r) => r.id === recipeId);
}
