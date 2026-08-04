/**
 * Fetch REAL high-quality food photos with commercial-safe licenses.
 * Fast-first: curated Wikipedia → Wikimedia Commons → Wikipedia → Openverse → MealDB.
 */
import { normalizeToJpeg } from "./imageEncode.js";
import { getCuratedWikiTitle } from "../data/curatedRecipeImages.js";
import { searchMealDbThumb } from "../services/fastImageSearch.js";

const USER_AGENT = "RasoiraMealPlanner/1.0 (https://github.com/Niravbodana/dangerai.com; premium-photos)";

const NOISE = new Set([
  "home", "dhaba", "restaurant", "traditional", "quick", "special", "classic",
  "royal", "grand", "lite", "authentic", "street", "festive", "comfort",
  "punjabi", "gujarati", "bengali", "maharashtrian", "hyderabadi", "kashmiri",
  "north", "south", "indian", "veg", "non", "style", "recipe", "homemade",
  "lib", "bulk", "phase", "minute", "minutes", "hour", "easy", "simple",
  "best", "perfect", "ultimate", "famous", "popular", "healthy", "spicy",
]);

const WRONG = [
  /airplane|aircraft|boeing|airbus|helicopter|train|car\b/i,
  /uncooked|raw lentil|ingredient|types of/i,
  /person|people|portrait|selfie|logo|map|flag/i,
  /half.?eaten|half.?bitten|bitten|bite taken|partially eaten|leftover plate/i,
  /messy plate|scraps|crumbs only|half finished|half consumed/i,
  /low.?res|low.?quality|blurry|pixelated|thumbnail only/i,
  /eating|diner eating|person eating|hands holding/i,
];

function cleanQuery(name = "") {
  return String(name)
    .replace(/\d+\s*-?\s*minute(s)?/gi, " ")
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !NOISE.has(w.toLowerCase()))
    .join(" ")
    .trim();
}

/** Core dish name from long generated titles — e.g. "15-minute chicken halloumi burgers" → "chicken halloumi burgers" */
function extractCoreDishName(name = "") {
  const clean = cleanQuery(name);
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length <= 4) return clean;
  return words.slice(-4).join(" ");
}

function searchNamesFor(recipeOrName) {
  const recipe = typeof recipeOrName === "object" ? recipeOrName : { name: recipeOrName };
  const name = recipe.name || recipe.title || String(recipeOrName || "");
  const curated = getCuratedWikiTitle(recipe);
  const core = extractCoreDishName(name);
  const clean = cleanQuery(name);
  const names = [...new Set([curated, clean, core, name].filter(Boolean))];
  return names;
}

function titleScore(title = "", recipeName = "") {
  const t = title.toLowerCase();
  const words = cleanQuery(recipeName).toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  if (!words.length) return 0;
  let hit = 0;
  for (const w of words) if (t.includes(w)) hit++;
  return hit / words.length;
}

function isWrong(title = "", url = "") {
  const blob = `${title} ${url}`;
  return WRONG.some((re) => re.test(blob));
}

async function downloadBuffer(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "image/*,*/*" },
    signal: AbortSignal.timeout(8000),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 8000) throw new Error("too small");
  return buf;
}

function meetsMinResolution(match) {
  const w = match?.width || 0;
  const h = match?.height || 0;
  if (w > 0 && h > 0 && (w < 640 || h < 480)) return false;
  return true;
}

async function searchOpenverse(recipeName) {
  const q = cleanQuery(recipeName);
  if (!q || q.split(/\s+/).length > 5) return null;
  const url = new URL("https://api.openverse.org/v1/images/");
  url.searchParams.set("q", `${q} indian food`);
  url.searchParams.set("page_size", "6");
  url.searchParams.set("license_type", "commercial,modification");

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(3500),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const ranked = (data.results || [])
    .map((item) => {
      const imageUrl = [item.url, item.thumbnail].find((u) => u && !/api\.openverse\.org/i.test(u));
      const title = item.title || "";
      const score = titleScore(title, recipeName);
      return {
        imageUrl,
        title,
        score,
        license: item.license,
        source: "openverse",
        width: item.width,
        height: item.height,
      };
    })
    .filter((x) => x.imageUrl && x.score >= 0.55 && !isWrong(x.title, x.imageUrl) && meetsMinResolution(x))
    .sort((a, b) => b.score - a.score || (b.width || 0) - (a.width || 0));
  return ranked[0] || null;
}

