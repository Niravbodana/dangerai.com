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

/** Compare two meal categories ignoring the veg-/nonveg- diet prefix, so a
 * meal-type chip (e.g. "Breakfast") stays highlighted across diet toggles. */
export function sameMealCategory(a, b) {
  if (!a || !b) return a === b;
  const strip = (x) => x.replace(/^nonveg-/, "").replace(/^veg-/, "");
  return strip(a) === strip(b);
}

export function saveRecipeFilters(partial) {
  const next = { ...loadRecipeFilters(), ...partial };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
