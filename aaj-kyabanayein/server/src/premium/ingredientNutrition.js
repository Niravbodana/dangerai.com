/**
 * Verified per-100g nutrition for common Indian cooking ingredients.
 * Sources: USDA FoodData Central + ICMR-NIN aligned averages.
 * Values: energy_kcal, protein_g, carbs_g, fat_g, fiber_g per 100g edible portion.
 */

export const INGREDIENT_NUTRITION = {
  // Staples & grains
  'basmati rice': { energy_kcal: 356, protein_g: 7.5, carbs_g: 78, fat_g: 0.6, fiber_g: 1.3, source: 'USDA' },
  rice: { energy_kcal: 356, protein_g: 7.5, carbs_g: 78, fat_g: 0.6, fiber_g: 1.3, source: 'USDA' },
  'cooked rice': { energy_kcal: 130, protein_g: 2.7, carbs_g: 28, fat_g: 0.3, fiber_g: 0.4, source: 'USDA' },
  'atta flour': { energy_kcal: 340, protein_g: 12, carbs_g: 72, fat_g: 1.7, fiber_g: 11, source: 'ICMR-NIN' },
  'wheat flour': { energy_kcal: 364, protein_g: 10, carbs_g: 76, fat_g: 1, fiber_g: 2.7, source: 'USDA' },
  'maida flour': { energy_kcal: 364, protein_g: 10, carbs_g: 76, fat_g: 1, fiber_g: 2.7, source: 'USDA' },
  'besan flour': { energy_kcal: 387, protein_g: 22, carbs_g: 58, fat_g: 6.7, fiber_g: 11, source: 'ICMR-NIN' },
  'ragi flour': { energy_kcal: 328, protein_g: 7.3, carbs_g: 72, fat_g: 1.3, fiber_g: 11.5, source: 'ICMR-NIN' },
  'semolina (sooji)': { energy_kcal: 360, protein_g: 12.7, carbs_g: 72.8, fat_g: 1.1, fiber_g: 3.9, source: 'USDA' },
  oats: { energy_kcal: 389, protein_g: 16.9, carbs_g: 66, fat_g: 6.9, fiber_g: 10.6, source: 'USDA' },
  poha: { energy_kcal: 350, protein_g: 6.5, carbs_g: 77, fat_g: 1.2, fiber_g: 2.5, source: 'ICMR-NIN' },
  quinoa: { energy_kcal: 368, protein_g: 14, carbs_g: 64, fat_g: 6, fiber_g: 7, source: 'USDA' },

  // Lentils & legumes (raw dry)
  'toor dal': { energy_kcal: 343, protein_g: 22, carbs_g: 63, fat_g: 1.5, fiber_g: 15, source: 'ICMR-NIN' },
  'moong dal': { energy_kcal: 347, protein_g: 24, carbs_g: 59, fat_g: 1.2, fiber_g: 16, source: 'ICMR-NIN' },
  'masoor dal': { energy_kcal: 352, protein_g: 25, carbs_g: 60, fat_g: 1.1, fiber_g: 11, source: 'USDA' },
  'chana dal': { energy_kcal: 372, protein_g: 20, carbs_g: 61, fat_g: 5.5, fiber_g: 17, source: 'ICMR-NIN' },
  'urad dal': { energy_kcal: 341, protein_g: 25, carbs_g: 59, fat_g: 1.6, fiber_g: 18, source: 'ICMR-NIN' },
  'chickpeas (kabuli)': { energy_kcal: 364, protein_g: 19, carbs_g: 61, fat_g: 6, fiber_g: 17, source: 'USDA' },
  'black chickpeas': { energy_kcal: 360, protein_g: 20, carbs_g: 58, fat_g: 5.5, fiber_g: 18, source: 'ICMR-NIN' },
  'rajma (kidney beans)': { energy_kcal: 333, protein_g: 24, carbs_g: 60, fat_g: 0.8, fiber_g: 25, source: 'USDA' },
  'whole moong': { energy_kcal: 347, protein_g: 24, carbs_g: 63, fat_g: 1.2, fiber_g: 16, source: 'ICMR-NIN' },

  // Dairy
  milk: { energy_kcal: 61, protein_g: 3.2, carbs_g: 4.8, fat_g: 3.3, fiber_g: 0, source: 'USDA' },
  'full fat milk': { energy_kcal: 61, protein_g: 3.2, carbs_g: 4.8, fat_g: 3.3, fiber_g: 0, source: 'USDA' },
  'curd (dahi)': { energy_kcal: 61, protein_g: 3.5, carbs_g: 4.7, fat_g: 3.3, fiber_g: 0, source: 'USDA' },
  'greek yogurt': { energy_kcal: 97, protein_g: 9, carbs_g: 3.6, fat_g: 5, fiber_g: 0, source: 'USDA' },
  paneer: { energy_kcal: 265, protein_g: 18, carbs_g: 1.2, fat_g: 20.8, fiber_g: 0, source: 'ICMR-NIN' },
  ghee: { energy_kcal: 900, protein_g: 0, carbs_g: 0, fat_g: 99.8, fiber_g: 0, source: 'USDA' },
  butter: { energy_kcal: 717, protein_g: 0.9, carbs_g: 0.1, fat_g: 81, fiber_g: 0, source: 'USDA' },
  cream: { energy_kcal: 340, protein_g: 2.1, carbs_g: 2.8, fat_g: 36, fiber_g: 0, source: 'USDA' },
  cheese: { energy_kcal: 402, protein_g: 25, carbs_g: 1.3, fat_g: 33, fiber_g: 0, source: 'USDA' },
  khoa: { energy_kcal: 413, protein_g: 17.5, carbs_g: 24, fat_g: 28, fiber_g: 0, source: 'ICMR-NIN' },

  // Oils
  'mustard oil': { energy_kcal: 884, protein_g: 0, carbs_g: 0, fat_g: 100, fiber_g: 0, source: 'USDA' },
  'sunflower oil': { energy_kcal: 884, protein_g: 0, carbs_g: 0, fat_g: 100, fiber_g: 0, source: 'USDA' },
  'vegetable oil': { energy_kcal: 884, protein_g: 0, carbs_g: 0, fat_g: 100, fiber_g: 0, source: 'USDA' },
  'coconut oil': { energy_kcal: 862, protein_g: 0, carbs_g: 0, fat_g: 100, fiber_g: 0, source: 'USDA' },
  'olive oil': { energy_kcal: 884, protein_g: 0, carbs_g: 0, fat_g: 100, fiber_g: 0, source: 'USDA' },
  'sesame oil': { energy_kcal: 884, protein_g: 0, carbs_g: 0, fat_g: 100, fiber_g: 0, source: 'USDA' },

  // Vegetables
  onion: { energy_kcal: 40, protein_g: 1.1, carbs_g: 9.3, fat_g: 0.1, fiber_g: 1.7, source: 'USDA' },
  tomato: { energy_kcal: 18, protein_g: 0.9, carbs_g: 3.9, fat_g: 0.2, fiber_g: 1.2, source: 'USDA' },
  potato: { energy_kcal: 77, protein_g: 2, carbs_g: 17, fat_g: 0.1, fiber_g: 2.2, source: 'USDA' },
  garlic: { energy_kcal: 149, protein_g: 6.4, carbs_g: 33, fat_g: 0.5, fiber_g: 2.1, source: 'USDA' },
  ginger: { energy_kcal: 80, protein_g: 1.8, carbs_g: 18, fat_g: 0.8, fiber_g: 2, source: 'USDA' },
  spinach: { energy_kcal: 23, protein_g: 2.9, carbs_g: 3.6, fat_g: 0.4, fiber_g: 2.2, source: 'USDA' },
  cauliflower: { energy_kcal: 25, protein_g: 1.9, carbs_g: 5, fat_g: 0.3, fiber_g: 2, source: 'USDA' },
  cabbage: { energy_kcal: 25, protein_g: 1.3, carbs_g: 5.8, fat_g: 0.1, fiber_g: 2.5, source: 'USDA' },
  carrot: { energy_kcal: 41, protein_g: 0.9, carbs_g: 10, fat_g: 0.2, fiber_g: 2.8, source: 'USDA' },
  peas: { energy_kcal: 81, protein_g: 5.4, carbs_g: 14, fat_g: 0.4, fiber_g: 5.1, source: 'USDA' },
  'green beans': { energy_kcal: 31, protein_g: 1.8, carbs_g: 7, fat_g: 0.1, fiber_g: 2.7, source: 'USDA' },
  'bell pepper': { energy_kcal: 31, protein_g: 1, carbs_g: 6, fat_g: 0.3, fiber_g: 2.1, source: 'USDA' },
  eggplant: { energy_kcal: 25, protein_g: 1, carbs_g: 6, fat_g: 0.2, fiber_g: 3, source: 'USDA' },
  okra: { energy_kcal: 33, protein_g: 1.9, carbs_g: 7.5, fat_g: 0.2, fiber_g: 3.2, source: 'USDA' },
  bottle_gourd: { energy_kcal: 14, protein_g: 0.6, carbs_g: 3.4, fat_g: 0.02, fiber_g: 0.5, source: 'ICMR-NIN' },
  'bottle gourd': { energy_kcal: 14, protein_g: 0.6, carbs_g: 3.4, fat_g: 0.02, fiber_g: 0.5, source: 'ICMR-NIN' },
  pumpkin: { energy_kcal: 26, protein_g: 1, carbs_g: 6.5, fat_g: 0.1, fiber_g: 0.5, source: 'USDA' },
  cucumber: { energy_kcal: 15, protein_g: 0.7, carbs_g: 3.6, fat_g: 0.1, fiber_g: 0.5, source: 'USDA' },
  lemon: { energy_kcal: 29, protein_g: 1.1, carbs_g: 9.3, fat_g: 0.3, fiber_g: 2.8, source: 'USDA' },
  coriander: { energy_kcal: 23, protein_g: 2.1, carbs_g: 3.7, fat_g: 0.5, fiber_g: 2.8, source: 'USDA' },
  mint: { energy_kcal: 44, protein_g: 3.3, carbs_g: 8.4, fat_g: 0.7, fiber_g: 8, source: 'USDA' },
  'green chilli': { energy_kcal: 40, protein_g: 1.9, carbs_g: 9.5, fat_g: 0.2, fiber_g: 1.5, source: 'USDA' },
  mushroom: { energy_kcal: 22, protein_g: 3.1, carbs_g: 3.3, fat_g: 0.3, fiber_g: 1, source: 'USDA' },
  corn: { energy_kcal: 86, protein_g: 3.3, carbs_g: 19, fat_g: 1.2, fiber_g: 2.7, source: 'USDA' },
  beetroot: { energy_kcal: 43, protein_g: 1.6, carbs_g: 10, fat_g: 0.2, fiber_g: 2.8, source: 'USDA' },
  radish: { energy_kcal: 16, protein_g: 0.7, carbs_g: 3.4, fat_g: 0.1, fiber_g: 1.6, source: 'USDA' },
  fenugreek_leaves: { energy_kcal: 49, protein_g: 4.4, carbs_g: 6, fat_g: 0.9, fiber_g: 1.1, source: 'ICMR-NIN' },
  'methi leaves': { energy_kcal: 49, protein_g: 4.4, carbs_g: 6, fat_g: 0.9, fiber_g: 1.1, source: 'ICMR-NIN' },

  // Proteins
  'chicken (boneless)': { energy_kcal: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6, fiber_g: 0, source: 'USDA' },
  'chicken (with bone)': { energy_kcal: 215, protein_g: 18, carbs_g: 0, fat_g: 15, fiber_g: 0, source: 'USDA' },
  egg: { energy_kcal: 155, protein_g: 13, carbs_g: 1.1, fat_g: 11, fiber_g: 0, source: 'USDA' },
  'mutton (goat)': { energy_kcal: 143, protein_g: 27, carbs_g: 0, fat_g: 3.5, fiber_g: 0, source: 'USDA' },
  fish: { energy_kcal: 120, protein_g: 20, carbs_g: 0, fat_g: 4, fiber_g: 0, source: 'USDA' },
  prawns: { energy_kcal: 99, protein_g: 24, carbs_g: 0.2, fat_g: 0.3, fiber_g: 0, source: 'USDA' },
  tofu: { energy_kcal: 76, protein_g: 8, carbs_g: 1.9, fat_g: 4.8, fiber_g: 0.3, source: 'USDA' },

  // Spices (small amounts; still trackable)
  'cumin seeds': { energy_kcal: 375, protein_g: 18, carbs_g: 44, fat_g: 22, fiber_g: 10, source: 'USDA' },
  'mustard seeds': { energy_kcal: 508, protein_g: 26, carbs_g: 28, fat_g: 36, fiber_g: 12, source: 'USDA' },
  turmeric: { energy_kcal: 312, protein_g: 9.7, carbs_g: 67, fat_g: 3.3, fiber_g: 22, source: 'USDA' },
  'red chilli powder': { energy_kcal: 282, protein_g: 13, carbs_g: 54, fat_g: 14, fiber_g: 35, source: 'USDA' },
  'coriander powder': { energy_kcal: 298, protein_g: 12, carbs_g: 55, fat_g: 18, fiber_g: 42, source: 'USDA' },
  'garam masala': { energy_kcal: 330, protein_g: 12, carbs_g: 50, fat_g: 15, fiber_g: 20, source: 'composite' },
  'cumin powder': { energy_kcal: 375, protein_g: 18, carbs_g: 44, fat_g: 22, fiber_g: 10, source: 'USDA' },
  'asafoetida (hing)': { energy_kcal: 297, protein_g: 4, carbs_g: 68, fat_g: 1.1, fiber_g: 4, source: 'ICMR-NIN' },
  salt: { energy_kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, source: 'USDA' },
  sugar: { energy_kcal: 387, protein_g: 0, carbs_g: 100, fat_g: 0, fiber_g: 0, source: 'USDA' },
  jaggery: { energy_kcal: 383, protein_g: 0.4, carbs_g: 98, fat_g: 0.1, fiber_g: 0, source: 'ICMR-NIN' },
  'black pepper': { energy_kcal: 251, protein_g: 10, carbs_g: 64, fat_g: 3.3, fiber_g: 25, source: 'USDA' },
  cardamom: { energy_kcal: 311, protein_g: 11, carbs_g: 68, fat_g: 6.7, fiber_g: 28, source: 'USDA' },
  cinnamon: { energy_kcal: 247, protein_g: 4, carbs_g: 81, fat_g: 1.2, fiber_g: 53, source: 'USDA' },
  cloves: { energy_kcal: 274, protein_g: 6, carbs_g: 66, fat_g: 13, fiber_g: 34, source: 'USDA' },
  'bay leaf': { energy_kcal: 313, protein_g: 7.6, carbs_g: 75, fat_g: 8.4, fiber_g: 26, source: 'USDA' },
  'kasuri methi': { energy_kcal: 49, protein_g: 4.4, carbs_g: 6, fat_g: 0.9, fiber_g: 1.1, source: 'ICMR-NIN' },
  'curry leaves': { energy_kcal: 108, protein_g: 6.1, carbs_g: 18.7, fat_g: 1, fiber_g: 6.4, source: 'ICMR-NIN' },
  'fenugreek seeds': { energy_kcal: 323, protein_g: 23, carbs_g: 58, fat_g: 6.4, fiber_g: 25, source: 'USDA' },

  // Nuts & others
  cashews: { energy_kcal: 553, protein_g: 18, carbs_g: 30, fat_g: 44, fiber_g: 3.3, source: 'USDA' },
  almonds: { energy_kcal: 579, protein_g: 21, carbs_g: 22, fat_g: 50, fiber_g: 12.5, source: 'USDA' },
  peanuts: { energy_kcal: 567, protein_g: 26, carbs_g: 16, fat_g: 49, fiber_g: 8.5, source: 'USDA' },
  coconut: { energy_kcal: 354, protein_g: 3.3, carbs_g: 15, fat_g: 33, fiber_g: 9, source: 'USDA' },
  'coconut milk': { energy_kcal: 230, protein_g: 2.3, carbs_g: 6, fat_g: 24, fiber_g: 2.2, source: 'USDA' },
  tamarind: { energy_kcal: 239, protein_g: 2.8, carbs_g: 63, fat_g: 0.6, fiber_g: 5.1, source: 'USDA' },
  'coconut grated': { energy_kcal: 354, protein_g: 3.3, carbs_g: 15, fat_g: 33, fiber_g: 9, source: 'USDA' },
  bread: { energy_kcal: 265, protein_g: 9, carbs_g: 49, fat_g: 3.2, fiber_g: 2.7, source: 'USDA' },
  'idli rice': { energy_kcal: 356, protein_g: 7.5, carbs_g: 78, fat_g: 0.6, fiber_g: 1.3, source: 'USDA' },
  'water': { energy_kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, source: 'USDA' },
};

