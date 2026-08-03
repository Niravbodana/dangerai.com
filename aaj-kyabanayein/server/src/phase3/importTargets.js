/**
 * Phase 3 — cuisine/category import targets.
 * Quality over quantity; verified popular recipes only.
 */
export const PHASE3_TARGETS = {
  gujarati: 800,
  punjabi: 1000,
  "north-indian": 1200,
  "south-indian": 1500,
  maharashtrian: 700,
  rajasthani: 600,
  bengali: 600,
  goan: 300,
  hyderabadi: 500,
  kashmiri: 400,
  sindhi: 300,
  jain: 400,
  "street-food": 700,
  breakfast: 600,
  snacks: 800,
  desserts: 700,
  "chinese-indian": 400,
  egg: 500,
  chicken: 1500,
  mutton: 700,
  fish: 700,
  seafood: 500,
  healthy: 500,
  festival: 500,
};

export const TOTAL_PHASE3_TARGET = Object.values(PHASE3_TARGETS).reduce((a, b) => a + b, 0);

/** Phase 1 = highest search demand — import these first */
export const IMPORT_PHASES = {
  1: {
    label: "Top Priority — Most Searched",
    description: "Dishes Indians cook and search for most. Every major cuisine represented.",
    minPopularityScore: 85,
    maxPriority: 1,
  },
  2: {
    label: "High Demand",
    description: "Popular regional staples and festival favourites.",
    minPopularityScore: 70,
    maxPriority: 2,
  },
  3: {
    label: "Complete the Library",
    description: "Fill cuisine quotas with verified regional classics.",
    minPopularityScore: 50,
    maxPriority: 3,
  },
};

export const TRUSTED_POPULARITY_SIGNALS = [
  { id: "google-trends-in", name: "Google Trends India", type: "search_volume", license: "factual_signal" },
  { id: "youtube-cooking-in", name: "YouTube India cooking channels", type: "engagement", license: "factual_signal" },
  { id: "rasoira-search-logs", name: "Rasoira internal search analytics", type: "first_party", license: "RASOIRA-AI" },
  { id: "wikipedia-pageviews", name: "Wikipedia dish pageviews", type: "factual_signal", license: "CC-BY-3.0" },
  { id: "culinary-kb", name: "Rasoira culinary knowledge base", type: "internal", license: "RASOIRA-AI" },
];
