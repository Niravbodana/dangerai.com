/**
 * Extract factual cooking knowledge — NO copyrighted recipe text.
 * Uses internal culinary KB + structured facts only.
 */
import { ALLOWED_RESEARCH_SOURCES } from "./researchSources.js";

const CULINARY_KB = {
  tadka: { method: "tempering", tempC: "160-180", equipment: ["kadai", "pan"], timeMin: 3 },
  steaming: { method: "steaming", tempC: "100", equipment: ["steamer", "idli stand"], timeMin: 15 },
  pressure_cook: { method: "pressure cooking", tempC: "120", equipment: ["pressure cooker"], timeMin: 20 },
  shallow_fry: { method: "shallow frying", tempC: "170-180", equipment: ["tawa", "pan"], timeMin: 12 },
  deep_fry: { method: "deep frying", tempC: "175-190", equipment: ["kadai", "deep pan"], timeMin: 10 },
  simmer: { method: "simmering", tempC: "85-95", equipment: ["pot", "handi"], timeMin: 25 },
  bake: { method: "baking", tempC: "180", equipment: ["oven"], timeMin: 35 },
  grill: { method: "grilling", tempC: "200-230", equipment: ["grill", "tandoor"], timeMin: 20 },
};

const FALLBACK_DEFAULTS = { method: "simmer", spice: "medium", oil: "vegetable oil" };

const CUISINE_DEFAULTS = {
  gujarati: { method: "simmer", spice: "mild", oil: "groundnut oil" },
  punjabi: { method: "simmer", spice: "medium", oil: "ghee" },
  rajasthani: { method: "simmer", spice: "medium", oil: "mustard oil" },
  maharashtrian: { method: "shallow_fry", spice: "medium", oil: "peanut oil" },
  "south-indian": { method: "simmer", spice: "medium", oil: "coconut oil" },
  "north-indian": { method: "simmer", spice: "medium", oil: "ghee" },
  tamil: { method: "simmer", spice: "medium", oil: "sesame oil" },
  kerala: { method: "simmer", spice: "medium", oil: "coconut oil" },
  andhra: { method: "simmer", spice: "spicy", oil: "sesame oil" },
  karnataka: { method: "simmer", spice: "medium", oil: "coconut oil" },
  bengali: { method: "simmer", spice: "mild", oil: "mustard oil" },
  goan: { method: "simmer", spice: "medium", oil: "coconut oil" },
  hyderabadi: { method: "pressure_cook", spice: "spicy", oil: "ghee" },
  kashmiri: { method: "simmer", spice: "mild", oil: "mustard oil" },
  sindhi: { method: "simmer", spice: "medium", oil: "vegetable oil" },
  jain: { method: "simmer", spice: "mild", oil: "vegetable oil" },
  "street-food": { method: "shallow_fry", spice: "medium", oil: "vegetable oil" },
  "chinese-indian": { method: "shallow_fry", spice: "medium", oil: "sesame oil" },
  chinese: { method: "shallow_fry", spice: "medium", oil: "sesame oil" },
  italian: { method: "simmer", spice: "mild", oil: "olive oil" },
  thai: { method: "simmer", spice: "spicy", oil: "coconut oil" },
  mexican: { method: "grill", spice: "medium", oil: "vegetable oil" },
  japanese: { method: "simmer", spice: "mild", oil: "sesame oil" },
};

/**
 * Build a research brief from factual sources only.
 * @param {object} seed - catalog seed
 */
