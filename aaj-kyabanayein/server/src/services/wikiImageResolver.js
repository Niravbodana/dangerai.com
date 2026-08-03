const USER_AGENT = "RasoiraMealPlanner/1.0 (https://github.com/Niravbodana/dangerai.com)";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Resolve a working thumbnail URL from Wikipedia REST API (avoids 404 thumb paths). */
export async function resolveWikiThumbnail(title) {
  if (!title?.trim()) return null;
  const slug = encodeURIComponent(title.trim().replace(/ /g, "_"));
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.thumbnail?.source || data.originalimage?.source || null;
  } catch {
    return null;
  }
}

/** Try multiple Wikipedia titles; return first image found. */
export async function resolveWikiThumbnailFirst(titles = []) {
  for (const title of titles) {
    const url = await resolveWikiThumbnail(title);
    if (url) return { imageUrl: url, title, source: "wikipedia-rest" };
    await sleep(120);
  }
  return null;
}
