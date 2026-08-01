/** Lightweight search helpers — typo tolerance without AI */

export const TRENDING_SEARCHES = [
  "biryani",
  "dosa",
  "paneer",
  "chicken curry",
  "dal",
  "pasta",
  "paratha",
  "poha",
  "sambar",
  "chole",
  "pulao",
  "noodles",
];

export function normalizeQuery(q) {
  return String(q || "").trim().toLowerCase();
}

export function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 1; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export function fuzzyIncludes(haystack, needle) {
  const h = normalizeQuery(haystack);
  const n = normalizeQuery(needle);
  if (!n) return false;
  if (h.includes(n)) return true;
  if (n.length < 3) return false;

  const maxDist = n.length <= 4 ? 1 : 2;
  const words = h.split(/[\s,./_-]+/).filter(Boolean);
  return words.some((w) => {
    if (w.includes(n) || n.includes(w)) return true;
    return levenshtein(w, n) <= maxDist;
  });
}

export function recipeMatchesSearch(recipe, query) {
  const q = normalizeQuery(query);
  if (!q) return true;

  const fields = [
    recipe.name,
    recipe.nameHi,
    recipe.cuisine,
    ...(recipe.tags || []),
    ...(recipe.pantryKeys || []),
  ];

  return fields.some((f) => f && fuzzyIncludes(f, q));
}

export function scoreRecipeSearch(recipe, query) {
  const q = normalizeQuery(query);
  if (!q) return 0;

  let score = 0;
  const name = normalizeQuery(recipe.name);
  if (name === q) score += 100;
  else if (name.startsWith(q)) score += 50;
  else if (name.includes(q)) score += 30;

  if (recipe.nameHi && fuzzyIncludes(recipe.nameHi, q)) score += 20;
  if (recipe.pantryKeys?.some((k) => fuzzyIncludes(k, q))) score += 25;
  if (recipe.tags?.some((t) => fuzzyIncludes(t, q))) score += 15;
  if (recipe.cuisine && fuzzyIncludes(recipe.cuisine, q)) score += 10;

  return score;
}

export function getTrendingSearches(limit = 8) {
  return TRENDING_SEARCHES.slice(0, limit);
}

export function getQuerySuggestions(query, { trending = TRENDING_SEARCHES, ingredients = [] } = {}) {
  const q = normalizeQuery(query);
  if (!q) return trending.slice(0, 6);

  const terms = [
    ...trending,
    ...ingredients.map((i) => (typeof i === "string" ? i : i.name)).filter(Boolean),
  ];

  return [...new Set(
    terms.filter((t) => {
      const term = normalizeQuery(t);
      return term.startsWith(q) || fuzzyIncludes(t, q);
    }),
  )].slice(0, 6);
}
