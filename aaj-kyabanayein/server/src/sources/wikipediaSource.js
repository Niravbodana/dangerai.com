/**
 * Wikipedia REST API — HD photos, factual extract, article links.
 * License: Wikipedia content CC BY-SA, images vary (Commons).
 */
const USER_AGENT = "RasoiraMealPlanner/1.0 (https://github.com/Niravbodana/dangerai.com; wiki-import)";

function slugify(text = "") {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

export async function fetchWikipediaArticle(title) {
  if (!title?.trim()) return null;
  const slug = encodeURIComponent(title.trim().replace(/ /g, "_"));
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.type === "disambiguation") return null;

    const imageUrl = data.originalimage?.source || data.thumbnail?.source || null;
    const width = data.originalimage?.width || data.thumbnail?.width || 0;
    const height = data.originalimage?.height || data.thumbnail?.height || 0;

    return {
      title: data.title,
      extract: data.extract || "",
      description: data.description || "",
      wikipediaUrl: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${slug}`,
      imageUrl,
      imageWidth: width,
      imageHeight: height,
      license: "CC-BY-SA-4.0",
      source: "wikipedia",
    };
  } catch {
    return null;
  }
}

/** Fetch dish names from a Wikipedia list page (e.g. List of Indian dishes). */
export async function fetchDishesFromWikiList(listTitle, limit = 40) {
  const api = new URL("https://en.wikipedia.org/w/api.php");
  api.searchParams.set("action", "query");
  api.searchParams.set("format", "json");
  api.searchParams.set("origin", "*");
  api.searchParams.set("titles", listTitle);
  api.searchParams.set("prop", "links");
  api.searchParams.set("pllimit", String(Math.min(limit, 50)));
  api.searchParams.set("plnamespace", "0");

  try {
    const res = await fetch(api, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const pages = Object.values(data.query?.pages || {});
    const links = pages[0]?.links || [];
    return links
      .map((l) => l.title)
      .filter((t) => t && !/list of|category:|template:|wikipedia:/i.test(t))
      .filter((t) => !/\b(cuisine|pradesh|caste|people|district|language|festival|religion|history|country|state|region|province|empire|dynasty|river|mountain|city|town|village|university|film|actor|politician)\b/i.test(t))
      .slice(0, limit)
      .map((title) => ({ name: title, wikiTitle: title, cuisine: "indian", mealType: "lunch", diet: ["veg"] }));
  } catch {
    return [];
  }
}

export function dishToId(name) {
  return slugify(name) || `dish-${Date.now()}`;
}

export { slugify };
