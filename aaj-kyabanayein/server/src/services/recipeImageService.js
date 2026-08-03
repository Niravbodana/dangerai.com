/**
 * Fast recipe image pipeline.
 * Priority: cache → recipe.thumbUrl → MealDB/Openverse/Wiki (parallel) → Groq hint → Google CSE
 * Low quality OK — speed first.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getCuratedWikiTitle } from "../data/curatedRecipeImages.js";
import { getDirectThumbOverride, getImageSearchOverride } from "../data/recipeImageOverrides.js";
import { isGoogleSearchConfigured, searchGoogleImage } from "./googleSearchService.js";
import { fetchRecipeFromAI, isAIConfigured } from "./aiRecipeService.js";
import {
  searchMealDbThumb,
  searchOpenverseImage,
  searchWikipediaSummary,
} from "./fastImageSearch.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, "../../data/image-cache");
const META_DIR = path.join(__dirname, "../../data/image-cache-meta");

import { resolveRecipeImageUrl } from "../lib/cdnImage.js";

const USER_AGENT = "RasoiraMealPlanner/1.0 (https://github.com/Niravbodana/dangerai.com)";
const IMAGE_FETCH_TIMEOUT_MS = 7000;
const DOWNLOAD_TIMEOUT_MS = 6000;

const NOISE_WORDS = new Set([
  "home", "dhaba", "restaurant", "traditional", "quick", "special", "classic",
  "royal", "grand", "lite", "authentic", "street", "festive", "comfort",
  "punjabi", "gujarati", "bengali", "maharashtrian", "hyderabadi", "kashmiri",
  "north", "south", "indian", "veg", "non", "style",
]);

const WRONG_DISHES = [
  "dosa", "pizza", "burger", "sushi", "taco", "sandwich",
  "airplane", "aircraft", "plane", "helicopter", "car", "train",
];

const RAW_INGREDIENT_PATTERNS = [
  /types of lentil/i,
  /raw lentil/i,
  /fresh cheese/i,
  /paneer.*fresh/i,
  /cheese_fresh/i,
  /lentil\.png/i,
  /uncooked/i,
  /ingredient/i,
  /flattened rice$/i,
];

const GENERIC_TITLES = new Set([
  "dal", "paneer", "rice", "curry", "lentil", "cheese", "bread", "food", "indian cuisine",
]);

const inFlight = new Map();
const aiHints = new Map();
let fetchQueue = Promise.resolve();
let activeFetches = 0;
const MAX_PARALLEL = 4;

function enqueueFetch(task) {
  const run = async () => {
    while (activeFetches >= MAX_PARALLEL) {
      await new Promise((r) => setTimeout(r, 80));
    }
    activeFetches++;
    try {
      return await task();
    } finally {
      activeFetches--;
    }
  };
  const p = fetchQueue.then(run, run);
  fetchQueue = p.catch(() => {});
  return p;
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

function cleanSearchTerms(name = "") {
  const words = name
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase())
    .filter((w) => !NOISE_WORDS.has(w) && w.length > 2);
  return words.join(" ") || name.trim();
}

function extractCoreDishName(name = "", recipe = null) {
  const override = recipe ? getImageSearchOverride(recipe) : null;
  if (override) return override;
  const curated = getCuratedWikiTitle(recipe || { name });
  if (curated) return curated;
  const clean = cleanSearchTerms(name);
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length <= 3) return clean;
  return words.slice(-3).join(" ");
}

function recipeWantsDish(name = "", dish) {
  return new RegExp(`\\b${dish}\\b`, "i").test(name);
}

function isRawOrWrongImage(title = "", url = "", recipeName = "") {
  const blob = `${title} ${url}`.toLowerCase();
  if (RAW_INGREDIENT_PATTERNS.some((re) => re.test(blob))) return true;
  const nameWords = (recipeName || "").toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const t = (title || "").trim().toLowerCase();
  if (GENERIC_TITLES.has(t) && nameWords.length >= 2) return true;
  for (const dish of WRONG_DISHES) {
    if (blob.includes(dish) && !recipeWantsDish(recipeName, dish)) return true;
  }
  return false;
}

function scoreTitle(title, name, recipe = null) {
  const t = (title || "").toLowerCase();
  const core = extractCoreDishName(name, recipe).toLowerCase();
  const words = core.split(/\s+/).filter((w) => w.length > 2);
  if (!words.length) return 0.3;
  if (isRawOrWrongImage(title, "", name)) return 0;
  const hits = words.filter((w) => t.includes(w)).length;
  let score = hits / words.length;
  if (t.includes(core)) score += 0.4;
  if (GENERIC_TITLES.has(t.trim()) && words.length >= 2) score -= 0.8;
  for (const dish of WRONG_DISHES) {
    if (t.includes(dish) && !recipeWantsDish(name, dish)) score -= 0.9;
  }
  return score;
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
      imageSearchQuery: data.imageSearchQuery || cleanSearchTerms(recipe.name),
    };
    aiHints.set(key, hints);
    return hints;
  } catch {
    return null;
  }
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

/**
 * Parallel fast search — first good match wins path.
 * Order of preference via score after all settle (with short timeout).
 */
