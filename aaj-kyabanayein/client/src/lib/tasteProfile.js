/** Personal taste / cooking profile */
const KEY = "akb-taste-profile";

export const COOKING_PREFERENCES = [
  { id: "quick-meals", label: "Quick meals" },
  { id: "one-pot", label: "One-pot" },
  { id: "meal-prep", label: "Meal prep" },
  { id: "traditional", label: "Traditional" },
  { id: "healthy", label: "Healthy" },
  { id: "comfort", label: "Comfort food" },
];

export const DIETARY_OPTIONS = [
  { id: "veg", label: "Vegetarian" },
  { id: "non-veg", label: "Non-veg" },
  { id: "vegan", label: "Vegan" },
  { id: "jain", label: "Jain" },
  { id: "diabetic", label: "Diabetic friendly" },
  { id: "kids", label: "Kids friendly" },
];

export const ALLERGY_OPTIONS = [
  "nuts", "dairy", "gluten", "shellfish", "egg", "soy", "sesame",
];

export const APPLIANCE_OPTIONS = [
  { id: "pressure-cooker", label: "Pressure cooker" },
  { id: "air-fryer", label: "Air fryer" },
  { id: "oven", label: "Oven" },
  { id: "microwave", label: "Microwave" },
  { id: "mixer-grinder", label: "Mixer grinder" },
  { id: "induction", label: "Induction" },
];

export const BUDGET_OPTIONS = [
  { id: "low", label: "Budget" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "Premium" },
];

export const SKILL_OPTIONS = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

export const DEFAULT_TASTE = {
  diet: "veg",
  spice: "medium",
  oilPreference: "medium",
  avoid: [],
  allergies: [],
  noAllergies: false,
  dietaryTags: [],
  cookingPreferences: [],
  appliances: [],
  budget: "medium",
  skillLevel: "intermediate",
  preferCuisines: [],
  cookTimeMax: 45,
  jain: false,
  kidsFriendly: false,
  diabeticFriendly: false,
  familySize: 4,
  homeState: "",
};

export function getTasteProfile() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || "{}");
    const profile = { ...DEFAULT_TASTE, ...stored };
    if (profile.jain && !profile.dietaryTags?.includes("jain")) {
      profile.dietaryTags = [...(profile.dietaryTags || []), "jain"];
    }
    if (profile.kidsFriendly && !profile.dietaryTags?.includes("kids")) {
      profile.dietaryTags = [...(profile.dietaryTags || []), "kids"];
    }
    if (profile.diabeticFriendly && !profile.dietaryTags?.includes("diabetic")) {
      profile.dietaryTags = [...(profile.dietaryTags || []), "diabetic"];
    }
    return profile;
  } catch {
    return { ...DEFAULT_TASTE };
  }
}

export function saveTasteProfile(partial) {
  const next = { ...getTasteProfile(), ...partial, updatedAt: new Date().toISOString() };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function getProfileCompletion(profile = getTasteProfile()) {
  const items = [
    { key: "diet", label: "Diet", done: !!profile.diet },
    { key: "spice", label: "Spice", done: !!profile.spice },
    { key: "budget", label: "Budget", done: !!profile.budget },
    { key: "skillLevel", label: "Skill level", done: !!profile.skillLevel },
    { key: "cookTimeMax", label: "Cook time", done: profile.cookTimeMax > 0 },
    { key: "preferCuisines", label: "Cuisines", done: (profile.preferCuisines?.length || 0) > 0 },
    { key: "homeState", label: "Home state", done: !!profile.homeState },
    { key: "appliances", label: "Appliances", done: (profile.appliances?.length || 0) > 0 },
    { key: "cookingPreferences", label: "Cooking style", done: (profile.cookingPreferences?.length || 0) > 0 },
    { key: "allergies", label: "Allergies", done: profile.noAllergies || (profile.allergies?.length || 0) > 0 },
  ];
  const done = items.filter((i) => i.done).length;
  return {
    percent: Math.round((done / items.length) * 100),
    items,
    done,
    total: items.length,
  };
}