/** Parse "200 g basmati rice" / "2 tbsp ghee" / "1 tsp salt" into grams */
export function parseQuantityToGrams(qty, unit, name) {
  const q = Number(qty) || 0;
  const u = String(unit || '').toLowerCase().trim();
  if (['g', 'gram', 'grams', 'gm'].includes(u)) return q;
  if (['kg', 'kilogram'].includes(u)) return q * 1000;
  if (['ml', 'millilitre', 'milliliter'].includes(u)) return q; // approx 1:1 for liquids
  if (['l', 'litre', 'liter'].includes(u)) return q * 1000;
  if (['tsp', 'teaspoon', 'teaspoons'].includes(u)) return q * 4;
  if (['tbsp', 'tablespoon', 'tablespoons'].includes(u)) return q * 14;
  if (['cup', 'cups'].includes(u)) {
    const n = String(name || '').toLowerCase();
    if (n.includes('flour') || n.includes('atta') || n.includes('besan') || n.includes('sooji')) return q * 120;
    if (n.includes('rice') || n.includes('dal') || n.includes('lentil')) return q * 200;
    if (n.includes('milk') || n.includes('water') || n.includes('curd') || n.includes('oil')) return q * 240;
    if (n.includes('sugar') || n.includes('jaggery')) return q * 200;
    return q * 150;
  }
  if (['piece', 'pieces', 'pc', 'pcs', 'whole', 'clove', 'cloves'].includes(u)) {
    const n = String(name || '').toLowerCase();
    if (n.includes('onion')) return q * 110;
    if (n.includes('tomato')) return q * 100;
    if (n.includes('potato')) return q * 150;
    if (n.includes('egg')) return q * 50;
    if (n.includes('garlic')) return q * 3;
    if (n.includes('green chilli') || n.includes('chili')) return q * 5;
    if (n.includes('lemon')) return q * 60;
    if (n.includes('bay')) return q * 0.5;
    if (n.includes('curry leaf') || n.includes('curry leaves')) return q * 0.3;
    if (n.includes('cardamom') || n.includes('clove')) return q * 0.2;
    return q * 50;
  }
  if (['pinch', 'to taste'].includes(u) || u === '') return Math.max(q, 1);
  return q;
}

