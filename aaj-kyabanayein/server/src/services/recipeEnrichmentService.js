import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getCuratedWikiTitle } from "../data/curatedRecipeImages.js";
import { buildIngredients, buildStepsEn, buildStepsHi } from "../data/recipeTemplates.js";
import { searchGoogleImage, searchGoogleRecipeData, isGoogleSearchConfigured } from "./googleSearchService.js";
import { fetchRecipeFromAI, getAIProviderStatus, isAIConfigured } from "./aiRecipeService.js";
import { searchTheMealDb } from "./theMealDbService.js";
import { ensureRecipeImage, hasCachedImage, cacheImageFromUrl } from "./recipeImageService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, "../../data/enriched-cache");

const enrichInFlight = new Map();

function ensureCacheDir() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function cachePath(recipeId) {
  return path.join(CACHE_DIR, `${recipeId}.json`);
}

function readCache(recipeId) {
  const file = cachePath(recipeId);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return null;
  }
}

function writeCache(recipeId, data) {
  ensureCacheDir();
  fs.writeFileSync(cachePath(recipeId), JSON.stringify(data, null, 2));
}

function cleanRecipeName(name = "") {
  return name
    .replace(/\b(home|dhaba|restaurant|traditional|quick|special|classic|royal|grand|lite|authentic|street|festive|comfort)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function needsEnrichment(recipe) {
  const ingCount = recipe.ingredients?.length || 0;
  const hasSteps = (recipe.steps?.length || 0) >= 5 || (recipe.stepsHi?.length || 0) >= 5;
  const genericSteps = /prepare all ingredients|cook following traditional/i.test((recipe.steps || []).join(" "));
  return ingCount < 8 || !hasSteps || genericSteps;
}

function mergeIngredients(existing, incoming) {
  const merged = [...(existing || [])];
  const seen = new Set(merged.map((i) => i.name.toLowerCase()));
  for (const ing of incoming || []) {
    const key = ing.name.toLowerCase();
    if (!seen.has(key)) {
      merged.push(ing);
      seen.add(key);
    }
  }
  return merged;
}

async function fetchWikiThumb(title, size = 480) {
  if (!title) return null;
  const url =
    "https://en.wikipedia.org/w/api.php?action=query&titles=" +
    `${encodeURIComponent(title.replace(/ /g, "_"))}&prop=pageimages` +
    `&piprop=thumbnail&pithumbsize=${size}&format=json`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "RasoiraMealPlanner/1.0" } });
    if (!res.ok) return null;
    const data = await res.json();
    const page = Object.values(data.query?.pages || {})[0];
    return page?.thumbnail?.source || null;
  } catch {
    return null;
  }
}

async function fetchFromWeb(recipe) {
  const searchName = cleanRecipeName(recipe.name) || recipe.name;
  const results = [];

  // 1. Groq (fast) → Gemini fallback
  if (isAIConfigured()) {
    const ai = await fetchRecipeFromAI(searchName, recipe.cuisine || "indian");
    if (ai) {
      results.push(ai);
      const thumb = await fetchWikiThumb(ai.wikiImageTitle, 480);
      if (thumb) results.push({ source: `${ai.source}-wiki`, imageUrl: thumb });
    }
  }

  // 2. Google Custom Search (if CSE ID also configured)
  if (isGoogleSearchConfigured()) {
    const [googleData, googleImage] = await Promise.all([
      searchGoogleRecipeData(searchName),
      searchGoogleImage(searchName),
    ]);
    if (googleData) results.push(googleData);
    if (googleImage) results.push(googleImage);
  }

  // 3. TheMealDB (free fallback)
  const mealDb = await searchTheMealDb(searchName);
  if (mealDb) results.push(mealDb);

  return results;
}