async function findImageUrl(recipe) {
  const name = recipe.name || recipe.id || "food";
  const core = extractCoreDishName(name, recipe) || cleanSearchTerms(name) || name;

  const directThumb = getDirectThumbOverride(recipe);
  if (directThumb) {
    return { title: name, imageUrl: directThumb, score: 0.98, source: "curated-thumb" };
  }

  // Instant: baked-in thumb from TheMealDB build
  if (recipe.thumbUrl) {
    return { title: name, imageUrl: recipe.thumbUrl, score: 0.95, source: "thumb-embedded" };
  }

  const curatedTitle = getImageSearchOverride(recipe) ? null : getCuratedWikiTitle(recipe);

  // Kick Groq hints in parallel (don't block other sources)
  const hintsPromise = getAIImageHints(recipe).catch(() => null);

  const searches = [
    searchMealDbThumb(core),
    searchOpenverseImage(core),
    curatedTitle ? searchWikipediaSummary(curatedTitle) : Promise.resolve(null),
    searchWikipediaSummary(core),
  ];

  if (isGoogleSearchConfigured()) {
    searches.push(
      searchGoogleImage(core).then((g) =>
        g?.imageUrl ? { ...g, score: 0.9 } : null
      )
    );
  }

  const settled = await Promise.allSettled(
    searches.map((p) => withTimeout(p, 4500).catch(() => null))
  );

  const candidates = settled
    .map((r) => (r.status === "fulfilled" ? r.value : null))
    .filter((c) => c?.imageUrl)
    .map((c) => ({
      ...c,
      score: (c.score || 0.5) + scoreTitle(c.title || "", name, recipe) * 0.3,
    }))
    .filter((c) => {
      const titleScore = scoreTitle(c.title || "", name, recipe);
      if (c.source === "thumb-embedded" || c.source === "curated-thumb") return true;
      if (titleScore < 0.45) return false;
      if (isRawOrWrongImage(c.title || "", c.imageUrl || "", name)) return false;
      for (const dish of WRONG_DISHES) {
        if ((c.title || "").toLowerCase().includes(dish) && !recipeWantsDish(name, dish)) return false;
      }
      return true;
    });

  candidates.sort((a, b) => (b.score || 0) - (a.score || 0));
  if (candidates[0]) return candidates[0];

  // Last try: Groq wiki title
  const hints = await hintsPromise;
  if (hints?.wikiImageTitle) {
    const wiki = await searchWikipediaSummary(hints.wikiImageTitle);
    if (wiki) return wiki;
  }
  if (hints?.imageSearchQuery) {
    const open = await searchOpenverseImage(hints.imageSearchQuery);
    if (open) return open;
    const meal = await searchMealDbThumb(hints.imageSearchQuery);
    if (meal) return meal;
  }

  return null;
}

async function downloadImage(url, dest) {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Image download failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  // Skip huge files — keep list fast
  if (buf.length > 2_500_000) {
    // still save but ok
  }
  fs.writeFileSync(dest, buf);
  return buf;
}

export async function ensureRecipeImage(recipe, { force = false } = {}) {
  ensureDirs();
  const id = recipe.id;
  if (!id) throw new Error("Recipe id required");

  const cached = cachePath(id);
  if (!force && fs.existsSync(cached)) return cached;

  if (force && fs.existsSync(cached)) {
    fs.unlinkSync(cached);
    if (fs.existsSync(metaPath(id))) fs.unlinkSync(metaPath(id));
  }

  if (inFlight.has(id)) return inFlight.get(id);

  const promise = enqueueFetch(async () => {
    if (fs.existsSync(cached)) return cached;
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

export function invalidateCachedImage(recipeId) {
  const file = cachePath(recipeId);
  const meta = metaPath(recipeId);
  if (fs.existsSync(file)) fs.unlinkSync(file);
  if (fs.existsSync(meta)) fs.unlinkSync(meta);
}

export function readImageMeta(recipeId) {
  const meta = metaPath(recipeId);
  if (!fs.existsSync(meta)) return null;
  return JSON.parse(fs.readFileSync(meta, "utf-8"));
}

export function auditCachedImage(recipe) {
  const meta = readImageMeta(recipe.id);
  if (!meta) return { ok: false, issue: "missing-cache" };
  const titleScore = scoreTitle(meta.title || "", recipe.name || "");
  if (isRawOrWrongImage(meta.title || "", meta.originalUrl || "", recipe.name || "")) {
    return { ok: false, issue: "raw-or-wrong", meta, titleScore };
  }
  if (titleScore < 0.45) return { ok: false, issue: "low-score", meta, titleScore };
  const diet = recipe.diet || [];
  const isVeg = diet.includes("veg") && !diet.includes("non-veg");
  if (isVeg && /chicken|mutton|fish|meat|egg|prawn/i.test(`${meta.title} ${meta.originalUrl}`)) {
    return { ok: false, issue: "veg-nonveg-mismatch", meta, titleScore };
  }
  return { ok: true, meta, titleScore };
}

export function warmRecipeImage(recipe) {
  if (!recipe?.id || hasCachedImage(recipe.id)) return;
  ensureRecipeImage(recipe).catch(() => {});
}

export async function cacheImageFromUrl(recipeId, imageUrl, source = "external") {
  if (!recipeId || !imageUrl || hasCachedImage(recipeId)) return cachePath(recipeId);
  ensureDirs();
  const dest = cachePath(recipeId);
  await downloadImage(imageUrl, dest);
  fs.writeFileSync(
    metaPath(recipeId),
    JSON.stringify({ recipeId, source, originalUrl: imageUrl, fetchedAt: new Date().toISOString() })
  );
  return dest;
}

/** Prefer CDN, then external thumb, then API route */
export function getRecipeThumbHint(recipe) {
  if (!recipe) return null;
  return resolveRecipeImageUrl(recipe);
}

export function warmTrendingRecipeImages(getTrendingFn, limit = 16) {
  try {
    const trending = getTrendingFn(limit);
    for (const entry of trending) {
      const recipe = entry.id ? entry : { id: entry };
      warmRecipeImage(recipe);
    }
  } catch {
    /* ignore warm failures */
  }
}
