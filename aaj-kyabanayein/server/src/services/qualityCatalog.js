/**
 * Recipe catalog helpers — no quality gate (empty catalog ready for fresh recipes).
 */
import { getRecipeCount } from "../db/recipeRepository.js";

export function initQualityCatalog() {
  /* no-op */
}

export function refreshQualityCatalog() {
  /* no-op */
}

export function getQualityScore() {
  return 0;
}

export function passesQualityGate() {
  return true;
}

export function getPopularityScore() {
  return 0;
}

export function sortCatalogForBrowse(list) {
  return [...list].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
}

export function filterQualityApproved(list) {
  return list;
}

export function getPublicRecipeCount() {
  return getRecipeCount();
}
