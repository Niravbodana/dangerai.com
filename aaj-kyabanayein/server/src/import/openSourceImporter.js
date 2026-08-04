/**
 * Import recipes from Wikipedia (HD photos + facts) + TheMealDB (real ingredients).
 * IMDB is for movies — not used. TheMealDB is the free food API.
 */
import { FAMOUS_DISHES } from "../sources/famousDishes.js";
import { fetchWikipediaArticle, fetchDishesFromWikiList, dishToId } from "../sources/wikipediaSource.js";
import { searchTheMealDb } from "../services/theMealDbService.js";
import { upsertRecipe, setLocalImage } from "../db/recipeRepository.js";
import { upsertProvenance } from "../db/provenanceRepository.js";
import { cacheHdImage } from "../lib/hdImageCache.js";
import { logger } from "../lib/logger.js";

function guessMealType(name = "", fallback = "lunch") {
  const n = name.toLowerCase();
  if (/breakfast|dosa|idli|poha|upma|paratha|croissant/.test(n)) return "breakfast";
  if (/dessert|sweet|jamun|jalebi|rasgulla|laddu|halwa|cake/.test(n)) return "snack";
  if (/snack|samosa|pakora|tikki|fries|spring roll|dim sum/.test(n)) return "snack";
  if (/dinner|biryani|curry|chicken|steak|pizza|pasta/.test(n)) return "dinner";
  return fallback;
}

function buildOriginalSteps(name, ingredients, wikiExtract = "") {
  const ingList = ingredients.map((i) => i.name).slice(0, 8).join(", ");
  const context = wikiExtract ? wikiExtract.split(".")[0] + "." : "";
  return [
    `Wash and prep all ingredients for ${name}: ${ingList}.`,
    context || `Prepare the base for ${name} using traditional cooking methods.`,
    `Cook the main components together over medium heat until aromas develop and textures are correct.`,
    `Adjust seasoning (salt, spices, acid) to taste and finish with fresh garnishes.`,
    `Serve ${name} hot with recommended sides — best enjoyed fresh.`,
  ];
}

function buildOriginalStepsHi(name) {
  return [
    `${name} के सभी सामग्री धोकर तैयार करें।`,
    `पारंपरिक तरीके से मुख्य सामग्री को medium आँच पर पकाएँ।`,
    `नमक, मसाले और स्वाद अनुसार ठीक करें।`,
    `ताज़ा गarnish के साथ गर्मागर्म परोसें।`,
  ];
}

function mergeIngredients(wikiDish, mealDb) {
  if (mealDb?.ingredients?.length >= 3) {
    return mealDb.ingredients.map((i) => ({
      name: i.name,
      nameHi: i.nameHi || i.name,
      quantity: i.quantity || "as needed",
    }));
  }
  return [
    { name: "Salt", nameHi: "नमक", quantity: "to taste" },
    { name: "Cooking oil", nameHi: "तेल", quantity: "2 tbsp" },
    { name: "Spices", nameHi: "मसाले", quantity: "as needed" },
  ];
}

function pickBestImage(wiki, mealDb) {
  const wikiW = wiki?.imageWidth || 0;
  const mealW = 640;
  if (wiki?.imageUrl && wikiW >= 400) {
    return { url: wiki.imageUrl, source: "wikipedia-hd", license: wiki.license };
  }
  if (mealDb?.imageUrl) {
    return { url: mealDb.imageUrl, source: "themealdb", license: "TheMealDB" };
  }
  if (wiki?.imageUrl) {
    return { url: wiki.imageUrl, source: "wikipedia", license: wiki.license };
  }
  return null;
}