async function searchCommons(recipeName) {
  const q = cleanQuery(recipeName);
  if (!q) return null;
  const api = new URL("https://commons.wikimedia.org/w/api.php");
  api.searchParams.set("action", "query");
  api.searchParams.set("format", "json");
  api.searchParams.set("origin", "*");
  api.searchParams.set("generator", "search");
  api.searchParams.set("gsrsearch", `${q} food filetype:bitmap`);
  api.searchParams.set("gsrnamespace", "6");
  api.searchParams.set("gsrlimit", "8");
  api.searchParams.set("prop", "imageinfo");
  api.searchParams.set("iiprop", "url|mime|size|extmetadata");
  api.searchParams.set("iiurlwidth", "1400");

  const res = await fetch(api, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const pages = Object.values(data.query?.pages || {});
  const ranked = [];
  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (!info) continue;
    const title = page.title || info.extmetadata?.ObjectName?.value || "";
    const license = String(
      info.extmetadata?.LicenseShortName?.value || info.extmetadata?.License?.value || ""
    ).toLowerCase();
    if (license && /nc|nd\b/.test(license) && !/cc0|public domain|pd/.test(license)) continue;
    const imageUrl = info.thumburl || info.url;
    const score = titleScore(title, recipeName);
    if (!imageUrl || score < 0.5 || isWrong(title, imageUrl) || !meetsMinResolution({ width: info.width, height: info.height })) continue;
    if (!/^image\/(jpeg|png|webp)/i.test(info.mime || "image/jpeg")) continue;
    ranked.push({
      imageUrl,
      title,
      score,
      license: license || "commons",
      source: "wikimedia-commons",
      width: info.width,
      height: info.height,
    });
  }
  ranked.sort((a, b) => b.score - a.score || (b.width || 0) - (a.width || 0));
  return ranked[0] || null;
}

async function searchWikipedia(recipeName) {
  const q = cleanQuery(recipeName);
  if (!q) return null;
  const titles = [q, `${q} (food)`, `${q} (dish)`];
  for (const title of titles) {
    const slug = encodeURIComponent(title.trim().replace(/ /g, "_"));
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const imageUrl = data.originalimage?.source || data.thumbnail?.source;
      if (!imageUrl) continue;
      const score = titleScore(`${data.title} ${data.description || ""}`, recipeName);
      if (score < 0.45 || isWrong(data.title, imageUrl)) continue;
      return {
        imageUrl,
        title: data.title,
        score,
        license: "wikipedia",
        source: "wikipedia",
        width: data.originalimage?.width,
        height: data.originalimage?.height,
      };
    } catch {
      /* next */
    }
  }
  return null;
}

/**
 * Find best real photo — try multiple dish name variants before studio fallback.
 * @param {string|object} recipeOrName — recipe row or dish name
 */
export async function findRealFoodPhoto(recipeOrName) {
  const names = searchNamesFor(recipeOrName);
  if (!names.length) return null;

  let best = null;

  for (const name of names) {
    const q = cleanQuery(name);
    if (!q || q.length < 2) continue;

    try {
      const commons = await searchCommons(name);
      if (commons && (!best || commons.score > best.score)) best = commons;
      if (best?.score >= 0.7) return best;
    } catch {
      /* continue */
    }

    try {
      const wiki = await searchWikipedia(name);
      if (wiki && (!best || wiki.score > best.score)) best = wiki;
      if (best?.score >= 0.65) return best;
    } catch {
      /* continue */
    }

    try {
      const ov = await searchOpenverse(name);
      if (ov && (!best || ov.score > best.score)) best = ov;
    } catch {
      /* continue */
    }

    try {
      const meal = await searchMealDbThumb(name);
      if (meal?.imageUrl) {
        const scored = { ...meal, score: Math.max(meal.score || 0.75, titleScore(meal.title, names[0])) };
        if (!best || scored.score > best.score) best = scored;
      }
    } catch {
      /* continue */
    }
  }

  return best?.score >= 0.45 ? best : null;
}

export async function fetchAndNormalizePhoto(match) {
  if (!match?.imageUrl) throw new Error("no image url");
  const raw = await downloadBuffer(match.imageUrl);
  const jpeg = await normalizeToJpeg(raw, 1400, 1050, 92);
  if (jpeg.length < 12000) throw new Error("normalized too small");
  return jpeg;
}
