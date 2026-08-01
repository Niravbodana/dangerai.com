/**
 * Personalization pipeline — combine ranking signals with weights.
 */
import {
  scoreFamilySignal,
  scoreHistorySignal,
  scorePantrySignal,
  scoreTasteSignal,
  scoreTimeSignal,
} from "./signals.js";

export const DEFAULT_SIGNAL_WEIGHTS = {
  taste: 0.35,
  pantry: 0.25,
  family: 0.15,
  history: 0.15,
  time: 0.1,
};

function combineScores(signals, weights) {
  let totalW = 0;
  let sum = 0;
  for (const [key, data] of Object.entries(signals)) {
    if (!data || data.score == null) continue;
    const w = weights[key] ?? 0;
    totalW += w;
    sum += data.score * w;
  }
  return totalW > 0 ? sum / totalW : 50;
}

function collectReasons(signals) {
  const out = [];
  for (const data of Object.values(signals)) {
    if (data?.reasons?.length) out.push(...data.reasons);
  }
  return [...new Set(out)].slice(0, 3);
}

/** Rank recipes using taste / pantry / family / history / time signals */
export function rankRecipes(recipes, context = {}, options = {}) {
  const weights = { ...DEFAULT_SIGNAL_WEIGHTS, ...options.weights };
  const daySeed = options.daySeed ?? 0;

  return recipes
    .map((recipe, i) => {
      const signals = {
        taste: scoreTasteSignal(recipe, context.taste),
        pantry: scorePantrySignal(recipe, context.pantry),
        family: scoreFamilySignal(recipe, context.family),
        history: scoreHistorySignal(recipe, context.history),
        time: scoreTimeSignal(recipe, context.time),
      };
      const base = combineScores(signals, weights);
      const jitter = (daySeed + (recipe.id?.charCodeAt(0) || 0) + i) % 11;
      const score = signals.taste?.score === 0 ? 0 : base + jitter * 0.5;
      return {
        recipe,
        score,
        signals,
        reasons: collectReasons(signals),
      };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}
