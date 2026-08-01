import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getCuratedWikiTitle } from "../data/curatedRecipeImages.js";
import { isGoogleSearchConfigured, searchGoogleImage } from "./googleSearchService.js";
import { fetchRecipeFromAI, isAIConfigured } from "./aiRecipeService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, "../../data/image-cache");
const META_DIR = path.join(__dirname, "../../data/image-cache-meta");

const USER_AGENT = "RasoiraMealPlanner/1.0 (https://github.com/Niravbodana/dangerai.com)";
const WIKI_DELAY_MS = 800;
const MAX_FETCH_RETRIES = 3;
const IMAGE_FETCH_TIMEOUT_MS = 12000;

const NOISE_WORDS = new Set([
  "home", "dhaba", "restaurant", "traditional", "quick", "special", "classic",
  "royal", "grand", "lite", "authentic", "street", "festive", "comfort",
  "punjabi", "gujarati", "bengali", "maharashtrian", "hyderabadi", "kashmiri",
  "rajasthani", "awadhi", "goan", "chettinad", "mughlai", "sindhi", "odia", "assamese",
  "north", "south", "indian", "veg", "non", "style", "bowl", "plate",
]);

const WRONG_DISHES = ["dosa", "pizza", "burger", "sushi", "taco", "sandwich", "pasta"];

const inFlight = new Map();
const aiHints = new Map();
let lastWikiCall = 0;
let fetchQueue = Promise.resolve();

function enqueueFetch(task) {
  const run = fetchQueue.then(task, task);
  fetchQueue = run.catch(() => {});
  return run;
}

function ensureDirs() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.mkdirSync(META_DIR, { recursive: true });
}

function cachePath(recipeId) {
  return path.join(CACHE_DIR, `${recipeId}.jpg`);
}

function metaPath(recipeId) {
  return path.join(META_DIR, `${recipeId}.json`);
}

export function imageUrlForRecipe(recipeId) {
  return `/api/recipes/image/${recipeId}`;
}

