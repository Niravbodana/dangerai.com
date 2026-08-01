/** Shared taste scoring for daily brief / collections (server-side) */
export function scoreRecipeForTaste(recipe, profile = {}) {
  let score = 50;
  const diet = profile.diet || "veg";
  if (diet === "veg" && recipe.diet?.includes("non-veg")) return 0;
  if (diet === "non-veg" && recipe.diet?.includes("non-veg")) score += 15;
  if (profile.spice && recipe.spice === profile.spice) score += 10;
  if (profile.cookTimeMax && recipe.cookTime <= profile.cookTimeMax) score += 10;
  if (profile.preferCuisines?.includes(recipe.cuisine)) score += 20;
  if (profile.kidsFriendly && /mild|kids|simple/i.test((recipe.tags || []).join(" "))) score += 10;
  if (profile.diabeticFriendly && /healthy|diabetic|fiber/i.test((recipe.tags || []).join(" "))) score += 10;
  if (profile.jain && /onion|garlic|प्याज|लहसुन/i.test(JSON.stringify(recipe.ingredients || []))) score -= 40;
  for (const a of profile.avoid || []) {
    if (new RegExp(a, "i").test(JSON.stringify(recipe.ingredients || []))) score -= 25;
  }
  if (recipe.healthScore >= 7) score += 5;
  return score;
}
