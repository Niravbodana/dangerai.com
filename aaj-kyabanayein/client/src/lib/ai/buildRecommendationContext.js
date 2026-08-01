/** Build personalization context from existing client stores (no external AI). */
import { getTasteProfile } from "../tasteProfile.js";
import { pantryKeysForSuggest } from "../pantryStore.js";
import { getFamilyProfiles } from "../familyProfiles.js";
import { getRecentSearches } from "../recentSearches.js";
import { getLocalFavorites } from "../guest.js";

export function buildRecommendationContext(overrides = {}) {
  return {
    taste: overrides.taste ?? getTasteProfile(),
    pantry: overrides.pantry ?? pantryKeysForSuggest(),
    family: overrides.family ?? getFamilyProfiles(),
    history: {
      favoriteIds: getLocalFavorites(),
      recentSearches: getRecentSearches(),
      ...overrides.history,
    },
    time: {
      hour: new Date().getHours(),
      ...overrides.time,
    },
  };
}
