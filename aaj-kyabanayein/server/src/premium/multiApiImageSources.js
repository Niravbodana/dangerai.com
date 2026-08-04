/**
 * Multi-API HD food photo search — parallel licensed sources.
 * Free (no key): Wikimedia Commons, Wikipedia, Openverse, TheMealDB
 * Optional keys: PEXELS_API_KEY, UNSPLASH_ACCESS_KEY, PIXABAY_API_KEY
 */
const USER_AGENT = "RasoiraMealPlanner/1.0 (https://github.com/Niravbodana/dangerai.com; hd-photos)";

const WRONG = [
  /half.?eaten|bitten|partially eaten|leftover|messy plate|scraps/i,
  /person eating|diner|selfie|portrait|logo|icon|map|flag/i,
  /uncooked|raw ingredient|types of/i,
  /airplane|aircraft|train|car\b/i,
  /blurry|pixelated|low.?res/i,
];

function cleanQuery(name = "") {
  return String(name)
    .replace(/\d+\s*-?\s*minute(s)?/gi, " ")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function titleScore(title = "", recipeName = "") {
  const t = String(title).toLowerCase();
  const words = cleanQuery(recipeName).toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  if (!words.length) return 0;
  let hit = 0;
  for (const w of words) if (t.includes(w)) hit++;
  return hit / words.length;
}

function isWrong(title = "", url = "") {
  return WRONG.some((re) => re.test(`${title} ${url}`));
}

function meetsMinResolution(match) {
  const w = match?.width || 0;
  const h = match?.height || 0;
  if (w > 0 && h > 0 && (w < 800 || h < 600)) return false;
  return true;
}

function rankMatch(item, recipeName) {
  if (!item?.imageUrl || isWrong(item.title, item.imageUrl)) return null;
  const score = item.score ?? titleScore(item.title, recipeName);
  if (score < 0.4) return null;
  if (!meetsMinResolution(item) && (item.width || item.height)) return null;
  return { ...item, score };
}

/** Pexels — free API key from https://www.pexels.com/api/ */
export async function searchPexels(recipeName, cuisine = "indian") {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;
  const q = cleanQuery(recipeName);
  if (!q) return null;
  const query = `${q} ${cuisine} food dish`;
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=8&orientation=landscape`,
      { headers: { Authorization: key, "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const ranked = (data.photos || [])
      .map((p) => ({
        imageUrl: p.src?.large2x || p.src?.large || p.src?.original,
        title: p.alt || q,
        width: p.width,
        height: p.height,
        license: "Pexels License",
        source: "pexels",
        score: titleScore(p.alt || "", recipeName) + 0.15,
      }))
      .map((x) => rankMatch(x, recipeName))
      .filter(Boolean)
      .sort((a, b) => b.score - a.score || (b.width || 0) - (a.width || 0));
    return ranked[0] || null;
  } catch {
    return null;
  }
}

/** Unsplash — free key from https://unsplash.com/developers */
export async function searchUnsplash(recipeName) {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;
  const q = cleanQuery(recipeName);
  if (!q) return null;
  try {
    const url = new URL("https://api.unsplash.com/search/photos");
    url.searchParams.set("query", `${q} food dish plated`);
    url.searchParams.set("per_page", "8");
    url.searchParams.set("orientation", "landscape");
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${key}`, "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const ranked = (data.results || [])
      .map((p) => ({
        imageUrl: p.urls?.regular || p.urls?.full,
        title: p.description || p.alt_description || q,
        width: p.width,
        height: p.height,
        license: "Unsplash License",
        source: "unsplash",
        score: titleScore(p.description || p.alt_description || "", recipeName) + 0.12,
      }))
      .map((x) => rankMatch(x, recipeName))
      .filter(Boolean)
      .sort((a, b) => b.score - a.score || (b.width || 0) - (a.width || 0));
    return ranked[0] || null;
  } catch {
    return null;
  }
}

/** Pixabay — free key from https://pixabay.com/api/docs/ */
export async function searchPixabay(recipeName) {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) return null;
  const q = cleanQuery(recipeName);
  if (!q) return null;
  try {
    const url = new URL("https://pixabay.com/api/");
    url.searchParams.set("key", key);
    url.searchParams.set("q", `${q} food`);
    url.searchParams.set("image_type", "photo");
    url.searchParams.set("orientation", "horizontal");
    url.searchParams.set("safesearch", "true");
    url.searchParams.set("per_page", "8");
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    const ranked = (data.hits || [])
      .map((p) => ({
        imageUrl: p.largeImageURL || p.webformatURL,
        title: p.tags || q,
        width: p.imageWidth,
        height: p.imageHeight,
        license: "Pixabay License",
        source: "pixabay",
        score: titleScore(p.tags || "", recipeName) + 0.1,
      }))
      .map((x) => rankMatch(x, recipeName))
      .filter(Boolean)
      .sort((a, b) => b.score - a.score || (b.width || 0) - (a.width || 0));
    return ranked[0] || null;
  } catch {
    return null;
  }
}

