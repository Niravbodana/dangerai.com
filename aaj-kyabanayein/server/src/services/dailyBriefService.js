/**
 * Aaj Kya Banaye — personalised daily brief (BF / lunch / snack / dinner)
 */
import { filterRecipeIndex, getRecipeById, toListItem } from "../data/recipes.js";
import { rankRecipes } from "./ai/personalizationPipeline.js";

function daySeed() {
  const d = new Date().toISOString().slice(0, 10);
  let h = 0;
  for (let i = 0; i < d.length; i++) h = (h * 31 + d.charCodeAt(i)) >>> 0;
  return h;
}

function pickScored(pool, profile, mealType, usedIds, count = 1) {
  const candidates = pool
    .filter((m) => !usedIds.has(m.id))
    .filter((m) => !mealType || m.mealType === mealType)
    .map((m) => getRecipeById(m.id))
    .filter(Boolean);

  const ranked = rankRecipes(
    candidates,
    {
      taste: profile,
      pantry: profile.pantry,
      family: profile.family,
      history: profile.history,
      time: { mealType, cookTimeMax: profile.cookTimeMax },
    },
    { daySeed: daySeed() }
  );

  const picks = ranked.slice(0, count);
  picks.forEach((p) => usedIds.add(p.recipe.id));
  return picks.map((p) => ({
    ...toListItem(p.recipe),
    matchScore: Math.round(p.score),
    why: p.reasons.length ? p.reasons.join(" · ") : explainPick(p.recipe, profile),
  }));
}

function explainPick(recipe, profile) {
  const reasons = [];
  if (profile.preferCuisines?.includes(recipe.cuisine)) reasons.push("Your favourite cuisine");
  if (recipe.cookTime <= (profile.cookTimeMax || 45)) reasons.push(`${recipe.cookTime} min — fits your time`);
  if (recipe.spice === profile.spice) reasons.push(`${recipe.spice} spice like you like`);
  if (recipe.tags?.includes("healthy")) reasons.push("Healthy pick");
  if (recipe.budget === "low") reasons.push("Budget friendly");
  return reasons.slice(0, 2).join(" · ") || "Fresh pick for today";
}

export function generateDailyBrief(profile = {}) {
  const diet = profile.diet || "veg";
  const usedIds = new Set();
  const pool = filterRecipeIndex({ diet: diet === "all" ? undefined : diet }).slice(0, 400);

  const breakfast = pickScored(pool, profile, "breakfast", usedIds, 1)[0]
    || pickScored(pool, profile, null, usedIds, 1)[0];
  const lunch = pickScored(pool, profile, "lunch", usedIds, 1)[0]
    || pickScored(pool, profile, null, usedIds, 1)[0];
  const snack = pickScored(pool, profile, "snack", usedIds, 1)[0]
    || pickScored(pool, profile, null, usedIds, 1)[0];
  const dinner = pickScored(pool, profile, "dinner", usedIds, 1)[0]
    || pickScored(pool, profile, null, usedIds, 1)[0];

  const alts = pickScored(pool, profile, null, usedIds, 4);

  return {
    date: new Date().toISOString().slice(0, 10),
    meals: {
      breakfast,
      lunch,
      snack,
      dinner,
    },
    alternatives: alts,
    profileUsed: {
      diet: profile.diet || "veg",
      spice: profile.spice || "medium",
      cookTimeMax: profile.cookTimeMax || 45,
    },
  };
}

export function matchCollectionRecipes(collection, limit = 24) {
  let pool = filterRecipeIndex({});

  if (collection.cuisines?.length) {
    pool = pool.filter((r) => collection.cuisines.includes(r.cuisine));
  }
  if (collection.mealTypes?.length) {
    pool = pool.filter((r) => collection.mealTypes.includes(r.mealType));
  }
  if (collection.budgets?.length) {
    pool = pool.filter((r) => collection.budgets.includes(r.budget));
  }
  if (collection.maxCookTime) {
    pool = pool.filter((r) => (r.cookTime || 99) <= collection.maxCookTime);
  }
  if (collection.spice?.length) {
    pool = pool.filter((r) => collection.spice.includes(r.spice || "medium"));
  }
  if (collection.tags?.length) {
    const tagged = pool.filter((r) =>
      (r.tags || []).some((t) => collection.tags.some((ct) => String(t).toLowerCase().includes(ct)))
    );
    if (tagged.length >= 6) pool = tagged;
    else {
      // fallback: name/tag soft match
      pool = pool.filter((r) => {
        const blob = `${r.name} ${(r.tags || []).join(" ")}`.toLowerCase();
        return collection.tags.some((t) => blob.includes(t));
      }).concat(pool).filter((r, i, arr) => arr.findIndex((x) => x.id === r.id) === i);
    }
  }

  return pool.slice(0, limit).map((m) => {
    const full = getRecipeById(m.id);
    return full ? toListItem(full) : m;
  });
}
