/**
 * Strict nutrition — USDA FDC only. NO guessing.
 * Rejects recipes when insufficient verified nutrition data.
 */
import { searchFdcFood } from "../pipeline/services/nutritionCalculator.js";
import { normalizeAllUnits } from "../intelligence/unitConverter.js";

const MIN_COVERAGE_RATIO = 0.5;

/**
 * @param {{ name: string, quantity?: string|number, unit?: string }[]} ingredients
 * @param {number} servings
 */
export async function calculateStrictNutrition(ingredients = [], servings = 4) {
  const normalized = normalizeAllUnits(ingredients);
  const breakdown = [];
  let matched = 0;

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
  };

  for (const ing of normalized) {
    const grams = ing.metricGrams || estimateGrams(ing);
    if (!grams || grams <= 0) continue;

    const food = await searchFdcFood(ing.name);
    if (!food?.foodNutrients?.length) continue;

    matched++;
    const per100g = extractNutrients(food.foodNutrients);
    const factor = grams / 100;

    totals.calories += per100g.calories * factor;
    totals.proteinG += per100g.protein * factor;
    totals.carbsG += per100g.carbs * factor;
    totals.fatG += per100g.fat * factor;
    totals.fiberG += per100g.fiber * factor;
    totals.sugarG += per100g.sugar * factor;
    totals.sodiumMg += per100g.sodium * factor;

    breakdown.push({
      name: ing.name,
      grams,
      fdcId: food.fdcId,
      fdcDescription: food.description,
      per100g,
    });
  }

  const countable = normalized.filter((i) => i.name && i.name !== "salt").length;
  const coverage = countable > 0 ? matched / countable : 0;
  const verified = coverage >= MIN_COVERAGE_RATIO && totals.calories > 0;

  const s = Math.max(1, servings);

  return {
    verified,
    status: verified ? "verified" : "insufficient_data",
    coverage: Math.round(coverage * 100),
    matchedIngredients: matched,
    totalIngredients: countable,
    calories: verified ? Math.round(totals.calories / s) : null,
    proteinG: verified ? round1(totals.proteinG / s) : null,
    carbsG: verified ? round1(totals.carbsG / s) : null,
    fatG: verified ? round1(totals.fatG / s) : null,
    fiberG: verified ? round1(totals.fiberG / s) : null,
    sugarG: verified ? round1(totals.sugarG / s) : null,
    sodiumMg: verified ? Math.round(totals.sodiumMg / s) : null,
    vitamins: totals.vitamins,
    minerals: totals.minerals,
    dataSource: "USDA FoodData Central",
    licenseSpdx: "US-GOV",
    nutritionSource: "usda-fdc",
    attributionText: "Nutrition calculated from USDA FoodData Central (public domain).",
    ingredientBreakdown: breakdown,
    servings: s,
    lastVerifiedAt: new Date().toISOString(),
    rejectionReason: verified ? null : `Only ${matched}/${countable} ingredients matched USDA FDC (need ${Math.ceil(MIN_COVERAGE_RATIO * 100)}%)`,
  };
}

const NUTRIENT_IDS = { calories: 1008, protein: 1003, fat: 1004, carbs: 1005, fiber: 1079, sugar: 2000, sodium: 1093 };

function extractNutrients(nutrients = []) {
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

function estimateGrams(ing) {
  const q = typeof ing.quantity === "number" ? ing.quantity : parseFloat(ing.quantity);
  if (!Number.isFinite(q)) return 50;
  const unit = (ing.unit || "").toLowerCase();
  if (unit === "g" || unit === "gram") return q;
  if (unit === "cup") return q * 150;
  if (unit === "tablespoon" || unit === "tbsp") return q * 15;
  if (unit === "teaspoon" || unit === "tsp") return q * 5;
  return q * 30;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}
