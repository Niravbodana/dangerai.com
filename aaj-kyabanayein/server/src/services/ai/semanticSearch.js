/**
 * Semantic search interface — local keyword + synonym expansion (no external AI).
 */
import { filterRecipeIndex, getRecipeById, toListItem } from "../../data/recipes.js";

const QUERY_SYNONYMS = {
  sabzi: ["sabzi", "curry", "vegetable", "सब्जी"],
  chai: ["chai", "tea", "masala chai", "चाय"],
  nashta: ["breakfast", "nashta", "नाश्ता"],
  mithai: ["sweet", "dessert", "mithai", "मिठाई"],
  biryani: ["biryani", "pulao", "बिरयानी"],
  dosa: ["dosa", "idli", "डोसा"],
  roti: ["roti", "paratha", "chapati", "रोटी"],
};

function expandQuery(query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return [];
  const terms = new Set([q]);
  for (const [key, aliases] of Object.entries(QUERY_SYNONYMS)) {
    if (aliases.some((a) => q.includes(a) || a.includes(q))) {
      terms.add(key);
      aliases.forEach((a) => terms.add(a));
    }
  }
  return [...terms];
}

/** Search recipes — keyword today, embedding-ready interface for later */
export function semanticSearch(query, options = {}) {
  const { limit = 8, diet, cuisine, mealType, category } = options;
  const q = String(query || "").trim();

  if (!q) {
    return { provider: "local-keyword", type: "empty", query: q, results: [] };
  }

  const seen = new Set();
  const meta = [];

  for (const term of expandQuery(q)) {
    for (const r of filterRecipeIndex({ search: term, diet, cuisine, mealType, category })) {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        meta.push(r);
      }
    }
  }

  const results = meta.slice(0, limit).map((m) => {
    const full = getRecipeById(m.id);
    return toListItem(full || m);
  });

  return {
    provider: "local-keyword",
    type: "search",
    query: q,
    expandedTerms: expandQuery(q),
    results,
  };
}
