/** State → cuisine/tag signals for regional daily brief */
export const STATE_REGIONS = {
  gujarat: { cuisines: ["gujarati", "indian"], tags: ["gujarati", "thepla", "dhokla", "fafda"] },
  maharashtra: { cuisines: ["maharashtrian", "indian"], tags: ["maharashtrian", "vada pav", "misal", "pav bhaji"] },
  punjab: { cuisines: ["punjabi", "north-indian"], tags: ["punjabi", "paratha", "chole", "rajma"] },
  rajasthan: { cuisines: ["north-indian", "indian"], tags: ["rajasthani", "dal", "gatte"] },
  up: { cuisines: ["north-indian", "indian"], tags: ["awadhi", "kachori"] },
  bihar: { cuisines: ["indian", "north-indian"], tags: ["litti", "khichdi"] },
  "west-bengal": { cuisines: ["bengali", "indian"], tags: ["bengali", "fish", "mishti"] },
  "tamil-nadu": { cuisines: ["south-indian"], tags: ["tamil", "dosa", "idli", "sambar"] },
  kerala: { cuisines: ["kerala", "south-indian"], tags: ["kerala", "appam", "puttu"] },
  karnataka: { cuisines: ["south-indian"], tags: ["bisi bele", "dosa"] },
  andhra: { cuisines: ["south-indian"], tags: ["andhra", "spicy", "biryani"] },
  telangana: { cuisines: ["hyderabadi", "south-indian"], tags: ["hyderabadi", "biryani"] },
  odisha: { cuisines: ["indian"], tags: ["pakhala"] },
  assam: { cuisines: ["indian"], tags: ["assamese", "fish"] },
  "delhi-ncr": { cuisines: ["north-indian", "indian"], tags: ["street-food", "chaat", "paratha"] },
};

export function stateBoostForRecipe(recipe, homeState) {
  const region = STATE_REGIONS[homeState];
  if (!region) return 0;
  let boost = 0;
  if (region.cuisines.includes(recipe.cuisine)) boost += 10;
  const blob = `${recipe.name || ""} ${(recipe.tags || []).join(" ")}`.toLowerCase();
  if (region.tags.some((t) => blob.includes(t))) boost += 8;
  return boost;
}
