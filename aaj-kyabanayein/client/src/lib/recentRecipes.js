/** Recently viewed / cooked recipes — fast "cook again" loop */
const KEY = "akb-recent-recipes";
const MAX = 12;

const NON_INDIAN_CUISINES = new Set([
  "italian", "western", "british", "american", "mexican", "continental",
  "european", "french", "german", "dutch", "chinese", "japanese", "thai",
  "turkish", "greek", "spanish",
]);

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(ids) {
  localStorage.setItem(KEY, JSON.stringify(ids.slice(0, MAX)));
}

/** Only Indian home-cooking recipes in Cook again — no TMDB junk */
export function isEligibleForCookAgain(recipe) {
  if (!recipe?.id) return false;
  if (recipe.id.startsWith("tmdb-")) return false;
  if (recipe.source === "tmdb") return false;
  const cuisine = (recipe.cuisine || "indian").toLowerCase();
  if (NON_INDIAN_CUISINES.has(cuisine)) return false;
  return true;
}

export function trackRecipeView(recipeId) {
  if (!recipeId || recipeId.startsWith("tmdb-")) return;
  const ids = read().filter((id) => id !== recipeId && !id.startsWith("tmdb-"));
  ids.unshift(recipeId);
  write(ids);
}

export function trackRecipeCooked(recipeId) {
  trackRecipeView(recipeId);
}

export function getRecentRecipeIds(limit = 8) {
  return read().filter((id) => !id.startsWith("tmdb-")).slice(0, limit);
}

/** Purge western/TMDB ids from stored history */
export function sanitizeRecentRecipes() {
  const clean = read().filter((id) => !id.startsWith("tmdb-"));
  if (clean.length !== read().length) write(clean);
  return clean;
}
