/** Personal taste graph — spice, diet, avoid, region bias */
const KEY = "akb-taste-profile";

export const DEFAULT_TASTE = {
  diet: "veg",
  spice: "medium", // mild | medium | spicy
  oilPreference: "medium", // less | medium | normal
  avoid: [], // e.g. onion, garlic, mushroom
  preferCuisines: [], // north-indian, south-indian, ...
  cookTimeMax: 45,
  jain: false,
  kidsFriendly: false,
  diabeticFriendly: false,
  familySize: 4,
};

export function getTasteProfile() {
  try {
    return { ...DEFAULT_TASTE, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return { ...DEFAULT_TASTE };
  }
}

export function saveTasteProfile(partial) {
  const next = { ...getTasteProfile(), ...partial, updatedAt: new Date().toISOString() };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