function applyWebResults(recipe, webResults) {
  let ingredients = recipe.ingredients || [];
  let steps = recipe.steps;
  let stepsHi = recipe.stepsHi;
  let imageUrl = null;
  const sources = [];

  for (const r of webResults) {
    sources.push(r.source);
    if (r.ingredients?.length) {
      // Prefer richer ingredient lists from AI/web sources
      if (r.ingredients.length >= ingredients.length) {
        ingredients = mergeIngredients([], r.ingredients);
      } else {
        ingredients = mergeIngredients(ingredients, r.ingredients);
      }
    }
    if (r.steps?.length && (!steps || steps.length < r.steps.length)) {
      steps = r.steps;
    }
    if (r.stepsHi?.length && (!stepsHi || stepsHi.length < r.stepsHi.length)) {
      stepsHi = r.stepsHi;
    }
    if (r.imageUrl && !imageUrl) imageUrl = r.imageUrl;
  }

  // Template fallback only when still very thin
  if (ingredients.length < 6 && ingredients[0]) {
    const isNonVeg = recipe.diet?.includes("non-veg");
    const styleMatch = (recipe.name || "").match(
      /(Curry|Fry|Sabzi|Pulao|Masala|Tikka|Korma|Bharta|Soup|Paratha|Khichdi|Raita)/i
    );
    const style = styleMatch ? styleMatch[1] : "Curry";
    ingredients = buildIngredients(ingredients[0], style, isNonVeg);
  }

  if (!steps?.length && ingredients[0]) {
    const isNonVeg = recipe.diet?.includes("non-veg");
    const styleMatch = (recipe.name || "").match(
      /(Curry|Fry|Sabzi|Pulao|Masala|Tikka|Korma|Bharta|Soup|Paratha|Khichdi|Raita)/i
    );
    const style = styleMatch ? styleMatch[1] : "Curry";
    steps = buildStepsEn(ingredients[0].name, style, isNonVeg);
    stepsHi = buildStepsHi(ingredients[0].nameHi || ingredients[0].name, style);
  }

  return { ingredients, steps, stepsHi, imageUrl, sources };
}

async function downloadAndCacheImage(recipe, imageUrl) {
  if (!imageUrl || hasCachedImage(recipe.id)) return;
  try {
    await cacheImageFromUrl(recipe.id, imageUrl, "google-enrichment");
  } catch {
    await ensureRecipeImage(recipe).catch(() => {});
  }
}

async function runEnrichment(recipe) {
  const cached = readCache(recipe.id);
  if (cached && !needsEnrichment({ ...recipe, ...cached })) {
    return { ...recipe, ...cached, enriched: true };
  }

  const webResults = await fetchFromWeb(recipe);
  const applied = applyWebResults(recipe, webResults);

  // Cache image: Google URL first, else Wikipedia curated pipeline
  if (applied.imageUrl) {
    await downloadAndCacheImage(recipe, applied.imageUrl);
  } else if (!hasCachedImage(recipe.id)) {
    const curated = getCuratedWikiTitle(recipe);
    await ensureRecipeImage({ ...recipe, name: curated || cleanRecipeName(recipe.name) || recipe.name }).catch(() => {});
  }

  const enriched = {
    ingredients: applied.ingredients,
    steps: applied.steps,
    stepsHi: applied.stepsHi,
    enriched: true,
    enrichedAt: new Date().toISOString(),
    enrichmentSources: applied.sources,
    googleEnabled: isAIConfigured() || isGoogleSearchConfigured(),
  };

  writeCache(recipe.id, enriched);
  return { ...recipe, ...enriched };
}

/**
 * Get recipe with web-enriched ingredients, steps, and cached photo.
 * Runs once per recipe, then serves from cache.
 */
export async function getEnrichedRecipe(recipe, { force = false } = {}) {
  if (!recipe) return null;
  if (!force && !needsEnrichment(recipe)) {
    const cached = readCache(recipe.id);
    return cached ? { ...recipe, ...cached } : recipe;
  }

  if (!force) {
    const cached = readCache(recipe.id);
    if (cached?.enriched) return { ...recipe, ...cached };
  }

  if (enrichInFlight.has(recipe.id)) {
    return enrichInFlight.get(recipe.id);
  }

  const promise = runEnrichment(recipe);
  enrichInFlight.set(recipe.id, promise);
  try {
    return await promise;
  } finally {
    enrichInFlight.delete(recipe.id);
  }
}

export function getEnrichmentStatus() {
  const ai = getAIProviderStatus();
  return {
    ...ai,
    googleSearch: isGoogleSearchConfigured(),
    cacheDir: CACHE_DIR,
  };
}

/** Return cached recipe instantly; enrich in background if needed. */
export function getCachedRecipeOverlay(recipe) {
  const cached = readCache(recipe.id);
  return cached ? { ...recipe, ...cached } : recipe;
}

export function enrichRecipeInBackground(recipe) {
  if (readCache(recipe.id)?.enriched) return;
  if (enrichInFlight.has(recipe.id)) return;
  getEnrichedRecipe(recipe).catch(() => {});
}

export function isRecipeEnriched(recipeId) {
  return Boolean(readCache(recipeId)?.enriched);
}
