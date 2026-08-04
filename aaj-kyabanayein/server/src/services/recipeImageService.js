/**
 * Recipe image pipeline.
 * Priority: premium-hero cache → curated override → recipe.thumbUrl → Wiki/MealDB/Openverse
 * Premium RASOIRA-AI heroes are never overwritten by scrapers.
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
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
import { resolveWikiThumbnailFirst } from "./wikiImageResolver.js";
import { getWikiTitlesForRecipe, getSimilarRecipeId } from "../data/recipeImageCatalog.js";
import { logger } from "../lib/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, "../../data/image-cache");
const META_DIR = path.join(__dirname, "../../data/image-cache-meta");

import { isPremiumThumbUrl } from "../lib/cdnImage.js";

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
  "antonov", "boeing", "airbus", "jet", "aviation",
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

function fileContentHash(filePath) {
  return crypto.createHash("md5").update(fs.readFileSync(filePath)).digest("hex");
}

export function verifyCachedOverrideIntegrity(recipe) {
  const id = recipe?.id;
  const override = getDirectThumbOverride(recipe);
  if (!id || !override) return true;
  const cached = readCachedImage(id);
  if (!cached) return false;
  const meta = readImageMeta(id);
  if (meta?.source !== "curated-thumb" || meta?.originalUrl !== override) return false;
  if (!meta?.contentHash) return false;
  try {
    return fileContentHash(cached) === meta.contentHash;
  } catch {
    return false;
  }
}

/** Ensure curated override image is on disk and bytes match expected download. */
export async function ensureOverrideImageReady(recipe) {
  const id = recipe?.id;
  const override = getDirectThumbOverride(recipe);
  if (!id || !override) return readCachedImage(id);

  const integrityOk = verifyCachedOverrideIntegrity(recipe);
  const audit = hasCachedImage(id) ? auditCachedImage(recipe) : { ok: false };
  if (integrityOk && audit.ok) return readCachedImage(id);

  await cacheImageFromUrl(id, override, "curated-thumb", {
    force: true,
    title: recipe.name || id,
  });
  return readCachedImage(id);
}

export function attachRecipeImageFields(recipe) {
  if (!recipe?.id) return recipe;
  const imageVersion = getImageCacheVersion(recipe.id);
  const imageUrl = recipeImageUrl(recipe.id, imageVersion);
  return { ...recipe, imageVersion, imageUrl, cdnImageUrl: imageUrl };
}

export function imageUrlForRecipe(recipeId) {
  return recipeImageUrl(recipeId);
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
  const escaped = dish.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}s?\\b`, "i").test(name);
}

const MEAT_WORDS_RE = /chicken|mutton|fish|meat|egg|prawn|shrimp|beef|pork|lamb|saltfish|chorizo|trout|camaro|poulet/i;

/** Word-boundary check — avoids false hits like "car" inside "carrots" / "carbonara". */
function blobContainsUnwantedDish(blob, recipeName) {
  const text = (blob || "").toLowerCase();
  for (const dish of WRONG_DISHES) {
    if (recipeWantsDish(recipeName, dish)) continue;
    const escaped = dish.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escaped}s?\\b`, "i").test(text)) return true;
  }
  return false;
}

function recipeMentionsMeat(name = "") {
  return MEAT_WORDS_RE.test(name);
}

function imageBlobMismatchesVegDiet(blob, recipeName) {
  if (recipeMentionsMeat(recipeName)) return false;
  return MEAT_WORDS_RE.test(blob);
}

