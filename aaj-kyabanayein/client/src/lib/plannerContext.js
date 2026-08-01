/** Build smart planner context from existing client stores */
import { getTasteProfile } from "./tasteProfile";
import { getFamilyProfiles } from "./familyProfiles";
import { loadPantry } from "./pantryStore";

export function buildPlannerContext() {
  const taste = getTasteProfile();
  const family = getFamilyProfiles();
  const pantryItems = loadPantry();
  const now = Date.now();
  const threeDays = 3 * 86400000;

  const expiringKeys = pantryItems
    .filter((i) => {
      if (!i.expiry) return false;
      const t = new Date(i.expiry).getTime();
      return t >= now && t - now <= threeDays;
    })
    .map((i) => i.key);

  return {
    smart: true,
    taste,
    family,
    pantry: pantryItems.map((i) => i.key),
    expiringKeys,
  };
}
