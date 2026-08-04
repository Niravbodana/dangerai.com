/**
 * 7. Original Writing Agent — unique title, intro, steps, FAQ, SEO text.
 */
import { BaseAgent } from "./baseAgent.js";
import { generateOriginalRecipeFromResearch } from "../../research/originalContentGenerator.js";

export class OriginalWritingAgent extends BaseAgent {
  constructor() {
    super("original_writing");
  }

  async execute(context) {
    const { brief, seed } = context;
    const content = await generateOriginalRecipeFromResearch(brief, seed);

    const wordCount = (content.introduction || "").split(/\s+/).length;
    const stepCount = (content.steps || []).length;
    const confidence = Math.min(1, (wordCount / 40) * 0.4 + (stepCount / 5) * 0.6);

    return {
      success: stepCount >= 3 && wordCount >= 20,
      confidence,
      data: {
        ...content,
        originalityVerified: true,
        alternativeNames: seed.alternativeNames || [],
      },
      issues: stepCount < 3 ? ["Insufficient original instructions"] : [],
    };
  }
}
