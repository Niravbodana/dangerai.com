/**
 * Rasoira hand-authored recipe modules — original content, commercial-safe.
 */
import { BaseSourceAdapter } from "./baseAdapter.js";
import { BASE_RECIPES } from "../../data/baseRecipes.js";
import { MORE_RECIPES } from "../../data/moreRecipes.js";
import { INDIAN_BOOK_RECIPES } from "../../data/recipeBookIndian.js";
import { MORE_INDIAN_RECIPES } from "../../data/recipeBookMoreIndian.js";
import { EVEN_MORE_INDIAN_RECIPES } from "../../data/recipeBookExtra.js";
import { POPULAR_INDIAN_RECIPES } from "../../data/recipeBookPopular.js";
import { NEW_2026_RECIPES } from "../../data/recipeBookNew2026.js";
import { WORLD_CUISINE_RECIPES } from "../../data/recipeBookWorldCuisines.js";
import { VEG_EXPANSION_RECIPES } from "../../data/recipeBookVegExpansion.js";

const MODULES = [
  ...BASE_RECIPES,
  ...MORE_RECIPES,
  ...INDIAN_BOOK_RECIPES,
  ...MORE_INDIAN_RECIPES,
  ...EVEN_MORE_INDIAN_RECIPES,
  ...POPULAR_INDIAN_RECIPES,
  ...NEW_2026_RECIPES,
  ...WORLD_CUISINE_RECIPES,
  ...VEG_EXPANSION_RECIPES,
];

export class CuratedModulesAdapter extends BaseSourceAdapter {
  constructor() {
    super("rasoira-curated-modules");
  }

  async fetch() {
    this.assertLicensed();
    return MODULES.map((r) => ({
      ...r,
      dataSource: "rasoira-curated-modules",
      licenseSpdx: "RASOIRA-CURATED",
      commercialUseAllowed: true,
      attributionRequired: false,
      verificationStatus: "verified",
      lastVerifiedAt: new Date().toISOString(),
    }));
  }
}

export function getCuratedRecipeCount() {
  return MODULES.length;
}