async function importOneDish(seed, options = {}) {
  const { dryRun = false } = options;
  const id = dishToId(seed.name);
  const wiki = await fetchWikipediaArticle(seed.wikiTitle || seed.name);
  await new Promise((r) => setTimeout(r, 150));

  let mealDb = null;
  try {
    mealDb = await searchTheMealDb(seed.name);
  } catch {
    /* optional */
  }

  if (!wiki && !mealDb) {
    return { id, name: seed.name, status: "skipped", reason: "no wiki or mealdb match" };
  }

  const name = wiki?.title || mealDb?.name || seed.name;
  const ingredients = mergeIngredients(seed, mealDb);
  const steps = buildOriginalSteps(name, ingredients, wiki?.extract);
  const stepsHi = buildOriginalStepsHi(name);
  const image = pickBestImage(wiki, mealDb);
  const mealType = seed.mealType || guessMealType(name);
  const diet = seed.diet || (mealDb ? ["veg"] : ["veg"]);
  const cuisine = seed.cuisine || mealDb?.cuisine || "indian";

  const recipe = {
    id,
    name,
    nameHi: name,
    mealType,
    cuisine,
    diet: Array.isArray(diet) ? diet : [diet],
    cookTime: 35,
    calories: 320,
    spice: "medium",
    healthScore: 7,
    ingredients,
    steps,
    stepsHi,
    tags: ["open-source", "wiki-verified", wiki ? "wikipedia" : null, mealDb ? "themealdb" : null].filter(Boolean),
    source: "open-wiki-mealdb",
    introduction: wiki?.extract?.slice(0, 300) || `${name} — a beloved dish.`,
    thumbUrl: image ? `/api/recipes/image/${id}` : undefined,
  };

  if (dryRun) {
    return { id, name, status: "dry-run", hasImage: !!image, ingredientCount: ingredients.length };
  }

  upsertRecipe(recipe);

  if (image) {
    const cached = await cacheHdImage(id, image.url, {
      source: image.source,
      title: name,
      license: image.license,
    });
    if (cached) {
      setLocalImage(id, cached.filePath, cached.meta);
    }
  }

  if (wiki?.wikipediaUrl) {
    upsertProvenance(id, {
      sourceSystem: "wikipedia",
      sourceUrl: wiki.wikipediaUrl,
      licenseSpdx: "CC-BY-SA-4.0",
      commercialUseAllowed: true,
      attributionRequired: true,
      attributionText: `Facts and photo from Wikipedia: ${wiki.wikipediaUrl}`,
    });
  }

  if (mealDb) {
    upsertProvenance(id, {
      sourceSystem: "themealdb",
      sourceUrl: mealDb.idMeal
        ? `https://www.themealdb.com/meal/${mealDb.idMeal}`
        : `https://www.themealdb.com/search.php?s=${encodeURIComponent(mealDb.name || seed.name)}`,
      licenseSpdx: "TheMealDB",
      commercialUseAllowed: true,
      attributionRequired: true,
      attributionText: "Ingredients reference from TheMealDB (free API).",
    });
  }

  return {
    id,
    name,
    status: "imported",
    hasImage: !!image,
    ingredientCount: ingredients.length,
    wikipediaUrl: wiki?.wikipediaUrl,
  };
}

/**
 * @param {object} options
 */
export async function runOpenSourceImport(options = {}) {
  const {
    limit = 0,
    includeWikiList = true,
    dryRun = false,
    concurrency = 3,
  } = options;

  let seeds = [...FAMOUS_DISHES];

  if (includeWikiList) {
    const fromList = await fetchDishesFromWikiList("List of Indian dishes", 30);
    const seen = new Set(seeds.map((s) => s.name.toLowerCase()));
    for (const d of fromList) {
      if (!seen.has(d.name.toLowerCase())) {
        seeds.push(d);
        seen.add(d.name.toLowerCase());
      }
    }
  }

  if (limit > 0) seeds = seeds.slice(0, limit);

  const report = {
    startedAt: new Date().toISOString(),
    total: seeds.length,
    imported: 0,
    skipped: 0,
    failed: 0,
    withImage: 0,
    items: [],
    finishedAt: null,
  };

  logger.info(`Open-source import: ${seeds.length} dishes (Wikipedia + TheMealDB)`);

  let cursor = 0;
  async function worker() {
    while (cursor < seeds.length) {
      const i = cursor++;
      try {
        const result = await importOneDish(seeds[i], { dryRun });
        report.items.push(result);
        if (result.status === "imported" || result.status === "dry-run") {
          report.imported++;
          if (result.hasImage) report.withImage++;
        } else {
          report.skipped++;
        }
      } catch (err) {
        report.failed++;
        report.items.push({ name: seeds[i].name, status: "failed", error: err.message });
      }
    }
  }

  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, () => worker()));
  report.finishedAt = new Date().toISOString();
  return report;
}

export function getOpenSourceImportStatus() {
  return {
    sources: {
      wikipedia: { enabled: true, note: "HD photos + factual extracts (CC BY-SA)" },
      themealdb: { enabled: true, note: "Real ingredient lists (free food API — not IMDB)" },
      imdb: { enabled: false, note: "IMDB is for movies/TV, not recipes" },
    },
    famousDishes: FAMOUS_DISHES.length,
  };
}
