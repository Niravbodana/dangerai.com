/** Personal taste graph — spice, diet, avoid, region bias */
const KEY = "akb-taste-profile";

export const DEFAULT_TASTE = {
  diet: "veg",
  spice: "medium", // mild | medium | spicy
  oilPreference: "medium", // less | medium | normal
  avoid: [], // e.g. onion, garlic, mushroom
  preferCuisines: [], // north-indian, south-indian, ...
  cookTimeMax: 45,
  jain: false,
  kidsFriendly: false,
  diabeticFriendly: false,
  familySize: 4,
};

export function getTasteProfile() {
  try {
    return { ...DEFAULT_TASTE, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return { ...DEFAULT_TASTE };
  }
}

export function saveTasteProfile(partial) {
  const next = { ...getTasteProfile(), ...partial, updatedAt: new Date().toISOString() };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function tasteQueryParams(profile = getTasteProfile()) {
  const params = {};
  if (profile.diet && profile.diet !== "all") params.diet = profile.diet;
  if (profile.preferCuisines?.[0]) params.cuisine = profile.preferCuisines[0];
  return params;
}

export function scoreRecipeForTaste(recipe, profile = getTasteProfile()) {
  let score = 50;
  if (profile.diet === "veg" && recipe.diet?.includes("non-veg")) return 0;
  if (profile.diet === "non-veg" && recipe.diet?.includes("non-veg")) score += 15;
  if (profile.spice && recipe.spice === profile.spice) score += 10;
  if (profile.cookTimeMax && recipe.cookTime <= profile.cookTimeMax) score += 10;
  if (profile.preferCuisines?.includes(recipe.cuisine)) score += 20;
  if (profile.kidsFriendly && /mild|kids|simple/i.test((recipe.tags || []).join(" "))) score += 10;
  if (profile.diabeticFriendly && /healthy|diabetic|fiber/i.test((recipe.tags || []).join(" "))) score += 10;
  if (profile.jain && /onion|garlic|प्याज|लहसुन/i.test(JSON.stringify(recipe.ingredients || []))) score -= 40;
  for (const a of profile.avoid || []) {
    if (new RegExp(a, "i").test(JSON.stringify(recipe.ingredients || []))) score -= 25;
  }
  return score;
}
