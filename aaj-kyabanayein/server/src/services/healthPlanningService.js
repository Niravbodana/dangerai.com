/** Health-condition aware recipe scoring for meal planning. */

const SWEET_RE = /katli|barfi|halwa|ladoo|kheer|jalebi|sweet|mithai|gulab|jamun|peda/i;
const FRIED_RE = /fried|pakora|bhajji|puri|bhature|samosa|kachori/i;
const HIGH_SODIUM_RE = /pickle|achaar|papad|namkeen|chips|soy sauce/i;

export function scoreHealthFit(recipe, conditions = []) {
  if (!conditions?.length) return 0;
  const blob = `${recipe.name} ${(recipe.tags || []).join(" ")} ${(recipe.ingredients || []).map((i) => i.name).join(" ")}`.toLowerCase();
  let score = 0;

  for (const cond of conditions) {
    const c = String(cond).toLowerCase();
    if (c === "diabetes" || c === "diabetic") {
      if (SWEET_RE.test(blob)) score -= 40;
      if ((recipe.calories || 300) > 450) score -= 15;
      if (/oats|dal|sprout|salad|steamed|soup|rasam|idli|khichdi/i.test(blob)) score += 20;
    }
    if (c === "hypertension" || c === "bp" || c === "low-sodium") {
      if (HIGH_SODIUM_RE.test(blob)) score -= 35;
      if (FRIED_RE.test(blob)) score -= 20;
      if (/steamed|boiled|dal|soup|salad|khichdi/i.test(blob)) score += 18;
    }
    if (c === "high-protein") {
      if (/dal|paneer|chicken|egg|fish|rajma|chana|moong|mutton/i.test(blob)) score += 22;
    }
    if (c === "low-fat") {
      if (FRIED_RE.test(blob)) score -= 25;
      if (/grilled|steamed|boiled|soup/i.test(blob)) score += 15;
    }
  }
  return score;
}

export function collectFamilyHealthConditions(family = {}) {
  const members = family.members || [];
  const set = new Set();
  for (const m of members) {
    for (const c of m.healthConditions || []) set.add(c);
    if (m.diabetic) set.add("diabetes");
    if (m.lowSalt) set.add("low-sodium");
    if (m.highProtein) set.add("high-protein");
  }
  return [...set];
}
