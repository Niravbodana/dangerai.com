const Q = "w=600&h=450&fit=crop&q=80";
const u = (id) => `https://images.unsplash.com/photo-${id}?${Q}`;
const local = (name) => `/recipes/${name}.jpg`;

export const DEFAULT_FOOD_IMAGE = local("generic-veg");

/** Local curated photos — each file matches the dish name */
export const DISH_IMAGES = {
  poha: local("poha"),
  dalChawal: local("dal-chawal"),
  paneerMasala: local("paneer-butter-masala"),
  alooGobi: local("aloo-gobi"),
  idliSambar: local("idli-sambar"),
  dosa: local("masala-dosa"),
  biryani: local("biryani"),
  choleBhature: local("chole-bhature"),
  chickenCurry: local("chicken-curry"),
  butterChicken: local("butter-chicken"),
  palakPaneer: local("palak-paneer"),
  rajma: local("rajma-chawal"),
  upma: local("upma"),
  roti: local("roti-sabzi"),
  eggBhurji: local("egg-bhurji"),
  khichdi: local("khichdi"),
  paratha: local("paratha"),
  salad: local("sprouts-salad"),
  fishFry: local("fish-fry"),
  dahiVada: local("dahi-vada"),
  bainganBharta: local("baingan-bharta"),
  misalPav: local("misal-pav"),
  kadhi: local("kadhi"),
  mutton: local("mutton"),
  pavBhaji: local("pav-bhaji"),
  dhokla: local("dhokla"),
  lassi: local("lassi"),
  sabudana: local("sabudana"),
  thepla: local("thepla"),
  dalTadka: local("dal-tadka"),
  manchurian: local("veg-manchurian"),
  kheer: local("kheer"),
  friedRice: local("fried-rice"),
  noodles: local("noodles"),
  pasta: local("pasta"),
  pizza: local("pizza"),
  tacos: local("tacos"),
  sushi: u("1579584425555-d72f17d2459b"),
  burger: u("1568901346635-4c465754d2b4"),
  steak: u("1544025162-d76694265947"),
  soup: local("soup"),
  sandwich: local("sandwich"),
  smoothie: local("healthy"),
  prawn: local("fish-fry"),
  kebab: local("chicken-curry"),
  korean: u("1498654896293-37aacf113fd9"),
  thai: u("1559314809-0d155014e29e"),
  mexican: local("tacos"),
  healthy: local("healthy"),
  breakfast: local("poha"),
  snack: local("dhokla"),
  genericVeg: local("generic-veg"),
  genericNonVeg: local("generic-nonveg"),
};

export const RECIPE_IMAGES_BY_ID = {
  poha: DISH_IMAGES.poha,
  "dal-chawal": DISH_IMAGES.dalChawal,
  "paneer-butter-masala": DISH_IMAGES.paneerMasala,
  "aloo-gobi": DISH_IMAGES.alooGobi,
  "idli-sambar": DISH_IMAGES.idliSambar,
  "chicken-curry": DISH_IMAGES.chickenCurry,
  "palak-paneer": DISH_IMAGES.palakPaneer,
  "rajma-chawal": DISH_IMAGES.rajma,
  upma: DISH_IMAGES.upma,
  "roti-sabzi": DISH_IMAGES.roti,
  "egg-bhurji": DISH_IMAGES.eggBhurji,
  khichdi: DISH_IMAGES.khichdi,
  "paratha-curd": DISH_IMAGES.paratha,
  "sprouts-salad": DISH_IMAGES.salad,
  "masala-dosa": DISH_IMAGES.dosa,
  "chole-bhature": DISH_IMAGES.choleBhature,
  "biryani-veg": DISH_IMAGES.biryani,
  "fish-fry": DISH_IMAGES.fishFry,
  "dahi-vada": DISH_IMAGES.dahiVada,
  "baingan-bharta": DISH_IMAGES.bainganBharta,
  "misal-pav": DISH_IMAGES.misalPav,
  "kadhi-pakora": DISH_IMAGES.kadhi,
  "mutton-rogan-josh": DISH_IMAGES.mutton,
  "pav-bhaji": DISH_IMAGES.pavBhaji,
  dhokla: DISH_IMAGES.dhokla,
  lassi: DISH_IMAGES.lassi,
  "sabudana-khichdi": DISH_IMAGES.sabudana,
  "butter-chicken": DISH_IMAGES.butterChicken,
  thepla: DISH_IMAGES.thepla,
  "dal-tadka": DISH_IMAGES.dalTadka,
  "veg-manchurian": DISH_IMAGES.manchurian,
  kheer: DISH_IMAGES.kheer,
};