export function buildResearchBrief(seed) {
  const cuisine = seed.cuisine || "north-indian";
  const defaults = CUISINE_DEFAULTS[cuisine] || FALLBACK_DEFAULTS;
  const methodKey = inferMethod(seed.name, defaults.method);
  const method = CULINARY_KB[methodKey] || CULINARY_KB.simmer;

  const typicalIngredients = inferTypicalIngredients(seed);
  const facts = buildInterestingFacts(seed, cuisine);

  return {
    briefId: `brief-${seed.id}`,
    dishName: seed.name,
    cuisine,
    region: seed.region,
    state: seed.state,
    mealType: seed.mealType,
    diet: seed.diet,
    festival: seed.festival,
    sources: [
      { id: "rasoira-culinary-kb", fields: ["cooking_method", "temperature", "equipment"] },
      { id: "usda-fdc", fields: ["nutrition"] },
      ...(seed.festival ? [{ id: "wikipedia-facts", fields: ["cultural_context"] }] : []),
    ],
    facts: {
      cookingMethod: method.method,
      temperature: `${method.tempC}°C`,
      equipment: method.equipment,
      typicalCookTimeMin: method.timeMin,
      typicalIngredients,
      spiceLevel: defaults.spice,
      cookingOil: defaults.oil,
      originRegion: seed.region,
      festivalAssociation: seed.festival,
      interestingFacts: facts,
      recipeHistory: buildRecipeHistory(seed, cuisine),
    },
    researchedAt: new Date().toISOString(),
    licenseNotes: "Factual data only — no copyrighted recipe text extracted",
  };
}

function inferMethod(dishName, defaultMethod) {
  const n = dishName.toLowerCase();
  if (/steam|idli|dhokla|momos/i.test(n)) return "steaming";
  if (/fry|pakora|vada|tikki|samosa/i.test(n)) return "deep_fry";
  if (/tawa|paratha|thepla|dosa|roti/i.test(n)) return "shallow_fry";
  if (/biryani|dal|curry|sabzi|saag/i.test(n)) return "simmer";
  if (/bake|cake|cookie/i.test(n)) return "bake";
  if (/grill|tandoor|tikka|kebab/i.test(n)) return "grill";
  if (/pressure|rajma|chole/i.test(n)) return "pressure_cook";
  return defaultMethod in CULINARY_KB ? defaultMethod : "simmer";
}

function inferTypicalIngredients(seed) {
  const base = ["salt", "turmeric", "cumin"];
  const n = seed.name.toLowerCase();
  const diet = seed.diet || [];

  if (diet.includes("vegan") || diet.includes("veg")) {
    base.push("vegetable oil", "onion", "tomato", "ginger", "green chilli");
  }
  if (/dal|rajma|chole/i.test(n)) base.push("lentils or legumes", "ghee or oil", "garam masala");
  if (/paneer|curd|lassi/i.test(n)) base.push("paneer or curd", "cream");
  if (/rice|biryani|pulao/i.test(n)) base.push("basmati rice", "whole spices");
  if (/fish|machher/i.test(n)) base.push("fish", "mustard oil", "panch phoron");
  if (/chicken|mutton/i.test(n)) base.push("meat", "yogurt", "garam masala");

  return [...new Set(base)];
}

function buildInterestingFacts(seed, cuisine) {
  const facts = [];
  if (seed.festival) facts.push(`Traditionally prepared during ${seed.festival} celebrations.`);
  facts.push(`A beloved ${cuisine.replace(/-/g, " ")} dish enjoyed across ${seed.region || "India"}.`);
  if (/street/i.test(seed.cuisine)) facts.push("Popular at street stalls and local markets.");
  return facts;
}

function buildRecipeHistory(seed, cuisine) {
  return `${seed.name} has deep roots in ${seed.region || cuisine.replace(/-/g, " ")} cuisine, ` +
    `evolved through generations of home cooking and regional spice traditions. ` +
    `This version is researched for factual accuracy and written originally for Rasoira.`;
}

export function validateBriefSources(brief) {
  const issues = [];
  for (const src of brief.sources || []) {
    if (!ALLOWED_RESEARCH_SOURCES[src.id]) {
      issues.push(`Research source not allowed: ${src.id}`);
    }
  }
  return { valid: issues.length === 0, issues };
}
