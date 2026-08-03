/**
 * Dish-profile ingredient validation — prevents onion/tomato in mithai, etc.
 */

const SWEET_RE =
  /katli|barfi|halwa|ladoo|laddu|kheer|payasam|rasgulla|sandesh|jalebi|imarti|malpua|modak|shrikhand|basundi|rabri|gulab|jamun|peda|mysore.?pak|thekua|sooji halwa|moong dal halwa|sweet pongal/i;

const BAKE_RE = /cake|muffin|brownie|cookie|pastry|bread|loaf|pizza|naan|kulcha|roti|paratha|thepla|poori|bhature/i;

const RICE_RE = /biryani|pulao|pulav|fried rice|jeera rice|lemon rice|curd rice|tomato bath|tamarind rice|khichdi|pongal/i;

const SNACK_FRIED_RE = /pakora|bhajji|bajji|vada|samosa|kachori|cutlet|tikki|chaat|momos|bond|bonda|fritter/i;

const BEVERAGE_RE = /lassi|chai|coffee|smoothie|shake|juice|sharbat/i;

const SALAD_RAITA_RE = /salad|raita|sprout|chaat(?! masala)/i;

/** Ingredients that must NOT appear in sweet/bake profiles */
export const SAVORY_STAPLES = [
  "onion",
  "tomato",
  "ginger-garlic",
  "ginger garlic",
  "turmeric",
  "red chilli",
  "chilli powder",
  "cumin seeds",
  "cumin powder",
  "coriander powder",
  "mustard seeds",
  "curry leaves",
  "garam masala",
  "coriander leaves",
  "green chilli",
];

const SWEET_EXTRAS = [
  { name: "Sugar", nameHi: "चीनी", quantity: "as needed" },
  { name: "Ghee", nameHi: "घी", quantity: "2 tbsp" },
  { name: "Cardamom powder", nameHi: "इलायची", quantity: "1/2 tsp" },
  { name: "Milk", nameHi: "दूध", quantity: "1/2 cup" },
  { name: "Saffron", nameHi: "केसर", quantity: "pinch" },
  { name: "Nuts", nameHi: "मेवा", quantity: "2 tbsp" },
];

const CURRY_EXTRAS = [
  { name: "Onion", nameHi: "प्याज", quantity: "2 medium" },
  { name: "Tomato", nameHi: "टमाटर", quantity: "2" },
  { name: "Ginger-garlic paste", nameHi: "अदrak-लहसुन", quantity: "1 tbsp" },
  { name: "Turmeric", nameHi: "हल्दी", quantity: "1/2 tsp" },
  { name: "Red chilli powder", nameHi: "लाल मिर्च", quantity: "1 tsp" },
  { name: "Cumin seeds", nameHi: "जीरा", quantity: "1 tsp" },
  { name: "Oil", nameHi: "तेल", quantity: "2 tbsp" },
  { name: "Salt", nameHi: "नमक", quantity: "to taste" },
  { name: "Coriander leaves", nameHi: "धनिया", quantity: "handful" },
];

function norm(s = "") {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function detectIngredientProfile(recipe) {
  const name = recipe?.name || "";
  const tags = (recipe?.tags || []).join(" ");
  const blob = `${name} ${tags}`;

  if (SWEET_RE.test(blob) || recipe?.mealType === "dessert") return "sweet";
  if (BEVERAGE_RE.test(blob)) return "beverage";
  if (SALAD_RAITA_RE.test(blob)) return "salad";
  if (SNACK_FRIED_RE.test(blob) && !/curry|masala|sabzi/i.test(name)) return "snack";
  if (RICE_RE.test(blob)) return "rice";
  if (BAKE_RE.test(blob)) return "bake";
  if (/soup|rasam|shorba/i.test(blob)) return "soup";
  if (/dosa|idli|uttapam|poha|upma|paratha/i.test(blob)) return "breakfast";
  return "curry";
}

function isSavoryStaple(ingredient) {
  const key = norm(ingredient?.name || "");
  return SAVORY_STAPLES.some((s) => key.includes(norm(s)));
}

function dedupe(list) {
  const seen = new Set();
  return list.filter((ing) => {
    const key = norm(ing?.name || "");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Remove profile-forbidden ingredients (e.g. onion from Kaju Katli). */
export function sanitizeIngredients(recipe, ingredients = []) {
  const profile = detectIngredientProfile(recipe);
  let list = dedupe([...ingredients]);

  if (profile === "sweet" || profile === "beverage") {
    list = list.filter((ing) => !isSavoryStaple(ing));
  }

  if (profile === "bake" && SWEET_RE.test(recipe?.name || "")) {
    list = list.filter((ing) => !isSavoryStaple(ing));
  }

  return list;
}

export function profileExtras(profile, isNonVeg = false) {
  if (profile === "sweet" || profile === "beverage") return SWEET_EXTRAS;
  if (profile === "salad") {
    return [
      { name: "Lemon juice", nameHi: "नींबू", quantity: "1 tbsp" },
      { name: "Salt", nameHi: "नमक", quantity: "to taste" },
      { name: "Black pepper", nameHi: "काली मिर्च", quantity: "1/4 tsp" },
      { name: "Cucumber", nameHi: "खीरा", quantity: "1" },
      { name: "Tomato", nameHi: "टमाटर", quantity: "1" },
      { name: "Onion", nameHi: "प्याज", quantity: "1 small" },
    ];
  }
  if (isNonVeg) {
    return [
      ...CURRY_EXTRAS,
      { name: "Yogurt", nameHi: "दही", quantity: "2 tbsp" },
      { name: "Garam masala", nameHi: "गरम मसाला", quantity: "1/2 tsp" },
    ];
  }
  return CURRY_EXTRAS;
}

export function validateIngredientSemantics(recipe) {
  const profile = detectIngredientProfile(recipe);
  const ingredients = recipe?.ingredients || [];
  const issues = [];

  if (profile === "sweet" || profile === "beverage") {
    for (const ing of ingredients) {
      if (isSavoryStaple(ing)) {
        issues.push({
          type: "forbidden-savory-in-sweet",
          ingredient: ing.name,
          profile,
        });
      }
    }
  }

  const stepText = [...(recipe.steps || []), ...(recipe.stepsHi || [])].join(" ").toLowerCase();
  for (const ing of ingredients) {
    const key = norm(ing.name);
    if (key.length > 3 && !stepText.includes(key.split(" ")[0]) && ingredients.length <= 8) {
      // soft check only for obvious mismatches
    }
  }

  return { ok: issues.length === 0, profile, issues };
}
