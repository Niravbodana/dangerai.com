/**
 * Smart meal planner — local signal-based weekly planning (no external AI).
 * Extends mealPlanner with protein/budget/pantry/family/leftover awareness.
 */
import { filterRecipeIndex, getRecipeById } from "../data/recipes.js";
import { generateGroceryList, getDefaultPreferences } from "./mealPlanner.js";
import { scoreRecipeForTaste } from "./tasteScore.js";
import { getDayPlanningHints, getUpcomingFestivals } from "../data/festivalCalendar.js";
import { collectFamilyHealthConditions, scoreHealthFit } from "./healthPlanningService.js";
import { attachVariationsToPlan } from "./mealVariationService.js";

const MEAL_ORDER = ["breakfast", "lunch", "snack", "dinner"];
const DAY_LABELS = ["Aaj", "Kal", "Parso", "Agle din", "Agle din", "Agle din", "Agle din"];
const BUDGET_RANK = { low: 1, medium: 2, high: 3 };
const PROTEIN_RE = /protein|dal|paneer|chicken|egg|fish|rajma|chana|moong|mutton|anda|चिकन|दाल|पनीर/;

function matchesBudget(recipe, budget) {
  return BUDGET_RANK[recipe.budget] <= BUDGET_RANK[budget];
}

function isProteinRich(recipe) {
  const blob = `${recipe.name} ${(recipe.tags || []).join(" ")} ${(recipe.ingredients || []).map((i) => i.name).join(" ")}`.toLowerCase();
  return PROTEIN_RE.test(blob) || recipe.diet?.includes("non-veg");
}

function pantryOverlap(recipe, pantryKeys = []) {
  if (!pantryKeys.length) return 0;
  const keys = new Set([
    ...(recipe.pantryKeys || []),
    ...(recipe.ingredients || []).map((i) => i.name.toLowerCase()),
  ]);
  let hits = 0;
  for (const p of pantryKeys) {
    const pk = p.toLowerCase();
    for (const k of keys) {
      if (k.includes(pk) || pk.includes(k)) {
        hits++;
        break;
      }
    }
  }
  return Math.min(30, hits * 8);
}

function familyScore(recipe, family = {}) {
  const members = family.members || [];
  if (!members.length) return 0;
  if (members.every((m) => m.diet === "veg" || m.diet === "jain") && recipe.diet?.includes("non-veg")) {
    return -100;
  }
  let score = 0;
  const spices = [...new Set(members.map((m) => m.spice).filter(Boolean))];
  if (spices.includes(recipe.spice)) score += 10;
  if (members.some((m) => m.diet === "jain") && /onion|garlic|प्याज|लहसुन/i.test(JSON.stringify(recipe.ingredients || []))) {
    score -= 30;
  }
  return score;
}

function leftoverScore(recipe, prevDinner) {
  if (!prevDinner) return 0;
  const prevKeys = new Set([
    ...(prevDinner.pantryKeys || []),
    ...(prevDinner.ingredients || []).map((i) => i.name.toLowerCase()),
  ]);
  const keys = [
    ...(recipe.pantryKeys || []),
    ...(recipe.ingredients || []).map((i) => i.name.toLowerCase()),
  ];
  let overlap = 0;
  for (const k of keys) {
    for (const p of prevKeys) {
      if (k.includes(p) || p.includes(k)) {
        overlap++;
        break;
      }
    }
  }
  return Math.min(25, overlap * 10);
}

function calorieBalance(recipe, mealType) {
  const cal = recipe.calories || 300;
  if (mealType === "breakfast" && cal <= 320) return 10;
  if (mealType === "lunch" && cal >= 250 && cal <= 520) return 10;
  if (mealType === "dinner" && cal >= 200 && cal <= 480) return 10;
  if (mealType === "snack" && cal <= 220) return 10;
  return 0;
}

function expiringBoost(recipe, expiringKeys = []) {
  if (!expiringKeys.length) return 0;
  const keys = recipe.pantryKeys || [];
  let boost = 0;
  for (const exp of expiringKeys) {
    const e = exp.toLowerCase();
    if (keys.some((k) => k.includes(e) || e.includes(k))) boost += 12;
  }
  return boost;
}

function festivalScore(recipe, dateStr) {
  const hints = getDayPlanningHints(dateStr);
  let score = 0;
  const blob = `${recipe.name} ${(recipe.tags || []).join(" ")}`.toLowerCase();
  if (hints.preferSweet && /sweet|halwa|kheer|ladoo|mithai|barfi/i.test(blob)) score += 18;
  if (hints.preferFestive && /festive|special|biryani|pulao|thali/i.test(blob)) score += 10;
  if (hints.noOnionGarlic && /onion|garlic|pyaz|lahsun|प्याज|लहसुन/i.test(JSON.stringify(recipe.ingredients || []))) {
    score -= 45;
  }
  if (hints.festival) score += 5;
  return score;
}

