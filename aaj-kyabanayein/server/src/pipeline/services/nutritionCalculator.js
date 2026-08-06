/**
 * Nutrition calculator using USDA FoodData Central (public domain).
 * API: https://fdc.nal.usda.gov/api-guide.html
 * Never copies recipe text — only factual nutrient composition.
 */
const FDC_BASE = "https://api.nal.usda.gov/fdc/v1";
const NUTRIENT_IDS = {
  calories: 1008,
  protein: 1003,
  fat: 1004,
  carbs: 1005,
  fiber: 1079,
  sugar: 2000,
  sodium: 1093,
};

const searchCache = new Map();

function getApiKey() {
  return process.env.USDA_FDC_API_KEY || process.env.FDC_API_KEY || "DEMO_KEY";
}

/**
 * Search FDC for an ingredient name.
 * @param {string} query
 */
export async function searchFdcFood(query) {
  const key = query.toLowerCase().trim();
  if (searchCache.has(key)) return searchCache.get(key);

  const url = new URL(`${FDC_BASE}/foods/search`);
  url.searchParams.set("api_key", getApiKey());
  url.searchParams.set("query", query);
  url.searchParams.set("pageSize", "3");
  url.searchParams.set("dataType", "Foundation,SR Legacy");

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    const food = data.foods?.[0] || null;
    searchCache.set(key, food);
    return food;
  } catch {
    return null;
  }
}

/**
 * @param {{ name: string, quantity?: number|string, unit?: string }[]} ingredients
 * @param {number} servings
 */
export async function calculateNutritionFromIngredients(ingredients = [], servings = 4) {
  const totals = {
    calories: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    fiberG: 0,
    sugarG: 0,
    sodiumMg: 0,
    vitamins: {},
    minerals: {},
    source: "usda-fdc",
    licenseSpdx: "US-GOV",
    commercialUseAllowed: true,
    ingredientBreakdown: [],
  };

  for (const ing of ingredients) {
    const grams = estimateGrams(ing);
    if (!grams || grams <= 0) continue;

    const food = await searchFdcFood(ing.name);
    if (!food?.foodNutrients) continue;

    const per100g = extractNutrientsPer100g(food.foodNutrients);
    const factor = grams / 100;

    totals.calories += per100g.calories * factor;
    totals.proteinG += per100g.protein * factor;
    totals.carbsG += per100g.carbs * factor;
    totals.fatG += per100g.fat * factor;
    totals.fiberG += per100g.fiber * factor;
    totals.sugarG += per100g.sugar * factor;
    totals.sodiumMg += per100g.sodium * factor;

    totals.ingredientBreakdown.push({
      name: ing.name,
      grams,
      fdcId: food.fdcId,
      per100g,
    });
  }

  const s = Math.max(1, servings);
  return {
    calories: Math.round(totals.calories / s),
    proteinG: round1(totals.proteinG / s),
    carbsG: round1(totals.carbsG / s),
    fatG: round1(totals.fatG / s),
    fiberG: round1(totals.fiberG / s),
    sugarG: round1(totals.sugarG / s),
    sodiumMg: Math.round(totals.sodiumMg / s),
    vitamins: totals.vitamins,
    minerals: totals.minerals,
    dataSource: "USDA FoodData Central",
    licenseSpdx: "US-GOV",
    commercialUseAllowed: true,
    attributionText: "Nutrition calculated from USDA FoodData Central (public domain).",
    servings: s,
    lastVerifiedAt: new Date().toISOString(),
  };
}

function extractNutrientsPer100g(nutrients = []) {
  const byId = Object.fromEntries(nutrients.map((n) => [n.nutrientId || n.nutrient?.id, n.value ?? n.amount]));
  return {
    calories: byId[NUTRIENT_IDS.calories] || 0,
    protein: byId[NUTRIENT_IDS.protein] || 0,
    fat: byId[NUTRIENT_IDS.fat] || 0,
    carbs: byId[NUTRIENT_IDS.carbs] || 0,
    fiber: byId[NUTRIENT_IDS.fiber] || 0,
    sugar: byId[NUTRIENT_IDS.sugar] || 0,
    sodium: byId[NUTRIENT_IDS.sodium] || 0,
  };
}

/** Rough gram estimation when only quantity strings exist. */
function estimateGrams(ing) {
  const q = typeof ing.quantity === "number" ? ing.quantity : parseFloat(ing.quantity);
  const unit = (ing.unit || "").toLowerCase();

  if (!Number.isFinite(q)) return 50;

  if (unit === "g" || unit === "gram" || unit === "grams") return q;
  if (unit === "kg") return q * 1000;
  if (unit === "ml" || unit === "cup" && /milk|water|oil/.test(ing.name)) return unit === "cup" ? q * 240 : q;
  if (unit === "tablespoon" || unit === "tbsp") return q * 15;
  if (unit === "teaspoon" || unit === "tsp") return q * 5;
  if (unit === "cup") return q * 150;
  if (unit === "piece" || unit === "pcs") return q * 80;

  return q * 30;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}
