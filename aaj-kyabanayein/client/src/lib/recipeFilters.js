/** Persist recipe browse filters for faster return visits */
const KEY = "akb-recipe-filters";

export function loadRecipeFilters() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

/** Keep meal category compatible with veg / non-veg diet filter */
export function normalizeCategoryForDiet(category, diet) {
  if (!category || category === "all" || diet === "all") return category || "all";
  if (diet === "veg" && category.startsWith("nonveg-")) {
    return category.replace("nonveg-", "veg-");
  }
  if (diet === "non-veg" && category.startsWith("veg-") && !category.startsWith("nonveg-")) {
    return category.replace("veg-", "nonveg-");
  }
  return category;
}

export function saveRecipeFilters(partial) {
  const next = { ...loadRecipeFilters(), ...partial };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