function scoreForPlan(recipe, { prefs, context, mealType, dayOffset, prevDinner, dateStr }) {
  if (!matchesBudget(recipe, prefs.budget)) return -1;
  if (recipe.cookTime > prefs.maxCookTime) return -1;

  let score = scoreRecipeForTaste(recipe, { ...prefs, ...(context.taste || {}) });
  if (score <= 0) return -1;

  score += pantryOverlap(recipe, context.pantry);
  score += familyScore(recipe, context.family);
  score += expiringBoost(recipe, context.expiringKeys);

  if (["lunch", "dinner"].includes(mealType) && isProteinRich(recipe)) {
    if ((dayOffset + (mealType === "lunch" ? 0 : 1)) % 2 === 0) score += 15;
  }

  if (mealType === "lunch") score += leftoverScore(recipe, prevDinner);
  if (recipe.mealType === mealType) score += 20;
  score += calorieBalance(recipe, mealType);
  score += festivalScore(recipe, dateStr);
  score += scoreHealthFit(recipe, context.healthConditions || []);

  if (prefs.budget === "low" && recipe.budget === "low") score += 8;

  return score;
}

function pickSmart(pool, usedIds, scoreFn) {
  const ranked = pool
    .filter((m) => !usedIds.has(m.id))
    .map((m) => {
      const recipe = getRecipeById(m.id);
      if (!recipe) return null;
      const score = scoreFn(recipe);
      return score > 0 ? { recipe, score } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  const pick = ranked[0];
  if (pick) usedIds.add(pick.recipe.id);
  return pick ? { recipe: pick.recipe, score: pick.score } : null;
}

function generateSmartDayPlan(prefs, context, dayOffset, usedIds, prevDinner) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  const dateStr = date.toISOString().split("T")[0];
  const dayHints = getDayPlanningHints(dateStr);
  const meals = [];
  let proteinMeals = 0;
  let pantryHits = 0;
  let leftoverMeals = 0;

  for (const mealType of MEAL_ORDER) {
    const pool = filterRecipeIndex({ mealType, diet: prefs.diet });
    const pick = pickSmart(pool, usedIds, (recipe) =>
      scoreForPlan(recipe, { prefs, context, mealType, dayOffset, prevDinner, dateStr })
    );
    if (!pick) continue;

    const { recipe, score } = pick;
    if (isProteinRich(recipe)) proteinMeals++;
    if (context.pantry?.length && pantryOverlap(recipe, context.pantry) > 0) pantryHits++;
    if (mealType === "lunch" && leftoverScore(recipe, prevDinner) > 0) leftoverMeals++;

    meals.push({
      mealType,
      recipe,
      planScore: Math.round(score),
      proteinRich: isProteinRich(recipe),
      usesPantry: pantryOverlap(recipe, context.pantry) > 0,
      leftoverFriendly: mealType === "lunch" && leftoverScore(recipe, prevDinner) > 0,
    });
  }

  return {
    date: dateStr,
    dayLabel: DAY_LABELS[dayOffset] ?? date.toLocaleDateString("hi-IN", { weekday: "long" }),
    festival: dayHints.festival,
    weekdayFast: dayHints.weekdayFast,
    meals,
    dayMeta: { proteinMeals, pantryHits, leftoverMeals },
  };
}

export function generateSmartGroceryList(plans, pantryKeys = [], familySize = 4) {
  const base = generateGroceryList(plans);
  const pantry = new Set(pantryKeys.map((k) => k.toLowerCase()));

  return base
    .map((item) => {
      const inPantry = [...pantry].some(
        (p) => item.name.toLowerCase().includes(p) || p.includes(item.name.toLowerCase())
      );
      return {
        ...item,
        inPantry,
        needToBuy: !inPantry,
        quantity: familySize > 1 ? `${item.quantity} (family ×${familySize})` : item.quantity,
      };
    })
    .filter((item) => item.needToBuy);
}

export function generateSmartWeeklyPlan(prefs = {}, context = {}) {
  const merged = { ...getDefaultPreferences(), ...prefs };
  const enrichedContext = {
    ...context,
    healthConditions: context.healthConditions?.length
      ? context.healthConditions
      : collectFamilyHealthConditions(context.family),
  };
  const leftoverMode = merged.leftoverFrequency || "alternating";
  const usedIds = new Set();
  const plans = [];
  let prevDinner = null;

  for (let i = 0; i < 7; i++) {
    const day = generateSmartDayPlan(merged, enrichedContext, i, usedIds, prevDinner);
    if (leftoverMode === "minimal") {
      day.dayMeta.leftoverMeals = 0;
    }
    prevDinner = day.meals.find((m) => m.mealType === "dinner")?.recipe || null;
    plans.push(day);
  }

  const withVariations = merged.includeVariations !== false
    ? attachVariationsToPlan(plans, { diet: merged.diet })
    : plans;

  const groceryList = generateSmartGroceryList(
    withVariations,
    enrichedContext.pantry || [],
    merged.familySize || 4
  );

  return {
    plans: withVariations,
    groceryList,
    smart: true,
    planningHints: {
      leftoverFrequency: leftoverMode,
      healthConditions: enrichedContext.healthConditions,
      upcomingFestivals: getUpcomingFestivals(21),
    },
    summary: {
      proteinDays: withVariations.filter((d) => d.dayMeta.proteinMeals >= 2).length,
      pantryAwareMeals: withVariations.reduce((n, d) => n + d.dayMeta.pantryHits, 0),
      leftoverOptimized: withVariations.reduce((n, d) => n + d.dayMeta.leftoverMeals, 0),
      groceryItems: groceryList.length,
      festivalDays: withVariations.filter((d) => d.festival).length,
    },
  };
}
