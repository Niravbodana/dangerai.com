/**
 * Ingredient unit conversion to metric (grams/ml) for nutrition calculation.
 */
const TO_GRAMS = {
  g: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  mg: 0.001,
  oz: 28.35,
  lb: 453.592,
  cup: 240,
  tablespoon: 15,
  tbsp: 15,
  teaspoon: 5,
  tsp: 5,
  ml: 1,
  liter: 1000,
  l: 1000,
  piece: 80,
  pcs: 80,
  pinch: 0.5,
};

const DENSITY_G_PER_ML = {
  water: 1,
  milk: 1.03,
  oil: 0.92,
  ghee: 0.91,
  flour: 0.53,
  sugar: 0.85,
  rice: 0.75,
};

/**
 * @param {{ quantity?: number|string, unit?: string, name?: string }} ing
 * @returns {{ grams: number|null, ml: number|null, display: string }}
 */
export function convertToMetric(ing) {
  const qty = typeof ing.quantity === "number" ? ing.quantity : parseFloat(String(ing.quantity));
  const unit = (ing.unit || "").toLowerCase().trim();

  if (!Number.isFinite(qty)) {
    return { grams: null, ml: null, display: ing.quantity || "" };
  }

  if (unit in TO_GRAMS) {
    const factor = TO_GRAMS[unit];
    if (["ml", "liter", "l", "cup"].includes(unit)) {
      return { grams: null, ml: qty * factor, display: `${qty} ${unit}` };
    }
    return { grams: qty * factor, ml: null, display: `${qty} ${unit}` };
  }

  const density = guessDensity(ing.name);
  if (density) {
    return { grams: qty * density * 30, ml: qty * 30, display: `${qty} (est.)` };
  }

  return { grams: qty * 30, ml: null, display: `${qty}` };
}

export function normalizeAllUnits(ingredients = []) {
  return ingredients.map((ing) => {
    const metric = convertToMetric(ing);
    return {
      ...ing,
      metricGrams: metric.grams,
      metricMl: metric.ml,
      displayQuantity: metric.display || ing.displayQuantity,
    };
  });
}

function guessDensity(name = "") {
  const n = name.toLowerCase();
  for (const [key, val] of Object.entries(DENSITY_G_PER_ML)) {
    if (n.includes(key)) return val;
  }
  return null;
}
