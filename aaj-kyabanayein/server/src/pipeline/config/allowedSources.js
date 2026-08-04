/**
 * Rasoira Recipe Pipeline — source allowlist.
 * Only sources with explicit commercial-use permission are listed here.
 * If license is unclear → do not add; pipeline will SKIP.
 */

/** SPDX or well-known license IDs that permit commercial use on Rasoira. */
export const COMMERCIAL_LICENSES = {
  "CC0-1.0": {
    commercialUseAllowed: true,
    attributionRequired: false,
    label: "Creative Commons CC0 1.0 Universal",
  },
  PD: {
    commercialUseAllowed: true,
    attributionRequired: false,
    label: "Public Domain",
  },
  "US-GOV": {
    commercialUseAllowed: true,
    attributionRequired: false,
    label: "U.S. Government Work (Public Domain)",
  },
  "CC-BY-4.0": {
    commercialUseAllowed: true,
    attributionRequired: true,
    label: "Creative Commons Attribution 4.0",
  },
  "CC-BY-3.0": {
    commercialUseAllowed: true,
    attributionRequired: true,
    label: "Creative Commons Attribution 3.0",
  },
  "MIT": {
    commercialUseAllowed: true,
    attributionRequired: true,
    label: "MIT License",
  },
  "RASOIRA-AI": {
    commercialUseAllowed: true,
    attributionRequired: false,
    label: "Rasoira AI-generated original content",
  },
  "RASOIRA-USER-TOS": {
    commercialUseAllowed: true,
    attributionRequired: false,
    label: "User-submitted under Rasoira Terms of Service",
  },
  "RASOIRA-CURATED": {
    commercialUseAllowed: true,
    attributionRequired: false,
    label: "Rasoira hand-authored original content",
  },
};

/**
 * Registered datasets the pipeline may import.
 * Each entry MUST have licenseSpdx + commercialUseAllowed explicitly set.
 */
export const REGISTERED_DATASETS = {
  "usda-fdc": {
    id: "usda-fdc",
    name: "USDA FoodData Central",
    sourceUrl: "https://fdc.nal.usda.gov/",
    licenseSpdx: "US-GOV",
    commercialUseAllowed: true,
    attributionRequired: false,
    attributionText: "Nutrition data from USDA FoodData Central (public domain).",
    allowedFields: ["ingredient_nutrition", "food_composition"],
    robotsTxtRespected: true,
    apiCommercialUse: true,
    notes: "Ingredient nutrition facts only — never recipe text or images.",
  },
  "openverse-images": {
    id: "openverse-images",
    name: "Openverse API (CC0 / CC-BY commercial)",
    sourceUrl: "https://openverse.org/",
    licenseSpdx: "CC0-1.0",
    commercialUseAllowed: true,
    attributionRequired: false,
    allowedFields: ["image"],
    robotsTxtRespected: true,
    apiCommercialUse: true,
    notes: "Only images with license_type=commercial,modification and CC0/CC-BY.",
  },
  "rasoira-curated-modules": {
    id: "rasoira-curated-modules",
    name: "Rasoira hand-authored recipe modules",
    sourceUrl: "internal://rasoira/curated",
    licenseSpdx: "RASOIRA-CURATED",
    commercialUseAllowed: true,
    attributionRequired: false,
    allowedFields: ["recipe_full"],
    robotsTxtRespected: true,
    apiCommercialUse: true,
    notes: "baseRecipes.js, recipeBook*.js — original content authored for Rasoira.",
  },
  "rasoira-ai-generated": {
    id: "rasoira-ai-generated",
    name: "Rasoira AI recipe generator",
    sourceUrl: "internal://rasoira/ai",
    licenseSpdx: "RASOIRA-AI",
    commercialUseAllowed: true,
    attributionRequired: false,
    allowedFields: ["recipe_full"],
    robotsTxtRespected: true,
    apiCommercialUse: true,
    notes: "Original titles, intros and steps generated from factual ingredient data.",
  },
  "rasoira-research": {
    id: "rasoira-research",
    name: "Rasoira Master Recipe Research System v1.0",
    sourceUrl: "internal://rasoira/research",
    licenseSpdx: "RASOIRA-AI",
    commercialUseAllowed: true,
    attributionRequired: false,
    allowedFields: ["recipe_full"],
    robotsTxtRespected: true,
    apiCommercialUse: true,
    notes: "Research-driven original content — no copyrighted text.",
  },
  "rasoira-enterprise-v2": {
    id: "rasoira-enterprise-v2",
    name: "Rasoira Enterprise AI Research System v2.0",
    sourceUrl: "internal://rasoira/enterprise",
    licenseSpdx: "RASOIRA-AI",
    commercialUseAllowed: true,
    attributionRequired: false,
    allowedFields: ["recipe_full"],
    robotsTxtRespected: true,
    apiCommercialUse: true,
    notes: "10-agent pipeline — original, verified, commercially safe content.",
  },
  "rasoira-phase3": {
    id: "rasoira-phase3",
    name: "Rasoira Phase 3 Curated Popular Recipe Library",
    sourceUrl: "internal://rasoira/phase3",
    licenseSpdx: "RASOIRA-AI",
    commercialUseAllowed: true,
    attributionRequired: false,
    allowedFields: ["recipe_full"],
    robotsTxtRespected: true,
    apiCommercialUse: true,
    notes: "Curated popular Indian recipes — researched for demand, written as original content.",
  },
  "rasoira-phase3-bulk": {
    id: "rasoira-phase3-bulk",
    name: "Rasoira Phase 3 Bulk Unique Recipe Library",
    sourceUrl: "internal://rasoira/phase3-bulk",
    licenseSpdx: "RASOIRA-AI",
    commercialUseAllowed: true,
    attributionRequired: false,
    allowedFields: ["recipe_full"],
    robotsTxtRespected: true,
    apiCommercialUse: true,
    notes: "Bulk unique dish identities with original content — quality gated and admin approved.",
  },
  "rasoira-user-submitted": {
    id: "rasoira-user-submitted",
    name: "User-submitted recipes",
    sourceUrl: "internal://rasoira/users",
    licenseSpdx: "RASOIRA-USER-TOS",
    commercialUseAllowed: true,
    attributionRequired: false,
    allowedFields: ["recipe_full"],
    robotsTxtRespected: true,
    apiCommercialUse: true,
  },
};

