import { getProvenance, getAllProvenanceForIds } from "../db/provenanceRepository.js";

export function attachProvenance(recipe) {
  if (!recipe?.id) return recipe;
  const prov = getProvenance(recipe.id);
  if (!prov) return recipe;
  return {
    ...recipe,
    sourceUrl: prov.sourceUrl,
    wikipediaUrl: prov.wikipediaUrl,
    mealDbUrl: prov.mealDbUrl,
    sourceLinks: prov.sourceLinks,
    attributionText: prov.attributionText,
    licenseSpdx: prov.licenseSpdx,
  };
}

export function attachProvenanceToList(recipes) {
  if (!recipes?.length) return recipes;
  const map = getAllProvenanceForIds(recipes.map((r) => r.id));
  return recipes.map((r) => {
    const prov = map.get(r.id);
    if (!prov) return r;
    return {
      ...r,
      sourceUrl: prov.sourceUrl,
      wikipediaUrl: prov.wikipediaUrl,
      sourceLinks: prov.sourceLinks,
    };
  });
}
