import { RECIPES } from "../data/recipes.js";
import { getAllRatings } from "./ratingsStore.js";

const SEED_POPULARITY = [
  { id: "chole-bhature", average: 4.9, cooks: 2847 },
  { id: "butter-chicken", average: 4.8, cooks: 2103 },
  { id: "paneer-butter-masala", average: 4.8, cooks: 1924 },
  { id: "biryani-veg", average: 4.7, cooks: 1756 },
  { id: "masala-dosa", average: 4.7, cooks: 1689 },
  { id: "pav-bhaji", average: 4.6, cooks: 1542 },
  { id: "dal-chawal", average: 4.6, cooks: 1488 },
  { id: "palak-paneer", average: 4.5, cooks: 1320 },
  { id: "mutton-rogan-josh", average: 4.5, cooks: 1198 },
  { id: "rajma-chawal", average: 4.5, cooks: 1156 },
  { id: "poha", average: 4.4, cooks: 1089 },
  { id: "idli-sambar", average: 4.4, cooks: 1024 },
  { id: "chicken-curry", average: 4.4, cooks: 987 },
  { id: "kadhi-pakora", average: 4.3, cooks: 876 },
  { id: "misal-pav", average: 4.3, cooks: 834 },
  { id: "fish-fry", average: 4.2, cooks: 756 },
];

function trendingScore(average, count) {
  return average * Math.log10(count + 10) + count * 0.02;
}

export function getTrendingRecipes(limit = 12) {
  const liveRatings = getAllRatings();
  const scored = new Map();

  for (const seed of SEED_POPULARITY) {
    const live = liveRatings[seed.id];
    const average = live ? live.total / live.count : seed.average;
    const count = live ? live.count + seed.cooks : seed.cooks;
    scored.set(seed.id, { average: Math.round(average * 10) / 10, count, score: trendingScore(average, count) });
  }

  for (const [id, data] of Object.entries(liveRatings)) {
    if (scored.has(id)) continue;
    const average = data.total / data.count;
    if (data.count >= 2) {
      scored.set(id, {
        average: Math.round(average * 10) / 10,
        count: data.count,
        score: trendingScore(average, data.count),
      });
    }
  }

  const ranked = [...scored.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, limit);

  return ranked
    .map(([id, stats], index) => {
      const recipe = RECIPES.find((r) => r.id === id);
      if (!recipe) return null;
      return {
        ...recipe,
        trendingRank: index + 1,
        rating: { average: stats.average, count: stats.count },
        isTrending: true,
      };
    })
    .filter(Boolean);
}

export function isTrendingRecipe(recipeId) {
  const trending = getTrendingRecipes(20);
  return trending.some((r) => r.id === recipeId);
}
