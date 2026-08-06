import crypto from "crypto";
import { getDb } from "../db/connection.js";

const USER_AGENT = "RasoiraMealPlanner/1.0";

function detectSourceType(url) {
  if (/youtube\.com|youtu\.be/i.test(url)) return "youtube";
  if (/instagram\.com/i.test(url)) return "instagram";
  return "web";
}

async function fetchYouTubeMeta(url) {
  const oembed = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  const res = await fetch(oembed, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return {
    title: data.title,
    author: data.author_name,
    thumbnail: data.thumbnail_url,
  };
}

async function fetchWebMeta(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
    signal: AbortSignal.timeout(8000),
    redirect: "follow",
  });
  if (!res.ok) return null;
  const html = await res.text().slice(0, 120000);
  const ogTitle = html.match(/property=["']og:title["']\s+content=["']([^"']+)["']/i)?.[1];
  const ogDesc = html.match(/property=["']og:description["']\s+content=["']([^"']+)["']/i)?.[1];
  const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  return {
    title: ogTitle || titleTag?.trim(),
    description: ogDesc,
  };
}

export async function importRecipeFromUrl(userId, sourceUrl) {
  const url = String(sourceUrl || "").trim();
  if (!url || !/^https?:\/\//i.test(url)) {
    throw new Error("Valid http(s) URL required");
  }

  const sourceType = detectSourceType(url);
  let meta = {};
  if (sourceType === "youtube") meta = (await fetchYouTubeMeta(url)) || {};
  else meta = (await fetchWebMeta(url)) || {};

  const title = meta.title || "Imported recipe";
  const recipeId = `import-${crypto.randomBytes(6).toString("hex")}`;
  const now = new Date().toISOString();

  const recipe = {
    id: recipeId,
    name: title,
    nameHi: title,
    mealType: "lunch",
    cuisine: "imported",
    category: "veg-lunch",
    diet: ["veg"],
    cookTime: 30,
    calories: 300,
    ingredients: [{ name: "See source link", nameHi: "स्रोत लिंक देखें", quantity: "1" }],
    steps: meta.description
      ? [meta.description.slice(0, 500)]
      : [`Open source: ${url}`, "Follow video or blog instructions step by step."],
    stepsHi: [`स्रोत खोलें: ${url}`, "वीडियो या ब्लॉग के निर्देश follow करें।"],
    tags: ["imported", sourceType],
    sourceUrl: url,
    sourceType,
    thumbnail: meta.thumbnail || null,
    imported: true,
  };

  getDb()
    .prepare(
      `INSERT INTO imported_recipes (id, user_id, source_url, title, source_type, recipe_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(recipeId, userId, url, title, sourceType, JSON.stringify(recipe), now);

  return recipe;
}

export function listImportedRecipes(userId) {
  return getDb()
    .prepare("SELECT id, source_url, title, source_type, recipe_json, created_at FROM imported_recipes WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId)
    .map((row) => ({
      ...JSON.parse(row.recipe_json),
      sourceUrl: row.source_url,
      sourceType: row.source_type,
      importedAt: row.created_at,
    }));
}

export function deleteImportedRecipe(userId, recipeId) {
  return getDb()
    .prepare("DELETE FROM imported_recipes WHERE id = ? AND user_id = ?")
    .run(recipeId, userId);
}
