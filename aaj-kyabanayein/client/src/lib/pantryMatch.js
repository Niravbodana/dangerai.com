import { loadPantry } from "./pantryStore";

function norm(s = "") {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function computePantryMatchPercent(recipe, pantryKeys) {
  const ingredients = recipe?.ingredients || [];
  if (!ingredients.length || !pantryKeys?.length) return 0;
  let hits = 0;
  for (const ing of ingredients) {
    const key = norm(ing.name || "");
    if (!key) continue;
    if (pantryKeys.some((p) => {
      const pk = norm(p);
      return key.includes(pk) || pk.includes(key);
    })) hits++;
  }
  return Math.round((hits / ingredients.length) * 100);
}

export function getPantryKeysFromStore() {
  return loadPantry().map((i) => i.key);
}

export function pantryMatchForRecipe(recipe) {
  return computePantryMatchPercent(recipe, getPantryKeysFromStore());
}
