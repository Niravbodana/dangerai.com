import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getCuratedWikiTitle } from "../data/curatedRecipeImages.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, "../../data/image-cache");
const META_DIR = path.join(__dirname, "../../data/image-cache-meta");

const USER_AGENT = "RasoiraMealPlanner/1.0 (https://github.com/Niravbodana/dangerai.com)";
const WIKI_DELAY_MS = 1200;
const MAX_FETCH_RETRIES = 4;

const NOISE_WORDS = new Set([
  "home", "dhaba", "restaurant", "traditional", "quick", "special", "classic",
  "royal", "grand", "lite", "authentic", "street", "festive", "comfort",
  "punjabi", "gujarati", "bengali", "maharashtrian", "hyderabadi", "kashmiri",
  "rajasthani", "awadhi", "goan", "chettinad", "mughlai", "sindhi", "odia", "assamese",
  "north", "south", "indian", "veg", "non", "style", "bowl", "plate",
]);

const inFlight = new Map();
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
    const backoff = 2000 * (attempt + 1);
    await sleep(backoff);
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

function scoreTitle(title, name) {
  const t = title.toLowerCase();
  const core = extractCoreDishName(name).toLowerCase();
  const words = core.split(/\s+/).filter((w) => w.length > 2 && !NOISE_WORDS.has(w));
  if (!words.length) return 0;

  const hits = words.filter((w) => t.includes(w)).length;
  let score = hits / words.length;

  if (t.includes(core)) score += 0.5;
  if (/(food|dish|cuisine|recipe|curry|biryani|paratha|khichdi|thali)/.test(t)) score += 0.1;

  // Penalize unrelated popular dishes when query doesn't match
  const unrelated = ["dosa", "pizza", "burger", "sushi", "taco"];
  for (const dish of unrelated) {
    if (t.includes(dish) && !core.includes(dish) && !name.toLowerCase().includes(dish)) {
      score -= 0.4;
    }
  }

  if (words.length >= 2 && hits < words.length) score -= 0.15;
  return score;
}

async function searchWikipediaTitle(title) {
  const url =
    "https://en.wikipedia.org/w/api.php?action=query&titles=" +
    `${encodeURIComponent(title.replace(/ /g, "_"))}&prop=pageimages` +
    "&piprop=thumbnail&pithumbsize=900&format=json";
  const data = await fetchJson(url);
  const page = Object.values(data.query?.pages || {})[0];
  if (!page || page.missing || !page.thumbnail?.source) return null;
  return { title: page.title, imageUrl: page.thumbnail.source, score: 1 };
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
    }))
    .sort((a, b) => b.score - a.score);

  return pages[0]?.score >= 0.45 ? pages[0] : null;
}

async function searchWikimediaCommons(query, originalName) {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&generator=search" +
    `&gsrsearch=${encodeURIComponent(query + " food dish")}&gsrlimit=6` +
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
      })
      .sort((a, b) => b.score - a.score);

    return pages[0]?.score >= 0.4 ? pages[0] : null;
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
    return {
      title: meal.strMeal,
      imageUrl: meal.strMealThumb,
      score: scoreTitle(meal.strMeal, name),
    };
  } catch {
    return null;
  }
}

function buildSearchQueries(name) {
  const clean = cleanSearchTerms(name);
  const core = extractCoreDishName(name);
  const queries = new Set([
    name,
    clean,
    core,
    `${core} food`,
    `${core} dish`,
    `${clean} food`,
    `${clean} indian food`,
  ]);

  const lower = name.toLowerCase();
  if (lower.includes("dal") && lower.includes("chawal")) {
    queries.add("dal chawal");
    queries.add("dal bhat");
  }
  if (lower.includes("khichdi")) queries.add("khichdi");
  if (lower.includes("paratha")) queries.add("paratha");
  if (lower.includes("roti")) queries.add("roti chapati");
  if (lower.includes("paneer")) queries.add("paneer curry");
  if (lower.includes("chicken")) queries.add("chicken curry indian");

  return [...queries].filter(Boolean);
}

async function findImageUrl(recipe) {
  const name = recipe.name || recipe.id || "indian food";
  let best = null;

  // 1. Curated Wikipedia title (highest priority)
  const curatedTitle = getCuratedWikiTitle(recipe);
  if (curatedTitle) {
    const direct = await searchWikipediaTitle(curatedTitle);
    if (direct) {
      best = { ...direct, source: "curated-wikipedia", score: 1.2 };
    }
  }

  // 2. Direct Wikipedia title guesses from core dish name
  const titleGuesses = [
    extractCoreDishName(name),
    cleanSearchTerms(name),
    `${extractCoreDishName(name)} (food)`,
  ];

  for (const title of [...new Set(titleGuesses)]) {
    if (!title) continue;
    const direct = await searchWikipediaTitle(title);
    if (direct) {
      const scored = { ...direct, score: scoreTitle(direct.title, name) + 0.3 };
      if (!best || scored.score > best.score) {
        best = { ...scored, source: "wikipedia-title" };
      }
    }
  }

  // 3. Wikipedia search
  for (const query of buildSearchQueries(name)) {
    const wiki = await searchWikipedia(query, name);
    if (wiki && (!best || wiki.score > best.score)) {
      best = { ...wiki, source: "wikipedia" };
    }
    if (best?.score >= 0.95) break;
  }

  // 4. Wikimedia Commons
  if (!best || best.score < 0.7) {
    const commons = await searchWikimediaCommons(extractCoreDishName(name) || cleanSearchTerms(name), name);
    if (commons && (!best || commons.score > best.score)) {
      best = { ...commons, source: "wikimedia-commons" };
    }
  }

  // 5. TheMealDB fallback
  if (!best || best.score < 0.6) {
    const mealDb = await searchMealDb(extractCoreDishName(name) || cleanSearchTerms(name) || name);
    if (mealDb && (!best || mealDb.score > best.score)) {
      best = { ...mealDb, source: "themealdb" };
    }
  }

  // 6. Cuisine-level fallback (never default to dosa)
  if (!best) {
    const cuisine = recipe.cuisine || "indian";
    const cuisineFallbacks = {
      indian: "Indian cuisine",
      "south-indian": "South Indian cuisine",
      "north-indian": "North Indian cuisine",
      chinese: "Chinese cuisine",
      italian: "Italian cuisine",
      korean: "Korean cuisine",
      thai: "Thai cuisine",
      mexican: "Mexican cuisine",
      continental: "European cuisine",
      healthy: "Vegetarian cuisine",
    };
    const fallbackTitle = cuisineFallbacks[cuisine] || "Indian cuisine";
    const fallback = await searchWikipediaTitle(fallbackTitle);
    if (fallback) best = { ...fallback, source: "cuisine-fallback", score: 0.3 };
  }

  return best;
}

async function downloadImage(url, dest) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`Image download failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return buf;
}

export async function ensureRecipeImage(recipe) {
  ensureDirs();
  const id = recipe.id;
  if (!id) throw new Error("Recipe id required");

  const cached = cachePath(id);
  if (fs.existsSync(cached)) return cached;

  if (inFlight.has(id)) return inFlight.get(id);

  const promise = enqueueFetch(async () => {
    const match = await findImageUrl(recipe);
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

/** Queue a background image fetch (rate-limited, non-blocking). */
export function warmRecipeImage(recipe) {
  if (!recipe?.id || hasCachedImage(recipe.id)) return;
  ensureRecipeImage(recipe).catch(() => {});
}