export function lookupIngredientNutrition(name) {
  const n = String(name || '').toLowerCase().trim();
  if (INGREDIENT_NUTRITION[n]) return { key: n, ...INGREDIENT_NUTRITION[n] };
  // fuzzy contains
  const keys = Object.keys(INGREDIENT_NUTRITION).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (n.includes(k) || k.includes(n)) return { key: k, ...INGREDIENT_NUTRITION[k] };
  }
  // common aliases
  const aliases = {
    'jeera': 'cumin seeds',
    'haldi': 'turmeric',
    'lal mirch': 'red chilli powder',
    'dhania powder': 'coriander powder',
    'hing': 'asafoetida (hing)',
    'dahi': 'curd (dahi)',
    'yogurt': 'curd (dahi)',
    'chawal': 'basmati rice',
    'mirch': 'green chilli',
    'adrak': 'ginger',
    'lahsun': 'garlic',
    'pyaz': 'onion',
    'tamatar': 'tomato',
    'aloo': 'potato',
    'palak': 'spinach',
    'gobhi': 'cauliflower',
    'bhindi': 'okra',
    'baingan': 'eggplant',
    'matar': 'peas',
    'methi': 'methi leaves',
    'pudina': 'mint',
    'dhania': 'coriander',
    'namak': 'salt',
    'chini': 'sugar',
    'tel': 'vegetable oil',
    'sarson oil': 'mustard oil',
  };
  for (const [a, k] of Object.entries(aliases)) {
    if (n.includes(a) && INGREDIENT_NUTRITION[k]) return { key: k, ...INGREDIENT_NUTRITION[k] };
  }
  return null;
}

