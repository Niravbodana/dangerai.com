import { filterRecipeIndex, getRecipeById } from "../data/recipes.js";

const PANTRY_ALIASES = {
  aloo: ["aloo", "potato", "आलू"],
  pyaz: ["pyaz", "onion", "प्याज"],
  tamatar: ["tamatar", "tomato", "टमाटर"],
  gobi: ["gobi", "cauliflower", "गोभी"],
  palak: ["palak", "spinach", "पालक"],
  paneer: ["paneer", "पनीर"],
  chawal: ["chawal", "rice", "चावल"],
  dal: ["dal", "toor", "moong", "अरहर", "दाल"],
  atta: ["atta", "wheat", "flour", "आटा"],
  besan: ["besan", "बेसन"],
  egg: ["egg", "अंडा", "ande"],
  chicken: ["chicken", "चिकन"],
  mutton: ["mutton", "मटन"],
  fish: ["fish", "मछली"],
  chana: ["chana", "chickpea", "छोले"],
  rajma: ["rajma", "राजमा"],
  dahi: ["dahi", "yogurt", "curd", "दही"],
  suji: ["suji", "semolina", "सूजी"],
  poha: ["poha", "पोहा"],
  moong: ["moong", "मूंग", "sprout"],
  sabzi: ["sabzi", "vegetable", "सब्जी"],
  masala: ["masala", "spice", "मसाला"],
  adrak: ["adrak", "ginger", "अदrak"],
  lahsun: ["lahsun", "garlic", "लहसुन"],
};

/** Ingredient substitutions — pantry item can stand in for another */
const INGREDIENT_SUBSTITUTES = {
  paneer: ["tofu"],
  tofu: ["paneer"],
  moong: ["dal", "toor"],
  toor: ["moong", "dal"],
  chana: ["rajma"],
  rajma: ["chana"],
  besan: ["atta"],
  atta: ["besan", "suji"],
  suji: ["besan", "atta"],
  dahi: ["milk"],
  milk: ["dahi"],
  butter: ["ghee", "oil"],
  ghee: ["butter"],
  palak: ["gobi", "sabzi"],
  gobi: ["palak", "sabzi"],
  tamatar: ["pyaz"],
  egg: ["paneer"],
};

function normalizePantryItem(item) {
  return item.toLowerCase().trim();
}

function expandPantry(items) {
  const expanded = new Set();
  for (const item of items.map(normalizePantryItem)) {
    expanded.add(item);
    for (const [key, aliases] of Object.entries(PANTRY_ALIASES)) {
      if (aliases.some((a) => item.includes(a) || a.includes(item))) {
        expanded.add(key);
        aliases.forEach((a) => expanded.add(a));
      }
    }
  }
  return expanded;
}

function getRecipePantryKeys(recipe) {
  const keys = new Set();
  for (const k of recipe.pantryKeys || []) keys.add(normalizePantryItem(k));
  for (const ing of recipe.ingredients || []) {
    keys.add(normalizePantryItem(ing.name));
    keys.add(normalizePantryItem(ing.nameHi));
  }
  return keys;
}

function findSubstituteInPantry(missingKey, userPantry) {
  const subs = INGREDIENT_SUBSTITUTES[missingKey] || [];
  for (const sub of subs) {
    for (const userItem of userPantry) {
      if (userItem.includes(sub) || sub.includes(userItem)) return sub;
    }
  }
  return null;
}

function scoreRecipe(recipe, userPantry, options = {}) {
  const recipeKeys = getRecipePantryKeys(recipe);
  let matchCount = 0;
  const missing = [];
  const substitutions = [];

  for (const key of recipeKeys) {
    let matched = false;
    for (const userItem of userPantry) {
      if (key.includes(userItem) || userItem.includes(key)) {
        matchCount++;
        matched = true;
        break;
      }
    }
    if (!matched) {
      const sub = findSubstituteInPantry(key, userPantry);
      if (sub) {
        matchCount++;
        substitutions.push({ missing: key, substitute: sub });
        matched = true;
      }
    }
    if (!matched) missing.push(key);
  }

  const totalNeeded = Math.max(recipeKeys.size, 1);
  const matchPercent = Math.round((matchCount / totalNeeded) * 100);

  let smartBoost = 0;
  for (const exp of options.expiringKeys || []) {
    const e = normalizePantryItem(exp);
    for (const key of recipeKeys) {
      if (key.includes(e) || e.includes(key)) smartBoost += 12;
    }
  }

  return {
    matchCount,
    matchPercent,
    missing: missing.slice(0, 5),
    substitutions,
    smartBoost,
  };
}

/** Exported for recommendation pipeline */
export function scoreRecipePantryMatch(recipe, ingredients = []) {
  return scoreRecipe(recipe, expandPantry(ingredients));
}