const KEYWORD_RULES = [
  ["butter chicken", DISH_IMAGES.butterChicken],
  ["paneer butter", DISH_IMAGES.paneerMasala],
  ["palak paneer", DISH_IMAGES.palakPaneer],
  ["chole bhature", DISH_IMAGES.choleBhature],
  ["chole bhatura", DISH_IMAGES.choleBhature],
  ["masala dosa", DISH_IMAGES.dosa],
  ["idli sambar", DISH_IMAGES.idliSambar],
  ["dal chawal", DISH_IMAGES.dalChawal],
  ["rajma chawal", DISH_IMAGES.rajma],
  ["aloo paratha", DISH_IMAGES.paratha],
  ["egg bhurji", DISH_IMAGES.eggBhurji],
  ["fish fry", DISH_IMAGES.fishFry],
  ["dahi vada", DISH_IMAGES.dahiVada],
  ["baingan bharta", DISH_IMAGES.bainganBharta],
  ["misal pav", DISH_IMAGES.misalPav],
  ["kadhi pakora", DISH_IMAGES.kadhi],
  ["mutton rogan", DISH_IMAGES.mutton],
  ["pav bhaji", DISH_IMAGES.pavBhaji],
  ["khaman dhokla", DISH_IMAGES.dhokla],
  ["sabudana khichdi", DISH_IMAGES.sabudana],
  ["dal tadka", DISH_IMAGES.dalTadka],
  ["veg manchurian", DISH_IMAGES.manchurian],
  ["manchurian", DISH_IMAGES.manchurian],
  ["rice kheer", DISH_IMAGES.kheer],
  ["methi thepla", DISH_IMAGES.thepla],
  ["sweet lassi", DISH_IMAGES.lassi],
  ["sprouts salad", DISH_IMAGES.salad],
  ["moong dal khichdi", DISH_IMAGES.khichdi],
  ["fried rice", DISH_IMAGES.friedRice],
  ["spring roll", DISH_IMAGES.friedRice],
  ["dim sum", DISH_IMAGES.friedRice],
  ["dumpling", DISH_IMAGES.friedRice],
  ["chow mein", DISH_IMAGES.noodles],
  ["noodle", DISH_IMAGES.noodles],
  ["ramyeon", DISH_IMAGES.noodles],
  ["bibimbap", DISH_IMAGES.korean],
  ["kimchi", DISH_IMAGES.korean],
  ["bulgogi", DISH_IMAGES.korean],
  ["pad thai", DISH_IMAGES.thai],
  ["green curry", DISH_IMAGES.thai],
  ["tom yum", DISH_IMAGES.thai],
  ["tacos", DISH_IMAGES.tacos],
  ["burrito", DISH_IMAGES.tacos],
  ["quesadilla", DISH_IMAGES.tacos],
  ["enchilada", DISH_IMAGES.tacos],
  ["nachos", DISH_IMAGES.tacos],
  ["pizza", DISH_IMAGES.pizza],
  ["pasta", DISH_IMAGES.pasta],
  ["lasagna", DISH_IMAGES.pasta],
  ["risotto", DISH_IMAGES.pasta],
  ["carbonara", DISH_IMAGES.pasta],
  ["biryani", DISH_IMAGES.biryani],
  ["pulao", DISH_IMAGES.biryani],
  ["dosa", DISH_IMAGES.dosa],
  ["idli", DISH_IMAGES.idliSambar],
  ["poha", DISH_IMAGES.poha],
  ["upma", DISH_IMAGES.upma],
  ["paratha", DISH_IMAGES.paratha],
  ["thepla", DISH_IMAGES.thepla],
  ["khichdi", DISH_IMAGES.khichdi],
  ["dhokla", DISH_IMAGES.dhokla],
  ["kheer", DISH_IMAGES.kheer],
  ["lassi", DISH_IMAGES.lassi],
  ["pav", DISH_IMAGES.pavBhaji],
  ["roti", DISH_IMAGES.roti],
  ["paneer", DISH_IMAGES.paneerMasala],
  ["palak", DISH_IMAGES.palakPaneer],
  ["aloo gobi", DISH_IMAGES.alooGobi],
  ["gobi", DISH_IMAGES.alooGobi],
  ["cauliflower", DISH_IMAGES.alooGobi],
  ["baingan", DISH_IMAGES.bainganBharta],
  ["eggplant", DISH_IMAGES.bainganBharta],
  ["aloo", DISH_IMAGES.alooGobi],
  ["potato", DISH_IMAGES.alooGobi],
  ["rajma", DISH_IMAGES.rajma],
  ["dal", DISH_IMAGES.dalChawal],
  ["chicken", DISH_IMAGES.chickenCurry],
  ["mutton", DISH_IMAGES.mutton],
  ["lamb", DISH_IMAGES.mutton],
  ["keema", DISH_IMAGES.mutton],
  ["fish", DISH_IMAGES.fishFry],
  ["prawn", DISH_IMAGES.prawn],
  ["crab", DISH_IMAGES.prawn],
  ["egg", DISH_IMAGES.eggBhurji],
  ["duck", DISH_IMAGES.chickenCurry],
  ["pork", DISH_IMAGES.chickenCurry],
  ["salad", DISH_IMAGES.salad],
  ["smoothie", DISH_IMAGES.smoothie],
  ["oats", DISH_IMAGES.healthy],
  ["quinoa", DISH_IMAGES.healthy],
  ["detox", DISH_IMAGES.healthy],
  ["soup", DISH_IMAGES.soup],
  ["sandwich", DISH_IMAGES.sandwich],
  ["burger", DISH_IMAGES.burger],
  ["steak", DISH_IMAGES.steak],
  ["raita", DISH_IMAGES.salad],
  ["tikka", DISH_IMAGES.kebab],
  ["tandoori", DISH_IMAGES.kebab],
  ["kebab", DISH_IMAGES.kebab],
];