/**
 * Explicitly blocked sources — never import, even if requested.
 * Includes copyrighted recipe sites and APIs without verified commercial terms.
 */
export const BLOCKED_SOURCES = [
  { id: "allrecipes", reason: "Copyrighted recipe content — scraping prohibited" },
  { id: "tasty", reason: "Copyrighted recipe content — scraping prohibited" },
  { id: "tarladalal", reason: "Copyrighted recipe content — scraping prohibited" },
  { id: "sanjeevkapoor", reason: "Copyrighted recipe content — scraping prohibited" },
  { id: "hebbars-kitchen", reason: "Copyrighted recipe content — scraping prohibited" },
  { id: "vegrecipesofindia", reason: "Copyrighted recipe content — scraping prohibited" },
  { id: "cookpad", reason: "Copyrighted UGC — terms prohibit redistribution" },
  { id: "yummly", reason: "Copyrighted aggregator — commercial API terms unclear" },
  { id: "foodnetwork", reason: "Copyrighted recipe content — scraping prohibited" },
  { id: "themealdb", reason: "Recipe text/images may be third-party copyrighted; commercial API terms not verified for Rasoira" },
  { id: "dummyjson", reason: "Synthetic demo data — no verified content license for commercial recipe publishing" },
  { id: "scraped-web", reason: "Generic web scraping is prohibited" },
];

export const TARGET_CUISINES = [
  "gujarati", "punjabi", "rajasthani", "maharashtrian", "south-indian",
  "bengali", "north-indian", "chinese", "italian", "mexican", "thai",
  "continental", "japanese", "korean", "healthy",
];

export const TARGET_CATEGORIES = [
  "breakfast", "snacks", "desserts", "street-food", "veg-lunch", "veg-dinner",
  "nonveg-lunch", "nonveg-dinner", "vegan", "jain", "egg", "chicken",
  "mutton", "fish", "seafood", "healthy", "snack",
];

export const TARGET_DIETS = ["veg", "vegan", "jain", "non-veg", "eggetarian"];