export function suggestFromPantry({
  ingredients = [],
  diet = "veg",
  mealType = null,
  category = null,
  limit = 20,
  pantryOnly = false,
  budget = null,
  expiringKeys = [],
  includeAnalytics = false,
  includeGrocery = false,
}) {
  const userPantry = expandPantry(ingredients);

  let pool = filterRecipeIndex({ mealType, category, diet }).slice(0, 400);

  if (budget === "low") {
    pool = pool.filter((m) => {
      const r = getRecipeById(m.id);
      return r?.budget === "low";
    });
  }

  const scored = pool
    .map((meta) => {
      const recipe = getRecipeById(meta.id);
      if (!recipe) return null;
      const score = scoreRecipe(recipe, userPantry, { expiringKeys });
      return { recipe, ...score };
    })
    .filter(Boolean)
    .filter((s) => s.matchCount > 0)
    .filter((s) => !pantryOnly || s.matchPercent >= 100)
    .sort(
      (a, b) =>
        b.matchPercent + b.smartBoost - (a.matchPercent + a.smartBoost) ||
        b.matchCount - a.matchCount
    );

  const suggestions = scored.slice(0, limit).map((s) => ({
    ...s.recipe,
    matchPercent: s.matchPercent,
    matchedIngredients: s.matchCount,
    missingIngredients: s.missing,
    substitutions: s.substitutions,
    usesExpiring: (expiringKeys || []).some((e) =>
      (s.recipe.pantryKeys || []).some(
        (k) => k.includes(e) || e.includes(k)
      )
    ),
  }));

  const result = { total: scored.length, suggestions };

  if (includeAnalytics) {
    result.analytics = getPantryAnalytics({ ingredients, suggestions: scored });
  }
  if (includeGrocery) {
    result.grocery = getGroceryRecommendations({ ingredients, suggestions: scored.slice(0, 15) });
  }

  return result;
}

export function getPantryAnalytics({ ingredients = [], suggestions = [] }) {
  const userPantry = expandPantry(ingredients);
  const missingFreq = {};

  for (const s of suggestions.slice(0, 20)) {
    for (const m of s.missing || []) {
      missingFreq[m] = (missingFreq[m] || 0) + 1;
    }
  }

  const topMissing = Object.entries(missingFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([ingredient, count]) => ({
      ingredient,
      recipesBlocked: count,
      substitute: findSubstituteInPantry(ingredient, userPantry),
    }));

  const avgMatch =
    suggestions.length > 0
      ? Math.round(
          suggestions.reduce((sum, s) => sum + s.matchPercent, 0) / suggestions.length
        )
      : 0;

  return {
    pantrySize: ingredients.length,
    possibleRecipes: suggestions.length,
    avgMatchPercent: avgMatch,
    topMissing,
  };
}

export function getGroceryRecommendations({ ingredients = [], suggestions = [], limit = 8 }) {
  const userPantry = expandPantry(ingredients);
  const missingFreq = {};

  for (const s of suggestions) {
    for (const m of s.missing || []) {
      if ([...userPantry].some((u) => m.includes(u) || u.includes(m))) continue;
      missingFreq[m] = (missingFreq[m] || 0) + 1;
    }
  }

  return Object.entries(missingFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([ingredient, count]) => ({
      ingredient,
      recipesUnlocked: count,
      substitute: findSubstituteInPantry(ingredient, userPantry),
    }));
}

export const COMMON_PANTRY_ITEMS = [
  { key: "aloo", label: "Aloo", labelHi: "आलू" },
  { key: "pyaz", label: "Pyaz", labelHi: "प्याज" },
  { key: "tamatar", label: "Tamatar", labelHi: "टमाटर" },
  { key: "gobi", label: "Gobi", labelHi: "गोभी" },
  { key: "palak", label: "Palak", labelHi: "पालक" },
  { key: "paneer", label: "Paneer", labelHi: "पनीर" },
  { key: "chawal", label: "Chawal", labelHi: "चावल" },
  { key: "dal", label: "Dal", labelHi: "दाल" },
  { key: "atta", label: "Atta", labelHi: "आटा" },
  { key: "besan", label: "Besan", labelHi: "बेसन" },
  { key: "egg", label: "Anda", labelHi: "अंडा" },
  { key: "chicken", label: "Chicken", labelHi: "चिकन" },
  { key: "mutton", label: "Mutton", labelHi: "मटन" },
  { key: "fish", label: "Fish", labelHi: "मछली" },
  { key: "chana", label: "Chana", labelHi: "चना" },
  { key: "rajma", label: "Rajma", labelHi: "राजमा" },
  { key: "dahi", label: "Dahi", labelHi: "दही" },
  { key: "poha", label: "Poha", labelHi: "पोहा" },
  { key: "moong", label: "Moong", labelHi: "मूंग" },
  { key: "adrak", label: "Adrak", labelHi: "अदरक" },
  { key: "lahsun", label: "Lahsun", labelHi: "लहसुन" },
  { key: "suji", label: "Suji", labelHi: "सूजी" },
  { key: "milk", label: "Milk", labelHi: "दूध" },
  { key: "butter", label: "Butter", labelHi: "मक्खन" },
];
