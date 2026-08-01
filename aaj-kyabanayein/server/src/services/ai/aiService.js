/**
 * AI service abstraction — unified entry for search, recommend, enrich.
 * External providers plug in later; local/rule-based defaults today.
 */
import { getAIProviderStatus, isAIConfigured } from "../aiRecipeService.js";
import { recommendRecipes } from "./recommendationService.js";
import { semanticSearch } from "./semanticSearch.js";

export const AI_MODES = {
  LOCAL: "local",
  HYBRID: "hybrid",
  EXTERNAL: "external",
};

export function getAIServiceStatus() {
  const enrich = getAIProviderStatus();
  return {
    mode: AI_MODES.LOCAL,
    enrich: { configured: isAIConfigured(), ...enrich },
    search: { provider: "local-keyword", embedding: false },
    recommend: { provider: "local-signals", signals: ["taste", "pantry", "family", "history", "time"] },
  };
}

/** Capability router — extend when adding embedding / LLM providers */
export function createAIService() {
  return {
    status: getAIServiceStatus,
    search: semanticSearch,
    recommend: recommendRecipes,
  };
}

export const aiService = createAIService();
