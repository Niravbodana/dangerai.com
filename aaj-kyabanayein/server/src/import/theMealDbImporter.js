/**
 * Import all TheMealDB recipes as metadata seeds — original AI content + HD photos.
 * Free API: https://www.themealdb.com/api/json/v1/1/
 */
import { upsertRecipe } from "../db/recipeRepository.js";
import { saveIntelligenceRecipe } from "../intelligence/recipeStore.js";
import { approveRecipe } from "../intelligence/reviewQueue.js";
import { buildPremiumRecipe } from "../premium/premiumRecipeBuilder.js";
import { getDb } from "../db/connection.js";
import { logger } from "../lib/logger.js";

const BASE = "https://www.themealdb.com/api/json/v1/1";
const USER_AGENT = "RasoiraMealPlanner/1.0";

const AREA_TO_CUISINE = {
  Indian: "indian",
  Chinese: "chinese",
  Italian: "italian",
  Thai: "thai",
  Mexican: "mexican",
  Japanese: "japanese",
  Turkish: "turkish",
  Greek: "continental",
  French: "continental",
  Spanish: "continental",
  British: "continental",
  American: "continental",
  Jamaican: "continental",
  Moroccan: "continental",
  Vietnamese: "continental",
  Egyptian: "continental",
  Polish: "continental",
  Portuguese: "continental",
  Russian: "continental",
  Tunisian: "continental",
  Syrian: "continental",
  Kenyan: "continental",
  Croatian: "continental",
  Dutch: "continental",
  Filipino: "continental",
  Irish: "continental",
  Malaysian: "continental",
};

function guessMealType(name = "", category = "") {
  const n = `${name} ${category}`.toLowerCase();
  if (/breakfast|pancake|toast|egg|porridge|poha|upma/.test(n)) return "breakfast";
  if (/dessert|sweet|cake|pie|pudding|kheer|halwa|jamun|ladoo|ice cream/.test(n)) return "snack";
  if (/snack|starter|appetizer|samosa|pakora|vada|tikki/.test(n)) return "snack";
  if (/dinner|curry|biryani|steak|roast/.test(n)) return "dinner";
  return "lunch";
}

function guessDiet(ingredients = [], name = "") {
  const blob = `${ingredients.map((i) => i.name).join(" ")} ${name}`.toLowerCase();
  if (/chicken|mutton|lamb|beef|pork|fish|prawn|shrimp|meat|egg|bacon|sausage/.test(blob)) {
    return ["non-vegetarian", "non-veg"];
  }
  return ["vegetarian", "veg"];
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(12000) });
  if (!res.ok) return null;
  return res.json();
}

function mealToIngredients(meal) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`]?.trim();
    const qty = meal[`strMeasure${i}`]?.trim();
    if (name) ingredients.push({ name, nameHi: name, quantity: qty || "as needed" });
  }
  return ingredients;
}

async function collectAllMeals() {
  const meals = new Map();

  const list = await fetchJson(`${BASE}/list.php?a=list`);
  for (const area of list?.meals || []) {
    const data = await fetchJson(`${BASE}/filter.php?a=${encodeURIComponent(area.strArea)}`);
    for (const m of data?.meals || []) {
      if (m?.idMeal) meals.set(m.idMeal, m);
    }
    await new Promise((r) => setTimeout(r, 80));
  }

  const cats = await fetchJson(`${BASE}/list.php?c=list`);
  for (const cat of cats?.meals || []) {
    const data = await fetchJson(`${BASE}/filter.php?c=${encodeURIComponent(cat.strCategory)}`);
    for (const m of data?.meals || []) {
      if (m?.idMeal) meals.set(m.idMeal, m);
    }
    await new Promise((r) => setTimeout(r, 80));
  }

  return meals;
}

/**
 * @param {object} options
 */
export async function importTheMealDbAll(options = {}) {
  const { dryRun = false, premiumUpgrade = true, limit = 0, concurrency = 4 } = options;
  const db = getDb();
  const existing = new Set(
    db.prepare("SELECT id FROM recipes").all().map((r) => r.id)
  );

  const report = {
    source: "themealdb",
    discovered: 0,
    imported: 0,
    skipped: 0,
    failed: 0,
    upgraded: 0,
    errors: [],
  };

  logger.info("TheMealDB import: collecting all meals…");
  const mealMap = await collectAllMeals();
  report.discovered = mealMap.size;

  let meals = [...mealMap.values()];
  if (limit > 0) meals = meals.slice(0, limit);

  let cursor = 0;
  async function processOne(mealRef) {
    const id = `tmdb-${mealRef.idMeal}`;
    if (existing.has(id)) {
      report.skipped++;
      return;
    }

    try {
      const detail = await fetchJson(`${BASE}/lookup.php?i=${mealRef.idMeal}`);
      const meal = detail?.meals?.[0] || mealRef;
      const ingredients = mealToIngredients(meal);
      if (ingredients.length < 3) {
        report.skipped++;
        return;
      }

      const cuisine = AREA_TO_CUISINE[meal.strArea] || "continental";
      const seed = {
        id,
        name: meal.strMeal,
        nameHi: meal.strMeal,
        mealType: guessMealType(meal.strMeal, meal.strCategory),
        cuisine,
        category: meal.strCategory === "Dessert" ? "snack" : undefined,
        diet: guessDiet(ingredients, meal.strMeal),
        cookTime: 35,
        tags: [meal.strCategory, meal.strArea].filter(Boolean).map((t) => String(t).toLowerCase()),
        source: "themealdb-seed",
        thumbUrl: meal.strMealThumb || undefined,
      };

      if (dryRun) {
        report.imported++;
        return;
      }

      if (premiumUpgrade) {
        const { recipe, quality, imageMeta } = await buildPremiumRecipe(seed, {
          writeImage: true,
          forceImage: true,
          preferRealPhoto: true,
        });
        recipe.reviewStatus = "approved";
        recipe.qualityScore = quality.score;
        saveIntelligenceRecipe(recipe);
        try {
          approveRecipe(recipe.id, "themealdb-import");
        } catch {
          /* already approved */
        }
        upsertRecipe({
          ...recipe,
          thumbUrl: recipe.localImage ? `/api/recipes/image/${recipe.id}` : recipe.thumbUrl,
        });
        if (imageMeta?.source === "premium-hero-real") report.upgraded++;
      } else {
        upsertRecipe(seed);
      }

      existing.add(id);
      report.imported++;
    } catch (err) {
      report.failed++;
      if (report.errors.length < 20) {
        report.errors.push({ id: mealRef.idMeal, name: mealRef.strMeal, error: err.message });
      }
    }
  }

  async function worker() {
    while (cursor < meals.length) {
      const i = cursor++;
      await processOne(meals[i]);
      if (i % 20 === 0) await new Promise((r) => setImmediate(r));
    }
  }

  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, () => worker()));
  logger.info(`TheMealDB import done: ${report.imported} imported, ${report.skipped} skipped, ${report.failed} failed`);
  return report;
}