function isRawOrWrongImage(title = "", url = "", recipeName = "") {
  const blob = `${title} ${url}`.toLowerCase();
  if (RAW_INGREDIENT_PATTERNS.some((re) => re.test(blob))) return true;
  const nameWords = (recipeName || "").toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const t = (title || "").trim().toLowerCase();
  if (GENERIC_TITLES.has(t) && nameWords.length >= 2) return true;
  return blobContainsUnwantedDish(blob, recipeName);
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
  if (blobContainsUnwantedDish(t, name)) score -= 0.9;
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

  // Instant: baked-in thumb from TheMealDB build (skip dummyjson placeholders)
  if (recipe.thumbUrl && isPremiumThumbUrl(recipe.thumbUrl)) {
    return { title: name, imageUrl: recipe.thumbUrl, score: 0.95, source: "thumb-embedded" };
  }

  const curatedTitle = getImageSearchOverride(recipe) ? null : getCuratedWikiTitle(recipe);
  const diet = recipe.diet || [];
  const isVeg = diet.includes("veg") && !diet.includes("non-veg");

  // Premium path: wiki catalog + curated titles (accurate dish photos)
  const wikiTitles = getWikiTitlesForRecipe(recipe);
  if (wikiTitles.length) {
    const wiki = await resolveWikiThumbnailFirst(wikiTitles);
    if (wiki) return { ...wiki, score: 0.92 };
  }
  if (curatedTitle) {
    const wiki = await searchWikipediaSummary(curatedTitle);
    if (wiki) return { ...wiki, score: 0.9 };
  }

  // Kick Groq hints in parallel (don't block other sources)
  const hintsPromise = getAIImageHints(recipe).catch(() => null);

  const searches = [
    searchMealDbThumb(core),
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
      if (isVeg && /chicken|mutton|fish|meat|egg|prawn|shrimp|beef|pork|lamb/i.test(`${c.title || ""} ${c.imageUrl || ""}`)) {
        return false;
      }
      if (blobContainsUnwantedDish(`${c.title || ""} ${c.imageUrl || ""}`, name)) return false;
      return true;
    });

  candidates.sort((a, b) => (b.score || 0) - (a.score || 0));
  if (candidates[0]) return candidates[0];

  // Last resort: Openverse (often generic/low quality)
  const openverse = await searchOpenverseImage(core);
  if (openverse && scoreTitle(openverse.title || "", name, recipe) >= 0.45) {
    return openverse;
  }

  // Last try: Groq wiki title
  const hints = await hintsPromise;
  if (hints?.wikiImageTitle) {
    const wiki = await searchWikipediaSummary(hints.wikiImageTitle);
    if (wiki) return wiki;
  }
  if (hints?.imageSearchQuery) {
    const meal = await searchMealDbThumb(hints.imageSearchQuery);
    if (meal) return meal;
    const open = await searchOpenverseImage(hints.imageSearchQuery);
    if (open) return open;
  }

  return null;
}

async function tryWikiCatalogMatch(recipe) {
  const wikiTitles = getWikiTitlesForRecipe(recipe);
  if (!wikiTitles.length) return null;
  const wiki = await resolveWikiThumbnailFirst(wikiTitles);
  return wiki ? { ...wiki, score: 0.88 } : null;
}

async function saveCachedMatch(id, recipe, match, cached) {
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
}

