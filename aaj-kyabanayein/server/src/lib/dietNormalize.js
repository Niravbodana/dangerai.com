/**
 * Canonical diet tags for live catalog + UI.
 * Phase3 uses "vegetarian"/"non-vegetarian"; curated uses "veg"/"non-veg".
 */

export function dietList(diet) {
  return (Array.isArray(diet) ? diet : [diet])
    .filter(Boolean)
    .map((d) => String(d).toLowerCase().trim());
}

export function isNonVegDiet(diet) {
  return dietList(diet).some(
    (x) => x.includes("non-veg") || x === "nonveg" || x === "non-vegetarian" || x === "nonvegetarian"
  );
}

export function isVegDiet(diet) {
  if (isNonVegDiet(diet)) return false;
  const d = dietList(diet);
  if (!d.length) return true;
  return d.some((x) =>
    x === "veg" ||
    x === "vegetarian" ||
    x === "vegan" ||
    x === "jain" ||
    x === "eggetarian" ||
    x === "plant-based"
  );
}

/** Ensure every recipe has canonical "veg" or "non-veg" for UI badges. */
export function canonicalizeDiet(diet) {
  const raw = dietList(diet);
  const nonVeg = isNonVegDiet(raw);
  const next = [...raw];
  if (nonVeg) {
    if (!next.includes("non-veg")) next.push("non-veg");
    // drop ambiguous bare "veg" if present alongside non-veg
    return next.filter((x) => x !== "veg" || next.includes("vegetarian"));
  }
  if (!next.includes("veg")) next.push("veg");
  if (!next.some((x) => x === "vegetarian" || x === "vegan" || x === "jain" || x === "eggetarian")) {
    next.push("vegetarian");
  }
  return [...new Set(next)];
}

/**
 * Whole-word meat/egg/seafood detector. MUST use \b boundaries — several short
 * tokens here (e.g. "ham", "egg", "meat") are common substrings of innocent
 * vegetarian dish names (Khaman, Pradhaman, Kuzhambu, Eggplant, Meatless...),
 * so a naive substring match mislabels real veg dishes as non-veg.
 */
const MEAT_WORD_RE =
  /\b(chicken|mutton|fish|shrimp|prawn|pork|beef|lamb|goat|meat|keema|gosht|maas|egg|eggs|seafood|bacon|ham|turkey|duck|crab|lobster|saltfish|sorpotel|haleem|nihari|rogan|anda|chorizo|salmon|tuna|anchovy)\b/i;

export function containsMeatWord(text) {
  return MEAT_WORD_RE.test(String(text || ""));
}

export function browseCategoryFor(recipe) {
  const mealType = recipe.mealType || recipe.meal_type || "lunch";
  if (mealType === "snack") return "snack";
  if (isNonVegDiet(recipe.diet)) return `nonveg-${mealType}`;
  return `veg-${mealType}`;
}
