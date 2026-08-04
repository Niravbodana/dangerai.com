/** Shared diet helpers — phase3 uses "vegetarian"/"non-vegetarian"; curated uses "veg"/"non-veg". */

function list(diet) {
  if (Array.isArray(diet)) return diet.map((d) => String(d).toLowerCase());
  if (diet == null || diet === "") return [];
  return [String(diet).toLowerCase()];
}

export function isNonVegDiet(diet) {
  return list(diet).some(
    (x) => x.includes("non-veg") || x === "nonveg" || x === "non-vegetarian" || x === "nonvegetarian"
  );
}

export function isVegDiet(diet) {
  if (isNonVegDiet(diet)) return false;
  const d = list(diet);
  if (!d.length) return true; // unknown → treat as veg for Indian home cooking default
  return d.some((x) =>
    x === "veg" ||
    x === "vegetarian" ||
    x === "vegan" ||
    x === "jain" ||
    x === "eggetarian" ||
    x === "plant-based"
  );
}