/** TheMealDB — free test API, dish-matched photos */
export async function searchMealDbHd(recipeName) {
  const q = cleanQuery(recipeName);
  if (!q) return null;
  try {
    const res = await fetch(
      `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(q)}`,
      { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(4000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const meal = data?.meals?.[0];
    if (!meal?.strMealThumb) return null;
    const score = titleScore(meal.strMeal || "", recipeName);
    if (score < 0.45) return null;
    return {
      imageUrl: meal.strMealThumb,
      title: meal.strMeal,
      score: Math.max(score, 0.65),
      license: "TheMealDB",
      source: "themealdb-hd",
      width: 640,
      height: 640,
    };
  } catch {
    return null;
  }
}

/** Openverse with broader food photography query */
export async function searchOpenverseHd(recipeName, cuisine = "") {
  const q = cleanQuery(recipeName);
  if (!q) return null;
  const queries = [
    `${q} food photography plated`,
    `${q} ${cuisine} dish`.trim(),
    `${q} cuisine food`,
  ];
  for (const query of queries) {
    try {
      const url = new URL("https://api.openverse.org/v1/images/");
      url.searchParams.set("q", query);
      url.searchParams.set("page_size", "10");
      url.searchParams.set("license_type", "commercial,modification");
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        signal: AbortSignal.timeout(4500),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const ranked = (data.results || [])
        .map((item) => {
          const imageUrl = [item.url, item.thumbnail].find((u) => u && !/api\.openverse\.org/i.test(u));
          return {
            imageUrl,
            title: item.title || "",
            score: titleScore(item.title || "", recipeName),
            license: item.license,
            source: "openverse",
            width: item.width,
            height: item.height,
          };
        })
        .map((x) => rankMatch(x, recipeName))
        .filter(Boolean)
        .sort((a, b) => b.score - a.score || (b.width || 0) - (a.width || 0));
      if (ranked[0]) return ranked[0];
    } catch {
      /* next query */
    }
  }
  return null;
}

/** Wikimedia Commons — 2000px width */
export async function searchCommonsHd(recipeName) {
  const q = cleanQuery(recipeName);
  if (!q) return null;
  const api = new URL("https://commons.wikimedia.org/w/api.php");
  api.searchParams.set("action", "query");
  api.searchParams.set("format", "json");
  api.searchParams.set("origin", "*");
  api.searchParams.set("generator", "search");
  api.searchParams.set("gsrsearch", `${q} food dish filetype:bitmap`);
  api.searchParams.set("gsrnamespace", "6");
  api.searchParams.set("gsrlimit", "10");
  api.searchParams.set("prop", "imageinfo");
  api.searchParams.set("iiprop", "url|mime|size|extmetadata");
  api.searchParams.set("iiurlwidth", "2000");

  try {
    const res = await fetch(api, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
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
      const imageUrl = info.url || info.thumburl;
      const item = rankMatch(
        {
          imageUrl,
          title,
          score: titleScore(title, recipeName),
          license: license || "commons",
          source: "wikimedia-commons",
          width: info.width,
          height: info.height,
        },
        recipeName
      );
      if (item && /^image\/(jpeg|png|webp)/i.test(info.mime || "image/jpeg")) ranked.push(item);
    }
    ranked.sort((a, b) => b.score - a.score || (b.width || 0) - (a.width || 0));
    return ranked[0] || null;
  } catch {
    return null;
  }
}

/**
 * Search ALL configured HD sources in parallel — return best match.
 */
export async function searchAllHdSources(recipeName, options = {}) {
  const cuisine = options.cuisine || "indian";
  const searches = [
    searchCommonsHd(recipeName),
    searchOpenverseHd(recipeName, cuisine),
    searchPexels(recipeName, cuisine),
    searchUnsplash(recipeName),
    searchPixabay(recipeName),
    searchMealDbHd(recipeName),
  ];

  const results = await Promise.allSettled(searches);
  let best = null;
  for (const r of results) {
    if (r.status !== "fulfilled" || !r.value) continue;
    if (!best || r.value.score > best.score || ((r.value.width || 0) > (best.width || 0) && r.value.score >= best.score - 0.05)) {
      best = r.value;
    }
  }
  return best?.score >= 0.45 ? best : null;
}

export function getConfiguredImageApis() {
  return {
    wikimedia: true,
    openverse: true,
    themealdb: true,
    pexels: Boolean(process.env.PEXELS_API_KEY),
    unsplash: Boolean(process.env.UNSPLASH_ACCESS_KEY),
    pixabay: Boolean(process.env.PIXABAY_API_KEY),
  };
}
