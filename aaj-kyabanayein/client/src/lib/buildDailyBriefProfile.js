/** Flatten recommendation context for the daily brief API */
import { buildRecommendationContext } from "./ai/buildRecommendationContext.js";
import { getStreak } from "./streak.js";

export function buildDailyBriefProfile(overrides = {}) {
  const ctx = buildRecommendationContext(overrides);
  const taste = ctx.taste || {};
  const streak = getStreak();

  return {
    ...taste,
    pantry: ctx.pantry,
    family: ctx.family,
    history: {
      ...ctx.history,
      recentRecipeIds: [
        ...(ctx.history?.recentRecipeIds || []),
        ...(streak.lastRecipeId ? [streak.lastRecipeId] : []),
      ],
    },
    time: ctx.time,
    streak: streak.current,
    totalCooks: streak.totalCooks,
  };
}
