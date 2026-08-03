/** Flatten recommendation context for the daily brief API */
import { buildRecommendationContext } from "./ai/buildRecommendationContext.js";
import { getStreak } from "./streak.js";
import { getRecentRecipeIds } from "./recentRecipes.js";

export function buildDailyBriefProfile(overrides = {}) {
  const ctx = buildRecommendationContext(overrides);
  const taste = ctx.taste || {};
  const streak = getStreak();
  const recentIds = [...new Set([
    ...getRecentRecipeIds(8),
    ...(ctx.history?.recentRecipeIds || []),
    ...(streak.lastRecipeId ? [streak.lastRecipeId] : []),
  ])];

  return {
    ...taste,
    pantry: ctx.pantry,
    family: ctx.family,
    history: {
      ...ctx.history,
      recentRecipeIds: recentIds,
    },
    time: ctx.time,
    streak: streak.current,
    totalCooks: streak.totalCooks,
  };
}
