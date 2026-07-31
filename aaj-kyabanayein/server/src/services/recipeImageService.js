import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, "../../data/image-cache");
const META_DIR = path.join(__dirname, "../../data/image-cache-meta");

const USER_AGENT = "RasoiraMealPlanner/1.0 (https://github.com/Niravbodana/dangerai.com)";
const WIKI_DELAY_MS = 350;

const NOISE_WORDS = new Set([
  "home", "dhaba", "restaurant", "traditional", "quick", "special", "classic",
  "royal", "grand", "lite", "authentic", "street", "festive", "comfort",
  "punjabi", "gujarati", "bengali", "maharashtrian", "hyderabadi", "kashmiri",
  "rajasthani", "awadhi", "goan", "chettinad", "mughlai", "sindhi", "odia", "assamese",
  "north", "south", "indian", "veg", "non", "style", "bowl", "plate",
]);

const inFlight = new Map();
let lastWikiCall = 0;

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

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
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

function scoreTitle(title, name) {
  const t = title.toLowerCase();
  const words = name.toLowerCase().split(/\s+/).filter((w) => w.length > 2 && !NOISE_WORDS.has(w));
  if (!words.length) return 0;
  const hits = words.filter((w) => t.includes(w)).length;
  const ratio = hits / words.length;
  let score = ratio;
  if (t.includes(name.toLowerCase())) score += 0.5;
  if (/(food|dish|cuisine|recipe|curry|biryani|dosa|paratha|khichdi|thali)/.test(t)) score += 0.15;
  if (words.length >= 2 && hits < words.length) score -= 0.2;
  return score;
}

async function searchWikipediaTitle(title) {
  await throttleWiki();
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
  await throttleWiki();
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

  return pages[0]?.score >= 0.4 ? pages[0] : null;
}

async function searchMealDb(name) {
  const url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(name)}`;
  const data = await fetchJson(url);
  const meal = data.meals?.[0];
  if (!meal?.strMealThumb) return null;
  return {
    title: meal.strMeal,
    imageUrl: meal.strMealThumb,
    score: scoreTitle(meal.strMeal, name),
  };
}

function buildSearchQueries(name) {
  const clean = cleanSearchTerms(name);
  const lower = name.toLowerCase();
  const queries = new Set([
    name,
    clean,
    `${clean} food`,
    `${clean} dish`,
    `${clean} indian food`,
    `${name} food`,
  ]);

  if (lower.includes("dal") && lower.includes("chawal")) {
    queries.add("dal chawal");
    queries.add("dal bhat");
    queries.add("dal rice indian");
  }
  if (lower.includes("khichdi")) {
    queries.add("khichdi");
    queries.add("khichdi indian food");
  }
  if (lower.includes("paratha")) {
    queries.add("paratha");
    queries.add("aloo paratha");
    queries.add("paratha indian food");
  }
  if (lower.includes("roti")) {
    queries.add("roti");
    queries.add("chapati");
    queries.add("indian flatbread");
  }
  if (lower.includes("paneer")) {
    queries.add("paneer curry");
    queries.add("paneer masala");
  }
  if (lower.includes("chicken")) queries.add("chicken curry indian");

  return [...queries].filter(Boolean);
}

async function findImageUrl(recipe) {
  const name = recipe.name || recipe.id || "indian food";
  let best = null;

  const titleGuesses = [
    name,
    name.replace(/\s+/g, " "),
    `${name} (food)`,
    cleanSearchTerms(name),
  ];
  if (name.toLowerCase().includes("dal") && name.toLowerCase().includes("chawal")) {
    titleGuesses.unshift("Dal bhat", "Khichdi", "Dal");
  }
  if (name.toLowerCase().includes("khichdi")) titleGuesses.unshift("Khichdi");
  if (name.toLowerCase().includes("paratha")) titleGuesses.unshift("Paratha", "Aloo paratha");
  if (name.toLowerCase().includes("roti")) titleGuesses.unshift("Roti", "Chapati");

  for (const title of [...new Set(titleGuesses)]) {
    const direct = await searchWikipediaTitle(title);
    if (direct && (!best || direct.score > best.score)) {
      best = { ...direct, source: "wikipedia-title" };
    }
  }

  for (const query of buildSearchQueries(name)) {
    const wiki = await searchWikipedia(query, name);
    if (wiki && (!best || wiki.score > best.score)) best = { ...wiki, source: "wikipedia" };
    if (best?.score >= 0.9) break;
  }

  if (!best || best.score < 0.6) {
    const mealDb = await searchMealDb(cleanSearchTerms(name) || name);
    if (mealDb && (!best || mealDb.score > best.score)) {
      best = { ...mealDb, source: "themealdb" };
    }
  }

  const lower = name.toLowerCase();
  if (lower.includes("dal") && lower.includes("chawal") && best?.title === "Dal") {
    const khichdi = await searchWikipediaTitle("Khichdi");
    if (khichdi) best = { ...khichdi, source: "wikipedia-related" };
  }
  if (lower.includes("rajma") && lower.includes("chawal") && !best?.imageUrl) {
    const rajma = await searchWikipediaTitle("Rajma");
    if (rajma) best = { ...rajma, source: "wikipedia-related" };
  }

  if (!best) {
    const fallback = await searchWikipedia(`${cleanSearchTerms(name) || "indian"} cuisine food`, name);
    if (fallback) best = { ...fallback, source: "wikipedia-fallback" };
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

  const promise = (async () => {
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
        fetchedAt: new Date().toISOString(),
      }, null, 2)
    );
    return cached;
  })();

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
