/**
 * Ingredient name normalization for pipeline consistency.
 */
const ALIASES = {
  "gram flour": "besan",
  "chickpea flour": "besan",
  "cilantro": "coriander leaves",
  "scallion": "spring onion",
  "eggplant": "brinjal",
  "bottle gourd": "lauki",
  "ridge gourd": "turai",
  "bitter gourd": "karela",
  "yoghurt": "curd",
  "yogurt": "curd",
  "green chili": "green chilli",
  "red chili": "red chilli",
  "chili powder": "red chilli powder",
};

const UNIT_NORMALIZE = {
  tbsp: "tablespoon",
  tsp: "teaspoon",
  gms: "g",
  gm: "g",
  kgs: "kg",
  kg: "kg",
  ml: "ml",
  l: "liter",
};

/**
 * @param {{ name: string, quantity?: string, unit?: string, nameHi?: string }[]} ingredients
 */
export function normalizeIngredients(ingredients = []) {
  return ingredients.map((ing, index) => {
    const name = normalizeIngredientName(ing.name || "");
    const parsed = parseQuantity(ing.quantity || "");
    return {
      sortOrder: index,
      name,
      nameHi: ing.nameHi || name,
      quantity: parsed.quantity,
      unit: parsed.unit || ing.unit || null,
      displayQuantity: ing.quantity || parsed.display,
      normalizedKey: name.toLowerCase().replace(/\s+/g, "-"),
    };
  });
}

export function normalizeIngredientName(raw = "") {
  let name = raw.trim().toLowerCase();
  name = name.replace(/\s+/g, " ");
  if (ALIASES[name]) return ALIASES[name];
  name = name.replace(/,\s*(chopped|diced|minced|sliced|grated|fresh|frozen).*$/i, "").trim();
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Parse "2 cups", "500g", "1/2 tsp" into structured quantity.
 */
export function parseQuantity(raw = "") {
  const s = String(raw).trim();
  if (!s) return { quantity: null, unit: null, display: "" };

  const match = s.match(/^([\d./\s]+)\s*([a-zA-Z]+)?$/);
  if (!match) return { quantity: s, unit: null, display: s };

  const numPart = match[1].trim();
  const unitRaw = (match[2] || "").toLowerCase();
  const quantity = parseFraction(numPart);
  const unit = UNIT_NORMALIZE[unitRaw] || unitRaw || null;

  return {
    quantity: Number.isFinite(quantity) ? quantity : numPart,
    unit,
    display: s,
  };
}

function parseFraction(s) {
  if (s.includes("/")) {
    const [a, b] = s.split("/").map(Number);
    if (b) return a / b;
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

export function ingredientFingerprint(ingredients = []) {
  return ingredients
    .map((i) => i.normalizedKey || normalizeIngredientName(i.name).toLowerCase())
    .sort()
    .join("|");
}
