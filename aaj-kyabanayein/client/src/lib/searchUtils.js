/** Client-side search helpers for empty states and labels */

export function getEmptySearchMessage(query) {
  const q = String(query || "").trim();
  if (!q) return "No recipes found. Try adjusting your filters.";
  return `No recipes found for "${q}". Try a shorter word or check spelling.`;
}

export function getSearchTips() {
  return [
    "Search by dish name — biryani, dosa, pasta",
    "Search by ingredient — paneer, tomato, chicken",
    "Try trending picks or clear filters below",
  ];
}
