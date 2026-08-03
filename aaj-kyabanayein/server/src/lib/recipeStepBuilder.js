/**
 * Ingredient-aware recipe step & ingredient builder for all curated recipes.
 * Ensures 6+ ingredients, 5+ steps, and key ingredients mentioned in steps (EN + HI).
 */
import {
  COMMON_STAPLES,
  STYLE_EXTRAS,
  VEG_BASE,
  NONVEG_BASE,
} from "../data/recipeTemplates.js";
import { hasDevanagari, isGenericSteps } from "./recipeQuality.js";

const MIN_INGREDIENTS = 6;
const MIN_STEPS = 5;
const MAX_STEPS = 8;

const STYLE_RE =
  /(Curry|Fry|Sabzi|Pulao|Masala|Tikka|Korma|Bharta|Soup|Paratha|Khichdi|Raita|Biryani|Salad|Chutney|Dosa|Idli|Vada|Pakora|Kebab|Roll|Wrap)/i;

const AROMATIC_KEYS = ["onion", "garlic", "ginger", "cumin", "mustard", "curry leaf", "green chilli"];
const SPICE_KEYS = ["turmeric", "chilli", "coriander powder", "garam masala", "cumin powder"];
const LIQUID_KEYS = ["water", "stock", "yogurt", "milk", "cream", "coconut"];
const GARNISH_KEYS = ["coriander", "lemon", "mint", "cashew", "butter", "ghee"];