export function hasCachedImage(recipeId) {
  return fs.existsSync(cachePath(recipeId));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function throttleWiki() {
  const wait = WIKI_DELAY_MS - (Date.now() - lastWikiCall);
  if (wait > 0) await sleep(wait);
  lastWikiCall = Date.now();
}

async function fetchJson(url, attempt = 0) {
  await throttleWiki();
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (res.status === 429 && attempt < MAX_FETCH_RETRIES) {
    await sleep(2000 * (attempt + 1));
    return fetchJson(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function cleanSearchTerms(name = "") {
  const words = name
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase());

  const meaningful = words.filter((w) => !NOISE_WORDS.has(w) && w.length > 2);
  if (meaningful.length >= 2) return meaningful.join(" ");
  if (words.length >= 2) return words.slice(-2).join(" ");
  return name.trim();
}

function extractCoreDishName(name = "") {
  const curated = getCuratedWikiTitle({ name });
  if (curated) return curated;
  const clean = cleanSearchTerms(name);
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length <= 3) return clean;
  return words.slice(-3).join(" ");
}

function recipeWantsDish(name = "", dish) {
  return new RegExp(`\\b${dish}\\b`, "i").test(name);
}

function scoreTitle(title, name) {
  const t = title.toLowerCase();
  const core = extractCoreDishName(name).toLowerCase();
  const words = core.split(/\s+/).filter((w) => w.length > 2 && !NOISE_WORDS.has(w));
  if (!words.length) return 0;

  const hits = words.filter((w) => t.includes(w)).length;
  let score = hits / words.length;

  if (t.includes(core)) score += 0.5;

  for (const dish of WRONG_DISHES) {
    if (t.includes(dish) && !recipeWantsDish(name, dish)) {
      score -= 0.85;
    }
  }

  if (words.length >= 2 && hits < Math.ceil(words.length / 2)) score -= 0.35;
  return score;
}

function pickBest(candidates, name) {
  return candidates
    .filter((c) => c?.imageUrl && scoreTitle(c.title || "", name) >= 0.35)
    .sort((a, b) => (b.score ?? scoreTitle(b.title, name)) - (a.score ?? scoreTitle(a.title, name)))[0] || null;
}

async function getAIImageHints(recipe) {
  const key = recipe.id || recipe.name;
  if (aiHints.has(key)) return aiHints.get(key);

  if (!isAIConfigured()) return null;

  try {
    const data = await fetchRecipeFromAI(recipe.name, recipe.cuisine || "indian");
    if (!data) return null;
    const hints = {
      wikiImageTitle: data.wikiImageTitle,
      imageSearchQuery: data.imageSearchQuery || recipe.name,
    };
    aiHints.set(key, hints);
    return hints;
  } catch {
    return null;
  }
}

async function searchWikipediaTitle(title, originalName) {
  const url =
    "https://en.wikipedia.org/w/api.php?action=query&titles=" +
    `${encodeURIComponent(title.replace(/ /g, "_"))}&prop=pageimages` +
    "&piprop=thumbnail&pithumbsize=900&format=json";
  const data = await fetchJson(url);
  const page = Object.values(data.query?.pages || {})[0];
  if (!page || page.missing || !page.thumbnail?.source) return null;
  const score = scoreTitle(page.title, originalName);
  if (score < 0.35) return null;
  return { title: page.title, imageUrl: page.thumbnail.source, score };
}

async function searchWikipedia(query, originalName) {
  const url =
    "https://en.wikipedia.org/w/api.php?action=query&generator=search" +
    `&gsrsearch=${encodeURIComponent(query)}&gsrlimit=8&prop=pageimages` +
    "&piprop=thumbnail&pithumbsize=900&format=json";

  const data = await fetchJson(url);
  const pages = Object.values(data.query?.pages || {})
    .filter((p) => p.thumbnail?.source)
    .map((p) => ({
      title: p.title,
      imageUrl: p.thumbnail.source,
      score: scoreTitle(p.title, originalName),
    }));

  return pickBest(pages, originalName);
}

async function searchWikimediaCommons(query, originalName) {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&generator=search" +
    `&gsrsearch=${encodeURIComponent(query + " food dish")}&gsrlimit=8` +
    "&prop=imageinfo&iiprop=url&iiurlwidth=900&format=json";

  try {
    const data = await fetchJson(url);
    const pages = Object.values(data.query?.pages || {})
      .filter((p) => p.imageinfo?.[0]?.thumburl || p.imageinfo?.[0]?.url)
      .map((p) => {
        const info = p.imageinfo[0];
        const title = p.title?.replace("File:", "").replace(/\.[^.]+$/, "") || "";
        return {
          title,
          imageUrl: info.thumburl || info.url,
          score: scoreTitle(title, originalName) + 0.05,
        };
      });

    return pickBest(pages, originalName);
  } catch {
    return null;
  }
}

async function searchMealDb(name) {
  const url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(name)}`;
  try {
    const data = await fetchJson(url);
    const meal = data.meals?.[0];
    if (!meal?.strMealThumb) return null;
    const score = scoreTitle(meal.strMeal, name);
    if (score < 0.4) return null;
    return { title: meal.strMeal, imageUrl: meal.strMealThumb, score };
  } catch {
    return null;
  }
}

function buildSearchQueries(name, hints) {
  const clean = cleanSearchTerms(name);
  const core = extractCoreDishName(name);
  const queries = new Set([
    hints?.imageSearchQuery,
    hints?.wikiImageTitle,
    name,
    clean,
    core,
    `${core} food`,
    `${core} dish`,
    `${clean} recipe`,
  ]);
  return [...queries].filter(Boolean);
}

async function findImageUrl(recipe) {
  const name = recipe.name || recipe.id || "food";
  const hints = await getAIImageHints(recipe);
  const candidates = [];

  const curatedTitle = getCuratedWikiTitle(recipe);
  if (curatedTitle) {
    const direct = await searchWikipediaTitle(curatedTitle, name);
    if (direct) candidates.push({ ...direct, source: "curated-wikipedia" });
  }

  if (hints?.wikiImageTitle) {
    const geminiWiki = await searchWikipediaTitle(hints.wikiImageTitle, name);
    if (geminiWiki) candidates.push({ ...geminiWiki, source: "ai-wikipedia" });
  }

  if (isGoogleSearchConfigured()) {
    const google = await searchGoogleImage(hints?.imageSearchQuery || extractCoreDishName(name) || name);
    if (google?.imageUrl) {
      candidates.push({
        title: google.title || name,
        imageUrl: google.imageUrl,
        score: 0.9,
        source: "google-images",
      });
    }
  }

  for (const query of buildSearchQueries(name, hints)) {
    const wiki = await searchWikipedia(query, name);
    if (wiki) candidates.push({ ...wiki, source: "wikipedia" });
    if (candidates.some((c) => c.score >= 0.9)) break;
  }

  const commons = await searchWikimediaCommons(hints?.imageSearchQuery || extractCoreDishName(name) || cleanSearchTerms(name), name);
  if (commons) candidates.push({ ...commons, source: "wikimedia-commons" });

  const mealDb = await searchMealDb(extractCoreDishName(name) || cleanSearchTerms(name) || name);
  if (mealDb) candidates.push({ ...mealDb, source: "themealdb" });

  const best = pickBest(candidates, name);
  if (best) return best;

  const cuisine = recipe.cuisine || "indian";
  const cuisineFallbacks = {
    indian: "Indian cuisine",
    "south-indian": "South Indian cuisine",
    "north-indian": "North Indian cuisine",
    chinese: "Chinese cuisine",
    italian: "Italian cuisine",
    thai: "Thai cuisine",
    mexican: "Mexican cuisine",
    continental: "European cuisine",
    healthy: "Salad",
  };
  const fallback = await searchWikipediaTitle(cuisineFallbacks[cuisine] || "Indian cuisine", name);
  return fallback ? { ...fallback, source: "cuisine-fallback", score: 0.2 } : null;
}

async function downloadImage(url, dest) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`Image download failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return buf;
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

export async function ensureRecipeImage(recipe) {
  ensureDirs();
  const id = recipe.id;
  if (!id) throw new Error("Recipe id required");

  const cached = cachePath(id);
  if (fs.existsSync(cached)) return cached;

  if (inFlight.has(id)) return inFlight.get(id);

  const promise = enqueueFetch(async () => {
    const match = await withTimeout(findImageUrl(recipe), IMAGE_FETCH_TIMEOUT_MS);
    if (!match?.imageUrl) throw new Error(`No image found for ${recipe.name}`);

    await downloadImage(match.imageUrl, cached);
    fs.writeFileSync(
      metaPath(id),
      JSON.stringify({
        recipeId: id,
        recipeName: recipe.name,
        source: match.source,
        title: match.title,
        originalUrl: match.imageUrl,
        score: match.score,
        fetchedAt: new Date().toISOString(),
      }, null, 2)
    );
    return cached;
  });

  inFlight.set(id, promise);
  try {
    return await promise;
  } finally {
    inFlight.delete(id);
  }
}

export function readCachedImage(recipeId) {
  const file = cachePath(recipeId);
  return fs.existsSync(file) ? file : null;
}

export function warmRecipeImage(recipe) {
  if (!recipe?.id || hasCachedImage(recipe.id)) return;
  ensureRecipeImage(recipe).catch(() => {});
}

/** Download external image URL into recipe cache (from Google enrichment). */
export async function cacheImageFromUrl(recipeId, imageUrl, source = "external") {
  if (!recipeId || !imageUrl || hasCachedImage(recipeId)) return cachePath(recipeId);
  ensureDirs();
  const dest = cachePath(recipeId);
  await downloadImage(imageUrl, dest);
  fs.writeFileSync(metaPath(recipeId), JSON.stringify({ recipeId, source, originalUrl: imageUrl, fetchedAt: new Date().toISOString() }));
  return dest;
}
