/** Helpers for curated collections list */

const FILTER_GROUPS = {
  quick: ["15-min", "kids-tiffin", "tamil-tiffin"],
  festival: ["diwali-sweets", "sunday-lunch", "guests-coming"],
  budget: ["budget-50"],
  healthy: ["diabetic-friendly", "protein-power"],
  regional: [
    "gujarati-thali",
    "punjabi-weekend",
    "maharashtrian-favs",
    "bengali-comfort",
    "rajasthani-plate",
    "hyderabadi-special",
    "kerala-home",
    "tamil-tiffin",
    "south-comfort",
  ],
};

export function filterCollections(collections, filterBy = "all") {
  if (filterBy === "all") return collections;
  const ids = FILTER_GROUPS[filterBy] || [];
  return collections.filter((c) => ids.includes(c.id));
}

export function sortCollections(collections, sortBy = "name-asc") {
  const list = [...collections];
  switch (sortBy) {
    case "name-desc":
      return list.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    case "name-asc":
    default:
      return list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }
}

export function getCuratedShareUrl(collectionId) {
  return `${window.location.origin}/collections/${encodeURIComponent(collectionId)}`;
}

export async function copyCuratedShareLink(collectionId) {
  const url = getCuratedShareUrl(collectionId);
  if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
  return url;
}

export function sortCollectionRecipes(recipes, sortBy = "name-asc") {
  const list = [...recipes];
  switch (sortBy) {
    case "time-asc":
      return list.sort((a, b) => (a.cookTime || 0) - (b.cookTime || 0));
    case "time-desc":
      return list.sort((a, b) => (b.cookTime || 0) - (a.cookTime || 0));
    case "name-desc":
      return list.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    case "name-asc":
    default:
      return list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }
}

export function filterCollectionRecipes(recipes, filterBy = "all") {
  if (filterBy === "all") return recipes;
  if (filterBy === "veg") {
    return recipes.filter((r) => r.diet?.includes("veg") && !r.diet?.includes("non-veg"));
  }
  if (filterBy === "non-veg") {
    return recipes.filter((r) => r.diet?.includes("non-veg"));
  }
  return recipes;
}
