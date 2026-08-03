/** Persist recipe browse filters for faster return visits */
const KEY = "akb-recipe-filters";

export function loadRecipeFilters() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveRecipeFilters(partial) {
  const next = { ...loadRecipeFilters(), ...partial };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
