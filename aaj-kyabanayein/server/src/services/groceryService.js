/**
 * Grocery engine — aggregation, dedup, pantry deduction, provider-ready.
 */

const INGREDIENT_ALIASES = {
  pyaz: "onion",
  onion: "onion",
  tamatar: "tomato",
  tomato: "tomato",
  aloo: "potato",
  potato: "potato",
  palak: "spinach",
  spinach: "spinach",
  gobi: "cauliflower",
  cauliflower: "cauliflower",
  chawal: "rice",
  rice: "rice",
  atta: "flour",
  flour: "flour",
  dahi: "yogurt",
  yogurt: "yogurt",
  curd: "yogurt",
  lahsun: "garlic",
  garlic: "garlic",
  adrak: "ginger",
  ginger: "ginger",
};

const CATEGORY_ORDER = [
  "Vegetables",
  "Dals & Pulses",
  "Grains",
  "Dairy",
  "Protein",
  "Spices",
  "Other",
];

export const GROCERY_PROVIDERS = {
  instamart: {
    id: "instamart",
    name: "Instamart",
    searchUrl: (query) =>
      `https://www.swiggy.com/instamart/search?custom_back=true&query=${encodeURIComponent(query)}`,
  },
  blinkit: {
    id: "blinkit",
    name: "Blinkit",
    searchUrl: (query) =>
      `https://blinkit.com/s/?q=${encodeURIComponent(query)}`,
  },
  zepto: {
    id: "zepto",
    name: "Zepto",
    searchUrl: (query) =>
      `https://www.zeptonow.com/search?query=${encodeURIComponent(query)}`,
  },
};

export function getGroceryProviders() {
  return Object.values(GROCERY_PROVIDERS);
}

export function getProviderSearchUrl(providerId, query) {
  const provider = GROCERY_PROVIDERS[providerId];
  if (!provider) return null;
  return provider.searchUrl(query || "groceries");
}

function normalizeKey(name = "") {
  const lower = name.toLowerCase().trim();
  for (const [alias, canonical] of Object.entries(INGREDIENT_ALIASES)) {
    if (lower.includes(alias)) return canonical;
  }
  return lower.replace(/[^a-z0-9\s]/g, "").trim();
}

function parseQuantity(qty = "") {
  const str = String(qty).trim();
  const frac = str.match(/(\d+)\s*\/\s*(\d+)/);
  if (frac) return { value: Number(frac[1]) / Number(frac[2]), unit: str.replace(frac[0], "").trim() || "unit" };
  const num = str.match(/([\d.]+)/);
  const value = num ? parseFloat(num[1]) : 1;
  const unit = str.replace(num?.[0] || "", "").trim() || "unit";
  return { value, unit };
}

function formatQuantity(total, unit, count) {
  const rounded = Math.round(total * 10) / 10;
  const suffix = count > 1 ? ` (${count} recipes)` : "";
  if (unit && unit !== "unit") return `${rounded} ${unit}${suffix}`;
  return `${rounded}${suffix}`;
}

export function getCategory(name) {
  const lower = name.toLowerCase();
  if (/dal|bean|lentil|rajma|chana|moong/.test(lower)) return "Dals & Pulses";
  if (/rice|flour|atta|semolina|suji|poha|bread|roti/.test(lower)) return "Grains";
  if (/paneer|milk|cream|yogurt|dahi|ghee|butter|cheese/.test(lower)) return "Dairy";
  if (/egg|chicken|fish|mutton|prawn|meat/.test(lower)) return "Protein";
  if (/cumin|turmeric|masala|spice|chili|coriander|cardamom|mustard/.test(lower)) return "Spices";
  if (/onion|tomato|potato|spinach|vegetable|cucumber|cauliflower|gobi|palak|carrot|peas/.test(lower)) {
    return "Vegetables";
  }
  return "Other";
}

function matchesPantry(name, pantryKeys = []) {
  const key = normalizeKey(name);
  return pantryKeys.some((p) => {
    const pk = normalizeKey(p);
    return key.includes(pk) || pk.includes(key);
  });
}

/** Smart grocery list from meal plans */
export function buildGroceryList(plans = [], options = {}) {
  const { pantryKeys = [], familySize = 1, deductPantry = true } = options;
  const map = new Map();

  for (const day of plans) {
    for (const meal of day.meals || []) {
      for (const ing of meal.recipe?.ingredients || []) {
        const key = normalizeKey(ing.name);
        if (!key) continue;

        const parsed = parseQuantity(ing.quantity);
        const scaled = parsed.value * Math.max(1, familySize);
        const existing = map.get(key);

        if (existing) {
          existing.total += scaled;
          existing.recipeCount += 1;
          if (!existing.nameHi && ing.nameHi) existing.nameHi = ing.nameHi;
        } else {
          map.set(key, {
            id: key,
            name: ing.name,
            nameHi: ing.nameHi || ing.name,
            total: scaled,
            unit: parsed.unit,
            recipeCount: 1,
            category: getCategory(ing.name),
          });
        }
      }
    }
  }

  const items = [...map.values()].map((item) => {
    const inPantry = matchesPantry(item.name, pantryKeys);
    const needToBuy = deductPantry ? !inPantry : true;
    return {
      id: item.id,
      name: item.name,
      nameHi: item.nameHi,
      quantity: formatQuantity(item.total, item.unit, item.recipeCount),
      category: item.category,
      inPantry,
      needToBuy,
    };
  });

  items.sort((a, b) => {
    const ca = CATEGORY_ORDER.indexOf(a.category);
    const cb = CATEGORY_ORDER.indexOf(b.category);
    return (ca === -1 ? 99 : ca) - (cb === -1 ? 99 : cb) || a.name.localeCompare(b.name);
  });

  return deductPantry ? items.filter((i) => i.needToBuy) : items;
}

/** Backward-compatible export */
export function generateGroceryList(plans, options) {
  return buildGroceryList(plans, options);
}
