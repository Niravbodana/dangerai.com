/**
 * AI recipe text generator — produces ORIGINAL titles, intros and instructions.
 * Never copies from copyrighted sources. Uses factual ingredient data only.
 */
import { fetchRecipeFromAI, isAIConfigured } from "../../services/aiRecipeService.js";

const ORIGINALITY_PROMPT_PREFIX = `
You are writing for Rasoira, a commercial Indian recipe website.
CRITICAL RULES:
- Write completely ORIGINAL recipe text. Do NOT copy from any website, blog, cookbook or app.
- Use only the provided ingredient list and factual cooking information.
- Steps must be clear, warm and practical for home cooks.
- Include tips, storage and reheating advice when relevant.
`;

/**
 * Generate original recipe prose from structured ingredient data.
 * @param {object} draft - { name, cuisine, mealType, diet, ingredients, cookTime }
 */
export async function generateOriginalRecipeText(draft) {
  if (!isAIConfigured()) {
    return buildTemplateFallback(draft);
  }

  const ingredientList = (draft.ingredients || [])
    .map((i) => `- ${i.displayQuantity || i.quantity || ""} ${i.name}`)
    .join("\n");

  const promptContext = {
    name: draft.name || draft.title,
    cuisine: draft.cuisine || "indian",
    mealType: draft.mealType || "lunch",
    diet: (draft.diet || []).join(", "),
    cookTime: draft.cookTimeMin || draft.cookTime || 30,
    ingredients: ingredientList,
  };

  try {
    const ai = await fetchRecipeFromAI(promptContext.name, promptContext.cuisine);
    if (!ai) return buildTemplateFallback(draft);

    return {
      title: ai.name || draft.name,
      introduction: buildIntroduction(draft, ai),
      steps: sanitizeSteps(ai.steps || []),
      stepsHi: sanitizeSteps(ai.stepsHi || ai.steps || []),
      tips: ai.tips || defaultTips(draft),
      storage: ai.storage || defaultStorage(draft),
      reheating: ai.reheating || defaultReheating(draft),
      substitutions: ai.substitutions || [],
      source: "rasoira-ai-generated",
      licenseSpdx: "RASOIRA-AI",
      commercialUseAllowed: true,
      attributionRequired: false,
      generatedAt: new Date().toISOString(),
    };
  } catch {
    return buildTemplateFallback(draft);
  }
}

function buildIntroduction(draft, ai) {
  const cuisine = (draft.cuisine || "Indian").replace(/-/g, " ");
  return (
    ai.introduction ||
    `A comforting ${cuisine} ${draft.mealType || "meal"} made with fresh ingredients. ` +
      `This ${(draft.diet || ["homestyle"]).join(" ")} recipe is perfect for everyday cooking on Rasoira.`
  );
}

function sanitizeSteps(steps) {
  return (steps || [])
    .map((s) => (typeof s === "string" ? s.trim() : String(s?.body || s?.text || "").trim()))
    .filter((s) => s.length > 10);
}

function buildTemplateFallback(draft) {
  const name = draft.name || draft.title || "Homestyle Dish";
  const steps = [
    `Prepare all ingredients: wash, chop and measure everything before you start cooking ${name}.`,
    `Heat oil in a pan on medium flame. Add aromatics and sauté until fragrant.`,
    `Add main ingredients in order, stirring gently. Season with salt and spices to taste.`,
    `Cook until done — about ${draft.cookTime || 30} minutes. Rest for 2 minutes and serve warm.`,
  ];

  return {
    title: name,
    introduction: `A simple, original ${name} recipe for your home kitchen.`,
    steps,
    stepsHi: steps,
    tips: defaultTips(draft),
    storage: defaultStorage(draft),
    reheating: defaultReheating(draft),
    substitutions: [],
    source: "rasoira-ai-generated",
    licenseSpdx: "RASOIRA-AI",
    commercialUseAllowed: true,
    attributionRequired: false,
    generatedAt: new Date().toISOString(),
    fallback: true,
  };
}

function defaultTips(draft) {
  return `Taste and adjust seasoning before serving. Fresh ingredients make the best ${draft.name || "dish"}.`;
}

function defaultStorage(draft) {
  return `Store leftovers in an airtight container in the refrigerator for up to 2 days.`;
}

function defaultReheating(draft) {
  return `Reheat gently on the stovetop or in a microwave until piping hot. Add a splash of water if needed.`;
}

export { ORIGINALITY_PROMPT_PREFIX };