function norm(s = "") {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function ingKey(ing) {
  return norm(ing?.name || "");
}

function detectStyle(recipe) {
  const name = recipe.name || "";
  if (/cake|muffin|brownie|cookie|pastry|torta|bread|loaf/i.test(name)) return "Bake";
  const match = name.match(STYLE_RE);
  if (match) return match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
  if (/salad|raita/i.test(recipe.name || "")) return "Salad";
  if (/biryani|pulao/i.test(recipe.name || "")) return "Pulao";
  if (/paratha|roti|naan/i.test(recipe.name || "")) return "Paratha";
  if (/soup|rasam|shorba/i.test(recipe.name || "")) return "Soup";
  if (/khichdi/i.test(recipe.name || "")) return "Khichdi";
  return "Curry";
}

function dedupeIngredients(list) {
  const seen = new Set();
  return list.filter((ing) => {
    const key = ingKey(ing);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function pickExtras(style, isNonVeg) {
  const styleExtras = STYLE_EXTRAS[style] || STYLE_EXTRAS.Curry;
  const base = isNonVeg ? NONVEG_BASE : VEG_BASE;
  return [...base.slice(0, 4), ...styleExtras.slice(0, 3), ...COMMON_STAPLES];
}

/** Grow thin ingredient lists to MIN_INGREDIENTS using pantry staples. */
export function expandIngredients(recipe, ingredients = recipe.ingredients || []) {
  const isNonVeg = recipe.diet?.includes("non-veg");
  const style = detectStyle(recipe);
  let list = dedupeIngredients([...ingredients]);

  if (list.length >= MIN_INGREDIENTS) return list;

  const main =
    list[0] ||
    {
      name: (recipe.name || "Main ingredient").split(/[,&(]/)[0].trim(),
      nameHi: recipe.nameHi || recipe.name || "मुख्य सामग्री",
      quantity: "as needed",
    };

  const extras = pickExtras(style, isNonVeg);
  list = dedupeIngredients([main, ...list.slice(1), ...extras]);

  while (list.length < MIN_INGREDIENTS && extras.length) {
    const next = extras[list.length % extras.length];
    list = dedupeIngredients([...list, next]);
    if (list.length >= MIN_INGREDIENTS) break;
    list.push({ name: "Salt", nameHi: "नमक", quantity: "to taste" });
    list = dedupeIngredients(list);
  }

  return list.slice(0, 10);
}

function bucketIngredients(ingredients) {
  const buckets = { main: [], aromatic: [], spice: [], liquid: [], garnish: [], other: [] };
  for (const ing of ingredients) {
    const key = ingKey(ing);
    if (buckets.main.length === 0 && !AROMATIC_KEYS.some((k) => key.includes(k)) && !SPICE_KEYS.some((k) => key.includes(k))) {
      buckets.main.push(ing);
    } else if (AROMATIC_KEYS.some((k) => key.includes(k))) buckets.aromatic.push(ing);
    else if (SPICE_KEYS.some((k) => key.includes(k))) buckets.spice.push(ing);
    else if (LIQUID_KEYS.some((k) => key.includes(k))) buckets.liquid.push(ing);
    else if (GARNISH_KEYS.some((k) => key.includes(k))) buckets.garnish.push(ing);
    else buckets.other.push(ing);
  }
  if (!buckets.main.length && ingredients[0]) buckets.main.push(ingredients[0]);
  return buckets;
}

function names(ings, lang = "en") {
  return ings.map((i) => (lang === "hi" ? i.nameHi || i.name : i.name)).filter(Boolean);
}

function joinNames(list, lang = "en") {
  const n = names(list, lang);
  if (n.length <= 1) return n[0] || "";
  if (n.length === 2) return `${n[0]} and ${n[1]}`;
  if (n.length <= 5) return `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}`;
  return `${n.slice(0, 4).join(", ")}, ${n[4]} and more`;
}

function spreadIngredientsAcrossSteps(ingredients, lang = "en") {
  const chunks = [];
  const size = Math.max(2, Math.ceil(ingredients.length / 3));
  for (let i = 0; i < ingredients.length; i += size) {
    chunks.push(joinNames(ingredients.slice(i, i + size), lang));
  }
  return chunks;
}

export function ingredientCoverage(steps, ingredients) {
  const text = norm((steps || []).join(" "));
  if (!ingredients.length) return 1;
  if (/all (the )?ingredients|every ingredient|सारी सामग्री|सभी सामग्री/.test(text)) return 1;
  let hit = 0;
  for (const ing of ingredients) {
    const words = norm(ing.name).split(" ").filter((w) => w.length > 3);
    if (words.some((w) => text.includes(w))) hit++;
    else if (words.length > 1 && text.includes(words[0])) hit++;
    else if (ing.nameHi && hasDevanagari(ing.nameHi) && text.includes(norm(ing.nameHi))) hit++;
  }
  return hit / ingredients.length;
}

function avgStepLength(steps) {
  if (!steps?.length) return 0;
  return steps.reduce((s, line) => s + line.length, 0) / steps.length;
}

/** Split very long steps into shorter cook-mode friendly lines. */
export function expandStepCount(steps, minCount = MIN_STEPS) {
  if (!steps?.length) return [];
  if (steps.length >= minCount) return steps.slice(0, MAX_STEPS);

  const parts = [];
  for (const step of steps) {
    const sentences = step
      .split(/(?<=[.!?])\s+(?=[A-Z0-9"'])|(?<=\.)\s+(?=Then|Next|Add|Heat|Mix|Serve|Drain|Cover)/)
      .map((s) => s.trim())
      .filter((s) => s.length > 25);
    if (sentences.length > 1) parts.push(...sentences);
    else parts.push(step.trim());
  }

  const unique = [...new Set(parts.map((p) => p.trim()).filter(Boolean))];
  if (unique.length >= minCount) return unique.slice(0, MAX_STEPS);

  while (unique.length < minCount) {
    unique.push("Check seasoning, garnish and serve hot with sides of your choice.");
    if (unique.length >= minCount) break;
  }
  return unique.slice(0, MAX_STEPS);
}

export function stepsNeedReplacement(recipe, steps, ingredients) {
  if (!steps?.length) return true;
  if (isGenericSteps(steps)) return true;
  if (steps.length < MIN_STEPS && avgStepLength(steps) < 90) return true;
  if (ingredientCoverage(steps, ingredients) < 0.35) return true;
  return false;
}

function buildEnSteps(recipe, ingredients) {
  const style = detectStyle(recipe);
  const isNonVeg = recipe.diet?.includes("non-veg");
  const buckets = bucketIngredients(ingredients);
  const main = joinNames(buckets.main) || recipe.name;
  const aromatics = joinNames(buckets.aromatic) || "onion and ginger-garlic";
  const spices = joinNames(buckets.spice) || "turmeric, red chilli and garam masala";
  const extras = joinNames([...buckets.other, ...buckets.liquid].slice(0, 3));
  const garnish = joinNames(buckets.garnish) || "fresh coriander and lemon";
  const spread = spreadIngredientsAcrossSteps(ingredients);

  if (style === "Bake") {
    const dry = joinNames(ingredients.filter((i) => /flour|sugar|soda|powder|oats|cinnamon|nutmeg|salt/i.test(i.name)).slice(0, 6));
    const wet = joinNames(ingredients.filter((i) => /milk|egg|butter|oil|yogurt|vanilla|lime|lemon/i.test(i.name)).slice(0, 5));
    const addIns = joinNames(ingredients.filter((i) => /coconut|raisin|nut|fruit|chocolate/i.test(i.name)).slice(0, 4));
    return [
      `Preheat oven to 180°C (or as recipe needs). Grease or line your baking tin.`,
      `Mix dry ingredients${dry ? `: ${dry}` : ""} in a large bowl.`,
      `Whisk wet ingredients${wet ? `: ${wet}` : ""} until smooth.`,
      `Fold wet into dry. Add ${addIns || spread[1] || main} gently.`,
      `Pour batter into tin. Bake until set and golden — test with a skewer.`,
      `Cool slightly. Garnish with ${garnish || "a light topping"} and serve.`,
    ].slice(0, MAX_STEPS);
  }

  if (isNonVeg) {
    return [
      `Marinate ${main} with yogurt, ${spices} and salt for 20–30 minutes.`,
      `Heat oil in a heavy pan. Sauté ${aromatics} until golden and fragrant.`,
      `Add tomatoes and remaining spices. Cook until oil separates at the edges.`,
      `Add ${main}${extras ? `, ${extras}` : ""} and a splash of water. Cover and cook on medium heat until tender.`,
      `Simmer until gravy coats the pieces. Adjust salt and spice.`,
      `Finish with ${garnish}. Serve hot with rice, roti or naan.`,
    ].slice(0, MAX_STEPS);
  }

  if (/salad|raita/i.test(recipe.name || "") || style === "Salad" || style === "Raita") {
    return [
      `Wash and prep ${main}${extras ? `, ${extras}` : ""}. Chop uniformly.`,
      `Combine ${main} with ${aromatics} in a mixing bowl.`,
      `Add ${spices}, salt and any dressing ingredients. Toss gently.`,
      `Rest 5 minutes so flavours meld.`,
      `Garnish with ${garnish} and serve fresh.`,
    ];
  }

  if (style === "Pulao" || /biryani/i.test(recipe.name || "")) {
    return [
      `Rinse and soak rice. Prep ${main} and vegetables.`,
      `Heat ghee/oil. Temper whole spices and sauté ${aromatics}.`,
      `Add ${main}, ${spices} and yogurt. Cook until lightly golden.`,
      `Layer parboiled rice over the masala. Add saffron or water if needed.`,
      `Dum cook on low heat 12–15 minutes. Rest 5 minutes.`,
      `Garnish with ${garnish}. Serve hot.`,
    ].slice(0, MAX_STEPS);
  }

  return [
    `Gather and prep ${spread[0] || main}${spread[1] ? `, ${spread[1]}` : ""} — wash, peel and cut as needed.`,
    `Heat oil in a pan. Crackle cumin or mustard seeds; add ${aromatics} and sauté until soft.`,
    `Stir in ${spices}${extras ? `, ${extras}` : ""} and tomatoes. Cook until the masala releases aroma.`,
    `Add ${main}${spread[2] ? ` and ${spread[2]}` : ""} with a little water. Cover and cook on medium until done.`,
    `Simmer to ${style.toLowerCase()} consistency. Adjust salt and spice.`,
    `Garnish with ${garnish}. Serve hot with roti, rice or bread.`,
  ].slice(0, MAX_STEPS);
}

function buildHiSteps(recipe, ingredients) {
  const style = detectStyle(recipe);
  const isNonVeg = recipe.diet?.includes("non-veg");
  const buckets = bucketIngredients(ingredients);
  const main = joinNames(buckets.main, "hi") || recipe.nameHi || recipe.name;
  const aromatics = joinNames(buckets.aromatic, "hi") || "प्याज और अदrak-लहसुन";
  const spices = joinNames(buckets.spice, "hi") || "हल्दी, लाल मिर्च और गरम मसाला";
  const extras = joinNames([...buckets.other, ...buckets.liquid].slice(0, 3), "hi");
  const garnish = joinNames(buckets.garnish, "hi") || "धनिया और नींबू";
  const spread = spreadIngredientsAcrossSteps(ingredients, "hi");

  if (style === "Bake") {
    return [
      `ओवन १८०°C पर प्रीहीट करें। बेकिंग टिन तैयार करें।`,
      `सूखी सामग्री (${spread[0] || main}) एक बाउल में मिलाएं।`,
      `गीली सामग्री (${spread[1] || extras || "दूध/अंडे"}) अलग से फेंटें।`,
      `सूखी और गीली सामग्री धीरे-धीरे मिलाएं। ${spread[2] || main} डालें।`,
      `टिन में डालकर सुनहरा होने तक बेक करें।`,
      `${garnish} से सजाकर परोसें।`,
    ];
  }

  if (isNonVeg) {
    return [
      `${main} को दही, ${spices} और नमक में २०–३० मिनट मैरिनेट करें।`,
      `कड़ाही में तेल गर्म करें। ${aromatics} सुनहरा होने तक भूनें।`,
      `टमाटर और बाकी मसाले डालकर तेल अलग होने तक पकाएं।`,
      `${main}${extras ? `, ${extras}` : ""} और थोड़ा पानी डालकर ढककर नरम होने तक पकाएं।`,
      `ग्रेवी गाढ़ी करें। नमक और मसाला चखकर ठीक करें।`,
      `${garnish} से गार्निश करके गरमागरम चावल या रोटी के साथ परोसें।`,
    ].slice(0, MAX_STEPS);
  }

  if (/salad|raita/i.test(recipe.name || "") || style === "Salad" || style === "Raita") {
    return [
      `${main}${extras ? `, ${extras}` : ""} धोकर काटें।`,
      `बाउल में ${main} और ${aromatics} मिलाएं।`,
      `${spices} और नमक डालकर हल्के हाथ से मिलाएं।`,
      `५ मिनट रखें ताकि स्वाद मिल जाए।`,
      `${garnish} से सजाकर तुरंत परोसें।`,
    ];
  }

  return [
    `${spread[0] || main}${spread[1] ? `, ${spread[1]}` : ""} धोकर तैयार करें।`,
    `तेल गर्म करें, जीरा/राई तड़काएं, फिर ${aromatics} भूनें।`,
    `${spices}${extras ? `, ${extras}` : ""} और टमाटर डालकर मसाला भूनें।`,
    `${main}${spread[2] ? ` और ${spread[2]}` : ""} और थोड़ा पानी डालकर ढककर पकाएं।`,
    `${style} जैसी गाढ़ाई आने तक पकाएं। नमक चखें।`,
    `${garnish} से गार्निश करके गरम परोसें।`,
  ].slice(0, MAX_STEPS);
}

/** Pad handcrafted short steps with a prep + serve line referencing ingredients. */
function padHandcraftedSteps(steps, ingredients, lang) {
  if (steps.length >= MIN_STEPS) return steps;
  const main = joinNames(bucketIngredients(ingredients).main, lang) || "";
  const garnish = joinNames(bucketIngredients(ingredients).garnish, lang) || (lang === "hi" ? "धनिया" : "coriander");
  const prep =
    lang === "hi"
      ? `सारी सामग्री तैयार करें${main ? ` — ${main} धोकर काट लें` : ""}।`
      : `Gather and prep all ingredients${main ? ` — wash and cut ${main}` : ""}.`;
  const serve =
    lang === "hi"
      ? `${garnish} से गार्निश करके गरमागरम परोसें।`
      : `Garnish with ${garnish} and serve hot.`;
  const out = [prep, ...steps];
  while (out.length < MIN_STEPS) out.push(serve);
  return out.slice(0, MAX_STEPS);
}

export function buildIngredientAwareSteps(recipe, ingredients, existingSteps = [], existingHi = []) {
  let steps = existingSteps?.length ? [...existingSteps] : [];
  let stepsHi = existingHi?.length ? [...existingHi] : [];

  const needsEn = stepsNeedReplacement(recipe, steps, ingredients);
  const needsHi =
    !stepsHi.length ||
    !hasDevanagari(stepsHi.join(" ")) ||
    stepsNeedReplacement(recipe, stepsHi, ingredients);

  if (!needsEn && steps.length < MIN_STEPS) {
    steps = padHandcraftedSteps(steps, ingredients, "en");
  } else if (needsEn) {
    if (avgStepLength(steps) >= 90 && steps.length >= 3) {
      steps = expandStepCount(steps, MIN_STEPS);
    } else {
      steps = buildEnSteps(recipe, ingredients);
    }
  }

  if (!needsHi && stepsHi.length < MIN_STEPS) {
    stepsHi = padHandcraftedSteps(stepsHi, ingredients, "hi");
  } else if (needsHi) {
    if (hasDevanagari(stepsHi.join(" ")) && avgStepLength(stepsHi) >= 90 && stepsHi.length >= 3) {
      stepsHi = expandStepCount(stepsHi, MIN_STEPS);
    } else {
      stepsHi = buildHiSteps(recipe, ingredients);
    }
  }

  // Final pass: ensure minimum step count
  if (steps.length < MIN_STEPS) steps = expandStepCount(steps, MIN_STEPS);
  if (stepsHi.length < MIN_STEPS) stepsHi = expandStepCount(stepsHi, MIN_STEPS);

  if (ingredientCoverage(steps, ingredients) < 0.35) {
    steps = buildEnSteps(recipe, ingredients);
  }
  if (ingredientCoverage(stepsHi, ingredients) < 0.35) {
    stepsHi = buildHiSteps(recipe, ingredients);
  }

  steps = ensureAllIngredientsListed(steps, ingredients, "en");
  stepsHi = ensureAllIngredientsListed(stepsHi, ingredients, "hi");

  return { steps, stepsHi };
}

function ensureAllIngredientsListed(steps, ingredients, lang) {
  if (!steps?.length || !ingredients?.length) return steps;
  const coverage = ingredientCoverage(steps, ingredients);
  if (coverage >= 0.5) return steps;

  const allNames = joinNames(ingredients.slice(0, 12), lang);
  const prepLine =
    lang === "hi"
      ? `सारी सामग्री तैयार करें: ${allNames}।`
      : `Mise en place — gather all ingredients: ${allNames}.`;

  if (steps[0]?.startsWith("Keep ready:") || steps[0]?.startsWith("Mise en place") || steps[0]?.startsWith("सारी सामग्री")) {
    return [prepLine, ...steps.slice(1)].slice(0, MAX_STEPS);
  }
  return [prepLine, ...steps].slice(0, MAX_STEPS);
}
