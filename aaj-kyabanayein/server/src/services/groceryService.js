/**
 * Grocery engine — aggregation, dedup, pantry deduction, provider-ready.
 */
import { getPartnerList, buildPartnerSearchUrl, isPartnerComingSoon } from "./siteConfigService.js";

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

export function getGroceryProviders() {
  return getPartnerList().map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type || "grocery",
    comingSoon: Boolean(p.comingSoon),
    enabled: p.enabled !== false,
    searchUrl: buildPartnerSearchUrl(p.id, "groceries"),
  }));
}

export function getProviderSearchUrl(providerId, query) {
  return buildPartnerSearchUrl(providerId, query || "groceries");
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

const ESSENTIAL_STAPLES = [
  { key: "onion", label: "Onion", labelHi: "प्याज", minQty: 2 },
  { key: "tomato", label: "Tomato", labelHi: "टमाटर", minQty: 3 },
  { key: "potato", label: "Potato", labelHi: "आलू", minQty: 2 },
  { key: "milk", label: "Milk", labelHi: "दूध", minQty: 1 },
  { key: "atta", label: "Flour", labelHi: "आटा", minQty: 1 },
  { key: "rice", label: "Rice", labelHi: "चावल", minQty: 1 },
  { key: "oil", label: "Oil", labelHi: "तेल", minQty: 1 },
];

/** Compare provider deep-links for one item (no fake prices — links only). */
export function compareProvidersForItem(itemName) {
  const query = itemName || "groceries";
  return getPartnerList().map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type || "grocery",
    comingSoon: isPartnerComingSoon(p.id),
    url: buildPartnerSearchUrl(p.id, query),
  }));
}

/** Auto-restock: essentials missing or low in pantry payload. */
export function getRestockSuggestions(pantryItems = []) {
  const byKey = new Map();
  for (const item of pantryItems) {
    const key = normalizeKey(item.key || item.label || item.name || "");
    if (key) byKey.set(key, item);
  }

  const suggestions = [];
  for (const staple of ESSENTIAL_STAPLES) {
    const found = byKey.get(staple.key);
    const qty = found ? parseQuantity(found.quantity || found.qty || "1").value : 0;
    if (!found || qty < staple.minQty) {
      suggestions.push({
        id: staple.key,
        name: staple.label,
        nameHi: staple.labelHi,
        reason: !found ? "missing" : "low-stock",
        suggestedQty: staple.minQty,
        providers: compareProvidersForItem(staple.label),
      });
    }
  }
  return suggestions;
}

export function computePantryMatchPercent(recipe, pantryKeys = []) {
  const ingredients = recipe?.ingredients || [];
  if (!ingredients.length || !pantryKeys.length) return 0;
  let hits = 0;
  for (const ing of ingredients) {
    const key = normalizeKey(ing.name);
    if (pantryKeys.some((p) => {
      const pk = normalizeKey(p);
      return key.includes(pk) || pk.includes(key);
    })) hits++;
  }
  return Math.round((hits / ingredients.length) * 100);
}
