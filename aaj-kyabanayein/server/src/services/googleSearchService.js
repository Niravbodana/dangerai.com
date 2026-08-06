/**
 * Google Custom Search API — images + recipe web snippets.
 * Set GOOGLE_CSE_API_KEY and GOOGLE_CSE_ID in server/.env
 * (falls back to GOOGLE_API_KEY if GOOGLE_CSE_API_KEY isn't set, but a
 * dedicated key from Google Cloud Console with the "Custom Search API"
 * enabled is recommended — the Gemini/AI Studio key does NOT work here).
 * Create CSE: https://programmablesearchengine.google.com/
 */
const USER_AGENT = "RasoiraMealPlanner/1.0";

function getConfig() {
  const apiKey = process.env.GOOGLE_CSE_API_KEY || process.env.GOOGLE_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;
  if (!apiKey || !cseId) return null;
  return { apiKey, cseId };
}

async function googleSearch(params) {
  const config = getConfig();
  if (!config) return null;

  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", config.apiKey);
  url.searchParams.set("cx", config.cseId);
  for (const [k, v] of Object.entries(params)) {
    if (v != null) url.searchParams.set(k, String(v));
  }

  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    console.warn("Google CSE:", res.status, await res.text().catch(() => ""));
    return null;
  }
  return res.json();
}

export function isGoogleSearchConfigured() {
  return Boolean(getConfig());
}

/** Search Google Images for a dish photo — query must match exact dish name */
export async function searchGoogleImage(recipeName) {
  const clean = recipeName
    .replace(/\b(home|dhaba|restaurant|traditional|quick|special|classic)\b/gi, "")
    .trim();

  const data = await googleSearch({
    q: `"${clean}" food dish photo`,
    searchType: "image",
    num: 8,
    safe: "active",
    imgSize: "medium",
    imgType: "photo",
  });

  const items = data?.items || [];
  const nameWords = clean.toLowerCase().split(/\s+/).filter((w) => w.length > 2);

  for (const item of items) {
    if (!item.link || /logo|icon|avatar|clipart|vector/i.test(item.link)) continue;
    const title = (item.title || "").toLowerCase();
    const hits = nameWords.filter((w) => title.includes(w) || item.link.toLowerCase().includes(w)).length;
    if (nameWords.length === 0 || hits >= Math.ceil(nameWords.length / 2)) {
      return { source: "google-images", imageUrl: item.link, title: item.title };
    }
  }

  const fallback = items.find((i) => i.link && !/logo|icon|avatar/i.test(i.link));
  if (!fallback?.link) return null;
  return { source: "google-images", imageUrl: fallback.link, title: fallback.title };
}

/** Parse ingredient-like lines from Google web search snippets */
function parseIngredientsFromText(text) {
  const lines = text
    .split(/[\n•·|]/)
    .map((l) => l.replace(/^[\s\-*]+/, "").trim())
    .filter((l) => l.length > 2 && l.length < 120);

  const ingredients = [];
  const qtyPattern = /^([\d/½¼¾]+\s*(?:cup|cups|tbsp|tsp|g|kg|ml|litre|liter|oz|lb|piece|pieces|clove|cloves|medium|small|large)?s?)\s+(.+)/i;

  for (const line of lines) {
    const m = line.match(qtyPattern);
    if (m) {
      ingredients.push({ name: m[2].trim(), nameHi: m[2].trim(), quantity: m[1].trim() });
    } else if (/^[A-Za-z]/.test(line) && !/^(step|method|instruction|directions|serves|prep|cook)/i.test(line)) {
      ingredients.push({ name: line, nameHi: line, quantity: "as needed" });
    }
    if (ingredients.length >= 12) break;
  }
  return ingredients;
}

/** Search Google for recipe ingredients via web snippets */
export async function searchGoogleRecipeData(recipeName) {
  const data = await googleSearch({
    q: `${recipeName} recipe ingredients list`,
    num: 5,
  });

  const items = data?.items || [];
  if (!items.length) return null;

  let allIngredients = [];
  let steps = [];

  for (const item of items) {
    const blob = [item.title, item.snippet, item.htmlSnippet?.replace(/<[^>]+>/g, " ")].join(" ");
    const parsed = parseIngredientsFromText(blob);
    if (parsed.length > allIngredients.length) allIngredients = parsed;

    const stepMatches = blob.match(/step\s*\d+[:\s]+[^.]+[.]/gi);
    if (stepMatches?.length > steps.length) {
      steps = stepMatches.map((s) => s.replace(/^step\s*\d+[:\s]+/i, "").trim());
    }
  }

  if (allIngredients.length < 3) return null;

  return {
    source: "google-web",
    ingredients: allIngredients,
    steps: steps.length >= 2 ? steps : undefined,
    stepsHi: steps.length >= 2 ? steps : undefined,
  };
}
