/** Recently viewed / cooked recipes — fast "cook again" loop */
const KEY = "akb-recent-recipes";
const MAX = 12;

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

export function trackRecipeView(recipeId) {
  if (!recipeId) return;
  const ids = read().filter((id) => id !== recipeId);
  ids.unshift(recipeId);
  write(ids);
}

export function trackRecipeCooked(recipeId) {
  trackRecipeView(recipeId);
}

export function getRecentRecipeIds(limit = 8) {
  return read().slice(0, limit);
}
