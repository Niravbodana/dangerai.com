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

/** Seasonal tag boosts for Indian calendar months */
function seasonalBoost(recipe) {
  const month = new Date().getMonth() + 1;
  const tags = (recipe.tags || []).map((t) => String(t).toLowerCase());
  const name = `${recipe.name || ""} ${recipe.nameHi || ""}`.toLowerCase();
  let boost = 0;

  if ([6, 7, 8, 9].includes(month)) {
    if (tags.includes("monsoon") || /pakora|bhaji|chai|soup|khichdi/i.test(name)) boost += 8;
  }
  if ([10, 11].includes(month)) {
    if (/diwali|sweet|kheer|ladoo|halwa/i.test(name)) boost += 6;
  }
  if ([12, 1, 2].includes(month)) {
    if (/gajar|sarson|makki|paratha|soup/i.test(name)) boost += 6;
  }
  if ([3, 4, 5].includes(month)) {
    if (/mango|lassi|aam|kulfi|chaas/i.test(name)) boost += 8;
  }
  return boost;
}

function pickScored(pool, profile, mealType, usedIds, count = 1) {
  const recentIds = new Set(profile.history?.recentRecipeIds || []);
  const candidates = pool
    .filter((m) => !usedIds.has(m.id))
    .filter((m) => !recentIds.has(m.id))
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
      time: { mealType, cookTimeMax: profile.cookTimeMax, hour: profile.time?.hour },
    },
    { daySeed: daySeed() }
  );

  const boosted = ranked.map((p) => ({
    ...p,
    score: p.score + seasonalBoost(p.recipe),
  })).sort((a, b) => b.score - a.score);

  const picks = boosted.slice(0, count);
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
  if (profile.pantry?.length && recipe.pantryKeys?.some((k) => profile.pantry.includes(k))) {
    reasons.push("Uses pantry items");
  }
  if (recipe.cookTime <= (profile.cookTimeMax || 45)) reasons.push(`${recipe.cookTime} min — fits your time`);
  if (recipe.spice === profile.spice) reasons.push(`${recipe.spice} spice like you like`);
  if (recipe.tags?.includes("healthy")) reasons.push("Healthy pick");
  if (recipe.budget === "low") reasons.push("Budget friendly");
  if (profile.streak >= 3) reasons.push("Keeps your streak going");
  return reasons.slice(0, 2).join(" · ") || "Fresh pick for today";
}

export function generateDailyBrief(profile = {}) {
  const diet = profile.diet || "veg";
  const usedIds = new Set();
  const pool = filterRecipeIndex({ diet: diet === "all" ? undefined : diet });

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
      pantryItems: profile.pantry?.length || 0,
      favorites: profile.history?.favoriteIds?.length || 0,
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
