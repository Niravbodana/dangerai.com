/**
 * 1. Recipe Research Agent — factual cooking techniques, regional variations.
 */
import { BaseAgent } from "./baseAgent.js";
import { buildResearchBrief, validateBriefSources } from "../../research/factualKnowledge.js";

export class RecipeResearchAgent extends BaseAgent {
  constructor() {
    super("recipe_research");
  }

  async execute(context) {
    const { seed } = context;
    const brief = buildResearchBrief(seed);
    const validation = validateBriefSources(brief);

    if (!validation.valid) {
      return { success: false, confidence: 0, issues: validation.issues, data: { brief } };
    }

    const confidence = brief.facts?.typicalIngredients?.length >= 3 ? 0.85 : 0.6;

    return {
      success: true,
      confidence,
      data: {
        brief,
        facts: brief.facts,
        sources: brief.sources,
        regionalVariations: inferRegionalVariations(seed),
      },
    };
  }
}

function inferRegionalVariations(seed) {
  return [
    { region: seed.region || seed.state, note: `Traditional ${seed.cuisine} preparation style` },
    { region: "Home kitchen", note: "Adapted for modern stovetop cooking" },
  ];
}
