/**
 * Unified AI recipe enrichment — Groq first (fast), Gemini fallback.
 */
import { fetchRecipeFromGroq, isGroqConfigured } from "./groqRecipeService.js";
import { fetchRecipeFromGemini, isGeminiConfigured } from "./geminiRecipeService.js";

export function isAIConfigured() {
  return isGroqConfigured() || isGeminiConfigured();
}

export function getAIProviderStatus() {
  return {
    groq: isGroqConfigured(),
    gemini: isGeminiConfigured(),
    primary: isGroqConfigured() ? "groq" : isGeminiConfigured() ? "gemini" : null,
  };
}

/** Fast path: Groq (~1s), fallback Gemini if Groq fails or not configured */
export async function fetchRecipeFromAI(recipeName, cuisine = "indian") {
  if (isGroqConfigured()) {
    const groq = await fetchRecipeFromGroq(recipeName, cuisine);
    if (groq) return groq;
  }

  if (isGeminiConfigured()) {
    return fetchRecipeFromGemini(recipeName, cuisine);
  }

  return null;
}
