/**
 * Ranking signal scorers — taste, pantry, family, history, time.
 * Local/rule-based only (no external AI).
 */
import { scoreRecipeForTaste } from "../tasteScore.js";
import { scoreRecipePantryMatch } from "../pantryService.js";

export function scoreTasteSignal(recipe, taste = {}) {
  if (!taste || !Object.keys(taste).length) return null;
  const raw = scoreRecipeForTaste(recipe, taste);
  if (raw <= 0) return { score: 0, reasons: ["Does not match diet"] };
  return { score: Math.min(100, raw), reasons: [] };
}

export function scorePantrySignal(recipe, pantry = []) {
  const keys = Array.isArray(pantry) ? pantry : pantry?.ingredients || pantry?.keys || [];
  if (!keys.length) return null;
  const { matchPercent, missing } = scoreRecipePantryMatch(recipe, keys);
  if (matchPercent <= 0) return { score: 0, reasons: [] };
  const reasons = matchPercent >= 70 ? ["Matches pantry"] : [];
  if (missing?.length) reasons.push(`Missing: ${missing.slice(0, 2).join(", ")}`);
  return { score: matchPercent, reasons };
}

export function scoreFamilySignal(recipe, family = {}) {
  const members = family.members || [];
  if (!members.length) return null;
  let score = 55;
  const reasons = [];
  const needsVeg = members.every((m) => m.diet === "veg" || m.diet === "jain");
  if (needsVeg && recipe.diet?.includes("non-veg")) {
    return { score: 0, reasons: ["Not family-safe diet"] };
  }
  const spices = [...new Set(members.map((m) => m.spice).filter(Boolean))];
  if (spices.includes(recipe.spice)) {
    score += 20;
    reasons.push("Family spice match");
  }
  if (members.some((m) => m.diet === "jain") && /onion|garlic|प्याज|लहसुन/i.test(JSON.stringify(recipe.ingredients || []))) {
    score -= 35;
    reasons.push("Jain family avoid");
  }
  return { score: Math.max(0, Math.min(100, score)), reasons };
}

export function scoreHistorySignal(recipe, history = {}) {
  const { favoriteIds = [], recentRecipeIds = [], recentSearches = [] } = history;
  if (!favoriteIds.length && !recentRecipeIds.length && !recentSearches.length) return null;

  let score = 45;
  const reasons = [];
  if (favoriteIds.includes(recipe.id)) {
    score += 30;
    reasons.push("You saved this");
  }
  if (recentRecipeIds.includes(recipe.id)) {
    score += 12;
    reasons.push("Recently viewed");
  }
  const blob = `${recipe.name} ${recipe.nameHi || ""} ${(recipe.tags || []).join(" ")}`.toLowerCase();
  for (const term of recentSearches) {
    const t = String(term).toLowerCase().trim();
    if (t && blob.includes(t)) {
      score += 10;
      reasons.push(`Matches "${term}"`);
      break;
    }
  }
  return { score: Math.min(100, score), reasons };
}

function inferMealType(hour) {
  if (hour >= 5 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 16) return "lunch";
  if (hour >= 16 && hour < 18) return "snack";
  return "dinner";
}

export function scoreTimeSignal(recipe, time = {}) {
  const hour = time.hour ?? new Date().getHours();
  const mealType = time.mealType || inferMealType(hour);
  const maxCook = time.cookTimeMax ?? 45;
  let score = 50;
  const reasons = [];
  if (recipe.mealType === mealType) {
    score += 25;
    reasons.push(`Good for ${mealType}`);
  }
  if (recipe.cookTime <= maxCook) {
    score += 15;
    reasons.push(`${recipe.cookTime} min`);
  }
  if (hour >= 17 && recipe.cookTime <= 25) score += 8;
  return { score: Math.min(100, score), reasons };
}