/**
 * Compute verified nutrition for a list of ingredients with quantities.
 * Returns per-serving macros + verification metadata.
 */
export function computeVerifiedNutrition(ingredients, servings = 4) {
  const s = Math.max(1, Number(servings) || 4);
  let energy = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  let fiber = 0;
  let matched = 0;
  let totalGrams = 0;
  const sources = new Set();
  const unmatched = [];

  for (const ing of ingredients || []) {
    const name = ing.name || ing.ingredient || '';
    const grams = ing.grams != null
      ? Number(ing.grams)
      : parseQuantityToGrams(ing.qty ?? ing.quantity, ing.unit, name);
    const nut = lookupIngredientNutrition(name);
    if (!nut || !grams) {
      unmatched.push(name);
      continue;
    }
    matched += 1;
    totalGrams += grams;
    const factor = grams / 100;
    energy += nut.energy_kcal * factor;
    protein += nut.protein_g * factor;
    carbs += nut.carbs_g * factor;
    fat += nut.fat_g * factor;
    fiber += nut.fiber_g * factor;
    if (nut.source) sources.add(nut.source);
  }

  const coverage = ingredients?.length ? matched / ingredients.length : 0;
  const verified = coverage >= 0.85 && matched >= 5;

  return {
    energy_kcal: Math.round(energy / s),
    protein_g: Math.round((protein / s) * 10) / 10,
    carbs_g: Math.round((carbs / s) * 10) / 10,
    fat_g: Math.round((fat / s) * 10) / 10,
    fiber_g: Math.round((fiber / s) * 10) / 10,
    per_serving: true,
    servings: s,
    verified,
    coverage: Math.round(coverage * 100) / 100,
    matched_ingredients: matched,
    total_ingredients: ingredients?.length || 0,
    total_recipe_grams: Math.round(totalGrams),
    sources: [...sources],
    unmatched: unmatched.slice(0, 8),
    method: 'ingredient_sum_usda_icmr',
  };
}