export const FOOD_IMAGES = {
  breakfast: [DISH_IMAGES.poha, DISH_IMAGES.dosa, DISH_IMAGES.idliSambar, DISH_IMAGES.paratha],
  lunch: [DISH_IMAGES.dalChawal, DISH_IMAGES.biryani, DISH_IMAGES.rajma, DISH_IMAGES.roti],
  dinner: [DISH_IMAGES.paneerMasala, DISH_IMAGES.chickenCurry, DISH_IMAGES.biryani, DISH_IMAGES.roti],
  snack: [DISH_IMAGES.dahiVada, DISH_IMAGES.dhokla, DISH_IMAGES.salad, DISH_IMAGES.manchurian],
  healthy: [DISH_IMAGES.healthy, DISH_IMAGES.salad, DISH_IMAGES.smoothie],
  nonveg: [DISH_IMAGES.chickenCurry, DISH_IMAGES.fishFry, DISH_IMAGES.mutton, DISH_IMAGES.eggBhurji],
  indian: [DISH_IMAGES.dalChawal, DISH_IMAGES.paneerMasala, DISH_IMAGES.biryani, DISH_IMAGES.roti],
  chinese: [DISH_IMAGES.manchurian, DISH_IMAGES.friedRice, DISH_IMAGES.noodles],
  italian: [DISH_IMAGES.pasta, DISH_IMAGES.pizza],
  korean: [DISH_IMAGES.korean],
  thai: [DISH_IMAGES.thai],
  mexican: [DISH_IMAGES.tacos],
  continental: [DISH_IMAGES.sandwich, DISH_IMAGES.steak, DISH_IMAGES.soup],
};

function hashId(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * (i + 1)) % 10000;
  return h;
}

function matchByKeywords(recipe) {
  const haystack = `${recipe.id || ""} ${recipe.name || ""}`.toLowerCase();
  for (const [keyword, image] of KEYWORD_RULES) {
    if (haystack.includes(keyword)) return image;
  }
  return null;
}

export function getRecipeImage(recipe) {
  if (recipe.id && RECIPE_IMAGES_BY_ID[recipe.id]) {
    return RECIPE_IMAGES_BY_ID[recipe.id];
  }

  const keywordMatch = matchByKeywords(recipe);
  if (keywordMatch) return keywordMatch;

  const cuisine = recipe.cuisine?.toLowerCase();
  const cuisinePool = FOOD_IMAGES[cuisine];

  const pool = recipe.diet?.includes("non-veg")
    ? FOOD_IMAGES.nonveg
    : recipe.tags?.includes("healthy")
      ? FOOD_IMAGES.healthy
      : cuisinePool || FOOD_IMAGES[recipe.mealType] || FOOD_IMAGES.lunch;

  if (!pool?.length) {
    return recipe.diet?.includes("non-veg") ? DISH_IMAGES.genericNonVeg : DISH_IMAGES.genericVeg;
  }
  return pool[hashId(recipe.id || recipe.name || "x") % pool.length];
}
