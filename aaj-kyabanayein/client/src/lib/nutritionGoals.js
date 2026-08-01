/** Daily nutrition goals — localStorage */
import { DEFAULT_GOALS } from "./nutrition";

const KEY = "akb-nutrition-goals";

export function getNutritionGoals() {
  try {
    return { ...DEFAULT_GOALS, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return { ...DEFAULT_GOALS };
  }
}

export function saveNutritionGoals(partial) {
  const next = { ...getNutritionGoals(), ...partial };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export { DEFAULT_GOALS };
