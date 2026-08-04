/**
 * Spoonacular recipe import — requires SPOONACULAR_API_KEY (free tier: 150 pts/day).
 * https://spoonacular.com/food-api
 * Imports metadata + original AI content; images via multi-API HD fetcher.
 */
import { upsertRecipe } from "../db/recipeRepository.js";
import { saveIntelligenceRecipe } from "../intelligence/recipeStore.js";
import { approveRecipe } from "../intelligence/reviewQueue.js";
import { buildPremiumRecipe } from "../premium/premiumRecipeBuilder.js";
import { getDb } from "../db/connection.js";
import { logger } from "../lib/logger.js";

const BASE = "https://api.spoonacular.com";

function getApiKey() {
  return process.env.SPOONACULAR_API_KEY || "";
}

async function fetchJson(path, params = {}) {
  const key = getApiKey();
  if (!key) throw new Error("SPOONACULAR_API_KEY not set");
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("apiKey", key);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Spoonacular ${res.status}`);
  return res.json();
}

function slugify(text = "") {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

/**
 * Import random recipes from Spoonacular by cuisine.
 */
export async function importSpoonacularByCuisine(options = {}) {
  const {
    cuisines = ["indian", "italian", "chinese", "mexican", "thai", "japanese"],
    perCuisine = 50,
    dryRun = false,
  } = options;

  if (!getApiKey()) {
    return { skipped: true, reason: "Set SPOONACULAR_API_KEY in server/.env" };
  }

  const db = getDb();
  const existing = new Set(db.prepare("SELECT id FROM recipes").all().map((r) => r.id));
  const report = { source: "spoonacular", imported: 0, skipped: 0, failed: 0, errors: [] };

  for (const cuisine of cuisines) {
    try {
      const data = await fetchJson("/recipes/complexSearch", {
        cuisine,
        number: perCuisine,
        addRecipeInformation: true,
        fillIngredients: true,
      });

      for (const item of data.results || []) {
        const id = `spoon-${item.id}`;
        if (existing.has(id)) {
          report.skipped++;
          continue;
        }

        const ingredients = (item.extendedIngredients || []).map((ing) => ({
          name: ing.name || ing.originalName,
          nameHi: ing.name || ing.originalName,
          quantity: ing.original || `${ing.amount || ""} ${ing.unit || ""}`.trim(),
        }));

        if (ingredients.length < 3) continue;

        const seed = {
          id,
          name: item.title,
          nameHi: item.title,
          mealType: /breakfast|brunch/.test(item.dishTypes?.join(" ") || "") ? "breakfast" : "lunch",
          cuisine: cuisine === "indian" ? "indian" : cuisine,
          diet: item.vegetarian ? ["vegetarian", "veg"] : ["non-vegetarian", "non-veg"],
          cookTime: item.readyInMinutes || 30,
          calories: Math.round(item.nutrition?.nutrients?.find((n) => n.name === "Calories")?.amount || 300),
          tags: [...(item.dishTypes || []), cuisine],
          source: "spoonacular-seed",
          thumbUrl: item.image || undefined,
        };

        if (dryRun) {
          report.imported++;
          continue;
        }

        try {
          const { recipe, quality } = await buildPremiumRecipe(seed, {
            writeImage: true,
            forceImage: true,
            preferRealPhoto: true,
          });
          recipe.reviewStatus = "approved";
          recipe.qualityScore = quality.score;
          saveIntelligenceRecipe(recipe);
          try {
            approveRecipe(recipe.id, "spoonacular-import");
          } catch {
            /* ok */
          }
          upsertRecipe(recipe);
          existing.add(id);
          report.imported++;
        } catch (err) {
          report.failed++;
          if (report.errors.length < 15) report.errors.push({ id, error: err.message });
        }

        await new Promise((r) => setTimeout(r, 200));
      }
    } catch (err) {
      logger.warn(`Spoonacular ${cuisine}: ${err.message}`);
      report.errors.push({ cuisine, error: err.message });
    }
  }

  return report;
}
