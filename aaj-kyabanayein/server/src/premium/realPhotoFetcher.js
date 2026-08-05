/**
 * Fetch REAL high-quality food photos with commercial-safe licenses.
 * Google Images first (broadest coverage of real food-blog photos, when
 * GOOGLE_API_KEY + GOOGLE_CSE_ID are configured), then Wikimedia Commons
 * → Wikipedia → Openverse (short timeouts). Never generates AI/studio art
 * here — that fallback only kicks in one level up, in heroImageGenerator,
 * when every real source below comes back empty.
 */
import { normalizeToJpeg } from "./imageEncode.js";
import { searchGoogleImage, isGoogleSearchConfigured } from "../services/googleSearchService.js";

const USER_AGENT = "RasoiraMealPlanner/1.0 (https://github.com/Niravbodana/dangerai.com; premium-photos)";

const NOISE = new Set([
  "home", "dhaba", "restaurant", "traditional", "quick", "special", "classic",
  "royal", "grand", "lite", "authentic", "street", "festive", "comfort",
  "punjabi", "gujarati", "bengali", "maharashtrian", "hyderabadi", "kashmiri",
  "north", "south", "indian", "veg", "non", "style", "recipe", "homemade",
  "lib", "bulk", "phase",
]);

const WRONG = [
  /airplane|aircraft|boeing|airbus|helicopter|train|car\b/i,
  /uncooked|raw lentil|ingredient|types of/i,
  /person|people|portrait|selfie|logo|map|flag/i,
];

function cleanQuery(name = "") {
  return String(name)
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !NOISE.has(w.toLowerCase()))
    .join(" ")
    .trim();
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
    .filter((x) => x.imageUrl && x.score >= 0.55 && !isWrong(x.title, x.imageUrl))
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
    if (!imageUrl || score < 0.5 || isWrong(title, imageUrl)) continue;
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

async function searchGoogle(recipeName) {
  if (!isGoogleSearchConfigured()) return null;
  const match = await searchGoogleImage(recipeName);
  if (!match?.imageUrl) return null;
  const score = titleScore(match.title || "", recipeName);
  if (score < 0.4 || isWrong(match.title, match.imageUrl)) return null;
  return {
    imageUrl: match.imageUrl,
    title: match.title,
    score: Math.max(score, 0.6), // Google's own relevance ranking already filtered hard
    license: "google-images",
    source: "google-images",
  };
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
 * Find best real photo. Google Images first when configured (broadest,
 * highest-quality coverage of real dish photos), then Commons (best free
 * source for Indian food), then Wikipedia, then Openverse.
 */
export async function findRealFoodPhoto(recipeName) {
  const q = cleanQuery(recipeName);
  // Skip network for very invented / long catalog names — use studio art
  if (!q || q.length < 3) return null;
  if (q.split(/\s+/).length > 6) return null;

  try {
    const google = await searchGoogle(recipeName);
    if (google?.score >= 0.4) return google;
  } catch {
    /* continue */
  }

  try {
    const commons = await searchCommons(recipeName);
    if (commons?.score >= 0.55) return commons;
  } catch {
    /* continue */
  }

  try {
    const wiki = await searchWikipedia(recipeName);
    if (wiki?.score >= 0.5) return wiki;
  } catch {
    /* continue */
  }

  try {
    const ov = await searchOpenverse(recipeName);
    if (ov?.score >= 0.55) return ov;
  } catch {
    /* continue */
  }

  return null;
}

export async function fetchAndNormalizePhoto(match) {
  if (!match?.imageUrl) throw new Error("no image url");
  const raw = await downloadBuffer(match.imageUrl);
  const jpeg = await normalizeToJpeg(raw, 1400, 1050, 92);
  if (jpeg.length < 12000) throw new Error("normalized too small");
  return jpeg;
}