async function downloadImage(url, dest, retries = 3) {
  let lastErr;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "image/*,*/*",
          Referer: "https://en.wikipedia.org/",
        },
        signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
        redirect: "follow",
      });
      if ((res.status === 424 || res.status === 429) && attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        continue;
      }
      if (!res.ok) throw new Error(`Image download failed: ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 500) throw new Error("Image too small");
      fs.writeFileSync(dest, buf);
      return buf;
    } catch (err) {
      lastErr = err;
      if (attempt < retries - 1) await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }
  }
  throw lastErr;
}

function copyFromSimilarRecipe(recipe) {
  const recipeId = recipe?.id;
  if (!recipeId) return null;
  const similarId = getSimilarRecipeId(recipeId);
  if (!similarId) return null;
  const src = cachePath(similarId);
  const dest = cachePath(recipeId);
  if (!fs.existsSync(src)) return null;
  fs.copyFileSync(src, dest);
  fs.writeFileSync(
    metaPath(recipeId),
    JSON.stringify({
      recipeId,
      recipeName: recipe.name,
      source: "similar-fallback",
      title: recipe.name || similarId,
      originalUrl: similarId,
      score: 0.72,
      fetchedAt: new Date().toISOString(),
    }, null, 2)
  );
  return dest;
}

export async function ensureRecipeImage(recipe, { force = false } = {}) {
  ensureDirs();
  const id = recipe.id;
  if (!id) throw new Error("Recipe id required");

  const cached = cachePath(id);
  const directThumb = getDirectThumbOverride(recipe);
  const metaExisting = readImageMeta(id);
  const isPremium =
    metaExisting?.source === "premium-hero" ||
    metaExisting?.source === "premium-hero-real" ||
    metaExisting?.source === "rasoira-ai-original";

  // Never overwrite premium original heroes unless explicitly regenerating premium
  if (!force && isPremium && fs.existsSync(cached)) {
    return cached;
  }

  if (!force && fs.existsSync(cached)) {
    const audit = auditCachedImage(recipe);
    const meta = metaExisting;
    if (directThumb) {
      const usesOverride =
        meta?.source === "curated-thumb" &&
        meta?.originalUrl === directThumb;
      if (audit.ok && usesOverride) return cached;
      invalidateCachedImage(id);
    } else if (audit.ok) {
      return cached;
    } else {
      invalidateCachedImage(id);
    }
  }

  if (force && fs.existsSync(cached) && !isPremium) {
    invalidateCachedImage(id);
  }
  if (force && isPremium) {
    // Keep premium heroes — scrapers must not replace them
    return cached;
  }

  if (inFlight.has(id)) return inFlight.get(id);

  const promise = enqueueFetch(async () => {
    if (fs.existsSync(cached)) return cached;
    let match = null;
    try {
      match = await withTimeout(findImageUrl(recipe), IMAGE_FETCH_TIMEOUT_MS);
    } catch {
      match = null;
    }

    if (match?.imageUrl) {
      try {
        return await saveCachedMatch(id, recipe, match, cached);
      } catch {
        /* try fallbacks below */
      }
    }

    const wikiMatch = await tryWikiCatalogMatch(recipe);
    if (wikiMatch?.imageUrl) {
      try {
        return await saveCachedMatch(id, recipe, wikiMatch, cached);
      } catch {
        /* try fallbacks below */
      }
    }

    const similar = copyFromSimilarRecipe(recipe);
    if (similar) return similar;

    throw new Error(`No image found for ${recipe.name}`);
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
  // Premium original heroes always pass (RASOIRA-AI licensed, dish-specific)
  if (meta.source === "premium-hero" || meta.source === "premium-hero-real" || meta.source === "rasoira-ai-original") {
    return { ok: true, meta, titleScore: meta.score || 0.99 };
  }
  if (meta.source === "similar-fallback") {
    return { ok: true, meta, titleScore: meta.score || 0.72 };
  }
  const titleScore = scoreTitle(meta.title || "", recipe.name || "");
  if (isRawOrWrongImage(meta.title || "", meta.originalUrl || "", recipe.name || "")) {
    return { ok: false, issue: "raw-or-wrong", meta, titleScore };
  }
  if (titleScore < 0.45) return { ok: false, issue: "low-score", meta, titleScore };
  const diet = recipe.diet || [];
  const isVeg = diet.includes("veg") && !diet.includes("non-veg");
  if (isVeg && imageBlobMismatchesVegDiet(`${meta.title} ${meta.originalUrl}`, recipe.name || "")) {
    return { ok: false, issue: "veg-nonveg-mismatch", meta, titleScore };
  }
  return { ok: true, meta, titleScore };
}

export function warmRecipeImage(recipe) {
  if (!recipe?.id || hasCachedImage(recipe.id)) return;
  ensureRecipeImage(recipe).catch(() => {});
}

export async function cacheImageFromUrl(recipeId, imageUrl, source = "external", { force = false, title = null } = {}) {
  if (!recipeId || !imageUrl) throw new Error("recipeId and imageUrl required");
  if (force) invalidateCachedImage(recipeId);
  if (!force && hasCachedImage(recipeId)) return cachePath(recipeId);
  ensureDirs();
  const dest = cachePath(recipeId);
  await downloadImage(imageUrl, dest);
  const contentHash = fileContentHash(dest);
  fs.writeFileSync(
    metaPath(recipeId),
    JSON.stringify({
      recipeId,
      source,
      title: title || recipeId,
      originalUrl: imageUrl,
      contentHash,
      score: source === "curated-thumb" ? 0.98 : null,
      fetchedAt: new Date().toISOString(),
    }, null, 2)
  );
  return dest;
}

export function getImageCacheVersion(recipeId) {
  const meta = readImageMeta(recipeId);
  if (meta?.fetchedAt) return new Date(meta.fetchedAt).getTime() || 0;
  const file = cachePath(recipeId);
  if (fs.existsSync(file)) {
    try {
      return Math.floor(fs.statSync(file).mtimeMs);
    } catch {
      return 0;
    }
  }
  return 0;
}

export function recipeImageUrl(recipeId, version = null) {
  const v = version ?? getImageCacheVersion(recipeId);
  const base = `/api/recipes/image/${recipeId}`;
  return v ? `${base}?v=${v}` : base;
}

/** Force-download all curated override thumbnails (fixes stale airplane/wrong local cache). */
export async function syncDirectThumbOverrides() {
  const { DIRECT_THUMB_OVERRIDES } = await import("../data/recipeImageOverrides.js");
  const { getRecipeById } = await import("../data/recipes.js");
  let synced = 0;
  for (const [id, url] of Object.entries(DIRECT_THUMB_OVERRIDES)) {
    const recipe = getRecipeById(id);
    try {
      await cacheImageFromUrl(id, url, "curated-thumb", {
        force: true,
        title: recipe?.name || id,
      });
      synced++;
    } catch (err) {
      logger.warn(`Override sync failed ${id}: ${err.message}`);
    }
  }
  return synced;
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

/**
 * Aggressive admin/guardian photo fix — tries overrides, wiki, search, then similar recipe.
 * Returns { ok, file?, source?, error? } after auditCachedImage verification.
 */
export async function forceFixRecipePhoto(recipe) {
  const id = recipe?.id;
  if (!id) return { ok: false, error: "Recipe id required" };

  ensureDirs();
  invalidateCachedImage(id);

  const verify = () => {
    const audit = auditCachedImage(recipe);
    if (!audit.ok) return null;
    return cachePath(id);
  };

  const directThumb = getDirectThumbOverride(recipe);
  if (directThumb) {
    try {
      await cacheImageFromUrl(id, directThumb, "curated-thumb");
      const meta = readImageMeta(id);
      if (meta) {
        meta.title = recipe.name;
        meta.score = 0.98;
        fs.writeFileSync(metaPath(id), JSON.stringify(meta, null, 2));
      }
      const file = verify();
      if (file) return { ok: true, file, source: "curated-thumb" };
    } catch {
      /* try next strategy */
    }
    invalidateCachedImage(id);
  }

  const wikiMatch = await tryWikiCatalogMatch(recipe);
  if (wikiMatch?.imageUrl) {
    try {
      await saveCachedMatch(id, recipe, wikiMatch, cachePath(id));
      const file = verify();
      if (file) return { ok: true, file, source: wikiMatch.source || "wiki-catalog" };
    } catch {
      /* try next strategy */
    }
    invalidateCachedImage(id);
  }

  try {
    const file = await ensureRecipeImage(recipe, { force: true });
    const verified = verify();
    if (verified) return { ok: true, file: verified, source: "search" };
  } catch {
    /* try similar fallback */
  }
  invalidateCachedImage(id);

  const similar = copyFromSimilarRecipe(recipe);
  if (similar) {
    const file = verify();
    if (file) return { ok: true, file, source: "similar-fallback" };
  }

  return { ok: false, error: `No valid image found for ${recipe.name || id}` };
}
