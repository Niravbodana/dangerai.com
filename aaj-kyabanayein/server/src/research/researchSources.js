/**
 * Allowed research sources — factual knowledge ONLY.
 * NEVER recipe blogs, copyrighted sites, or scraped instructions.
 */
export const ALLOWED_RESEARCH_SOURCES = {
  "usda-fdc": {
    id: "usda-fdc",
    name: "USDA FoodData Central",
    url: "https://fdc.nal.usda.gov/",
    license: "US-GOV",
    commercialUseAllowed: true,
    allowedFields: ["nutrition", "ingredient_composition"],
    type: "nutrition_database",
  },
  "wikipedia-facts": {
    id: "wikipedia-facts",
    name: "Wikipedia (factual dish history only)",
    url: "https://en.wikipedia.org/",
    license: "CC-BY-3.0",
    commercialUseAllowed: true,
    attributionRequired: true,
    allowedFields: ["dish_history", "origin_region", "cultural_context"],
    type: "encyclopedia",
    notes: "Extract only factual dates/places/origins — NEVER copy recipe text.",
  },
  "rasoira-culinary-kb": {
    id: "rasoira-culinary-kb",
    name: "Rasoira Internal Culinary Knowledge Base",
    url: "internal://rasoira/kb",
    license: "RASOIRA-AI",
    commercialUseAllowed: true,
    allowedFields: ["cooking_method", "temperature_range", "typical_ingredients", "equipment"],
    type: "internal",
  },
  "ifct-india": {
    id: "ifct-india",
    name: "Indian Food Composition Tables (ICMR-NIN)",
    url: "https://www.nin.res.in/",
    license: "US-GOV",
    commercialUseAllowed: true,
    allowedFields: ["nutrition", "indian_ingredient_composition"],
    type: "nutrition_database",
    notes: "Government nutrition reference for Indian foods.",
  },
};

export const FORBIDDEN_RESEARCH_SOURCES = [
  "allrecipes.com", "tasty.co", "tarladalal.com", "hebbarskitchen.com",
  "vegrecipesofindia.com", "cookpad.com", "yummly.com", "foodnetwork.com",
  "sanjeevkapoor.com", "themealdb.com", "any-recipe-blog",
];

export function isResearchSourceAllowed(sourceId) {
  return Boolean(ALLOWED_RESEARCH_SOURCES[sourceId]);
}

export function isUrlForbidden(url = "") {
  return FORBIDDEN_RESEARCH_SOURCES.some((d) => url.toLowerCase().includes(d));
}
