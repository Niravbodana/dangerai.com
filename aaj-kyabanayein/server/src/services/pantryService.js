import { filterRecipeIndex, getRecipeById } from "../data/recipes.js";

const PANTRY_ALIASES = {
  aloo: ["aloo", "potato", "आलू"],
  pyaz: ["pyaz", "onion", "प्याज"],
  tamatar: ["tamatar", "tomato", "टमाटर"],
  gobi: ["gobi", "cauliflower", "गोभी"],
  palak: ["palak", "spinach", "पालक"],
  paneer: ["paneer", "पनीर"],
  chawal: ["chawal", "rice", "चावल"],
  dal: ["dal", "toor", "moong", "अरहर", "दाल"],
  atta: ["atta", "wheat", "flour", "आटा"],
  besan: ["besan", "बेसन"],
  egg: ["egg", "अंडा", "ande"],
  chicken: ["chicken", "चिकन"],
  mutton: ["mutton", "मटन"],
  fish: ["fish", "मछली"],
  chana: ["chana", "chickpea", "छोले"],
  rajma: ["rajma", "राजमा"],
  dahi: ["dahi", "yogurt", "curd", "दही"],
  suji: ["suji", "semolina", "सूजी"],
  poha: ["poha", "पोहा"],
  moong: ["moong", "मूंग", "sprout"],
  sabzi: ["sabzi", "vegetable", "सब्जी"],
  masala: ["masala", "spice", "मसाला"],
  adrak: ["adrak", "ginger", "अदrak"],
  lahsun: ["lahsun", "garlic", "लहसुन"],
};

function normalizePantryItem(item) {
  return item.toLowerCase().trim();
}

function expandPantry(items) {
  const expanded = new Set();
  for (const item of items.map(normalizePantryItem)) {
    expanded.add(item);
    for (const [key, aliases] of Object.entries(PANTRY_ALIASES)) {
      if (aliases.some((a) => item.includes(a) || a.includes(item))) {
        expanded.add(key);
        aliases.forEach((a) => expanded.add(a));
      }
    }
  }
  return expanded;
}

function getRecipePantryKeys(recipe) {
  const keys = new Set();
  for (const k of recipe.pantryKeys || []) keys.add(normalizePantryItem(k));
  for (const ing of recipe.ingredients || []) {
    keys.add(normalizePantryItem(ing.name));
    keys.add(normalizePantryItem(ing.nameHi));
  }
  return keys;
}

function scoreRecipe(recipe, userPantry) {
  const recipeKeys = getRecipePantryKeys(recipe);
  let matchCount = 0;
  for (const key of recipeKeys) {
    for (const userItem of userPantry) {
      if (key.includes(userItem) || userItem.includes(key)) {
        matchCount++;
        break;
      }
    }
  }
  const totalNeeded = Math.max(recipeKeys.size, 1);
  const matchPercent = Math.round((matchCount / totalNeeded) * 100);
  const missing = [...recipeKeys].filter(
    (k) => ![...userPantry].some((u) => k.includes(u) || u.includes(k))
  );
  return { matchCount, matchPercent, missing: missing.slice(0, 5) };
}

/** Exported for AI personalization pipeline */
export function scoreRecipePantryMatch(recipe, ingredients = []) {
  return scoreRecipe(recipe, expandPantry(ingredients));
}

export function suggestFromPantry({
  ingredients = [],
  diet = "veg",
  mealType = null,
  category = null,
  limit = 20,
}) {
  const userPantry = expandPantry(ingredients);

  let pool = filterRecipeIndex({ mealType, category, diet }).slice(0, 300);

  const scored = pool
    .map((meta) => {
      const recipe = getRecipeById(meta.id);
      if (!recipe) return null;
      const score = scoreRecipe(recipe, userPantry);
      return { recipe, ...score };
    })
    .filter(Boolean)
    .filter((s) => s.matchCount > 0)
    .sort((a, b) => b.matchPercent - a.matchPercent || b.matchCount - a.matchCount);

  return {
    total: scored.length,
    suggestions: scored.slice(0, limit).map((s) => ({
      ...s.recipe,
      matchPercent: s.matchPercent,
      matchedIngredients: s.matchCount,
      missingIngredients: s.missing,
    })),
  };
}

export const COMMON_PANTRY_ITEMS = [
  { key: "aloo", label: "Aloo", labelHi: "आलू" },
  { key: "pyaz", label: "Pyaz", labelHi: "प्याज" },
  { key: "tamatar", label: "Tamatar", labelHi: "टमाटर" },
  { key: "gobi", label: "Gobi", labelHi: "गोभी" },
  { key: "palak", label: "Palak", labelHi: "पालक" },
  { key: "paneer", label: "Paneer", labelHi: "पनीर" },
  { key: "chawal", label: "Chawal", labelHi: "चावल" },
  { key: "dal", label: "Dal", labelHi: "दाल" },
  { key: "atta", label: "Atta", labelHi: "आटा" },
  { key: "besan", label: "Besan", labelHi: "बेसन" },
  { key: "egg", label: "Anda", labelHi: "अंडा" },
  { key: "chicken", label: "Chicken", labelHi: "चिकन" },
  { key: "mutton", label: "Mutton", labelHi: "मटन" },
  { key: "fish", label: "Fish", labelHi: "मछली" },
  { key: "chana", label: "Chana", labelHi: "चना" },
  { key: "rajma", label: "Rajma", labelHi: "राजमा" },
  { key: "dahi", label: "Dahi", labelHi: "दही" },
  { key: "poha", label: "Poha", labelHi: "पोहा" },
  { key: "moong", label: "Moong", labelHi: "मूंग" },
  { key: "adrak", label: "Adrak", labelHi: "अदरक" },
  { key: "lahsun", label: "Lahsun", labelHi: "लहसुन" },
  { key: "suji", label: "Suji", labelHi: "सूजी" },
  { key: "milk", label: "Milk", labelHi: "दूध" },
  { key: "butter", label: "Butter", labelHi: "मक्खन" },
];
