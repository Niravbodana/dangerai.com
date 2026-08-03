import { filterRecipeIndex } from "../data/recipes.js";
import { getRating } from "./ratingsStore.js";

function trendingScore(average, count) {
  return average * Math.log10(count + 10) + count * 0.02;
}

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getTrendingDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function dailyRecipeScore(recipeId, rating, dateKey) {
  const base = trendingScore(rating.average, rating.count);
  const rand = mulberry32(hashString(`${dateKey}:${recipeId}`));
  return base * (0.55 + rand() * 0.9) + rand() * 0.35;
}

export function getTrendingRecipes(limit = 12, date = new Date()) {
  const dateKey = getTrendingDateKey(date);
  const pool = filterRecipeIndex({}).filter((r) => !r.id?.startsWith("tmdb-"));

  const scored = pool.map((recipe) => {
    const rating = getRating(recipe.id);
    return { recipe, rating, score: dailyRecipeScore(recipe.id, rating, dateKey) };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ recipe, rating }, index) => ({
      ...recipe,
      trendingRank: index + 1,
      rating,
      isTrending: true,
      trendingDate: dateKey,
    }));
}

export function isTrendingRecipe(recipeId, date = new Date()) {
  return getTrendingRecipes(20, date).some((r) => r.id === recipeId);
}
