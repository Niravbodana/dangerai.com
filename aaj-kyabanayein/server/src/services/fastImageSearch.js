/**
 * Fast free image search — Openverse (CC) + Wikipedia REST.
 * Low quality OK; speed first. Groq used only for dish query hints.
 */
const USER_AGENT = "RasoiraMealPlanner/1.0";

function cleanQuery(name = "") {
  return name
    .replace(/\b(home|dhaba|restaurant|traditional|quick|special|classic|royal|grand|lite|authentic|street|festive|comfort)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Openverse thumb URLs are API routes (404); prefer direct image URLs. */
function pickOpenverseImageUrl(item) {
  const candidates = [item?.url, item?.thumbnail].filter(Boolean);
  return candidates.find((u) => !/api\.openverse\.org/i.test(u)) || null;
}

/** Openverse — free CC image search (Google-like speed without CSE key) */
export async function searchOpenverseImage(recipeName) {
  const q = cleanQuery(recipeName);
  if (!q) return null;
  const url = new URL("https://api.openverse.org/v1/images/");
  url.searchParams.set("q", `${q} food`);
  url.searchParams.set("page_size", "8");
  url.searchParams.set("license_type", "commercial,modification");

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const words = q.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    const results = data.results || [];

    for (const item of results) {
      const title = `${item.title || ""} ${item.foreign_landing_url || ""}`.toLowerCase();
      const hits = words.filter((w) => title.includes(w)).length;
      if (words.length && hits < Math.ceil(words.length / 2)) continue;
      const imageUrl = pickOpenverseImageUrl(item);
      if (!imageUrl || /logo|icon|avatar|svg/i.test(imageUrl)) continue;
      return {
        source: "openverse",
        imageUrl,
        title: item.title || q,
        score: 0.75 + hits * 0.05,
      };
    }

    const fallback = results.find((r) => {
      const imageUrl = pickOpenverseImageUrl(r);
      if (!imageUrl || /logo|icon|avatar|svg/i.test(imageUrl)) return false;
      const title = `${r.title || ""} ${r.foreign_landing_url || ""}`.toLowerCase();
      const hits = words.filter((w) => title.includes(w)).length;
      return words.length && hits >= Math.ceil(words.length / 2);
    });
    if (!fallback) return null;
    const title = `${fallback.title || ""} ${fallback.foreign_landing_url || ""}`.toLowerCase();
    const hits = words.filter((w) => title.includes(w)).length;
    return {
      source: "openverse",
      imageUrl: pickOpenverseImageUrl(fallback),
      title: fallback.title || q,
      score: 0.55 + hits * 0.05,
    };
  } catch {
    return null;
  }
}

/** Wikipedia REST summary — one fast call, returns thumbnail */
export async function searchWikipediaSummary(title) {
  if (!title) return null;
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const imageUrl = data.thumbnail?.source || data.originalimage?.source;
    if (!imageUrl) return null;
    return {
      source: "wikipedia-rest",
      imageUrl,
      title: data.title || title,
      score: 0.85,
    };
  } catch {
    return null;
  }
}

/** TheMealDB thumbnail by name — very fast */
export async function searchMealDbThumb(name) {
  const q = cleanQuery(name);
  if (!q) return null;
  try {
    const res = await fetch(
      `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(q)}`,
      { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(3500) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const meals = data.meals || [];
    const words = q.toLowerCase().split(/\s+/).filter((w) => w.length > 2);

    for (const meal of meals) {
      if (!meal?.strMealThumb) continue;
      const title = (meal.strMeal || "").toLowerCase();
      const hits = words.filter((w) => title.includes(w)).length;
      if (words.length && hits < Math.ceil(words.length / 2)) continue;
      return {
        source: "themealdb",
        imageUrl: meal.strMealThumb,
        title: meal.strMeal,
        score: 0.8,
      };
    }
    return null;
  } catch {
    return null;
  }
}
