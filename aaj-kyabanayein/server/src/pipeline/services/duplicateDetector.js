/**
 * Duplicate recipe detection — prevents publishing near-identical recipes.
 */
import crypto from "crypto";
import { ingredientFingerprint } from "./ingredientNormalizer.js";

function normalizeTitle(title = "") {
  return title
    .toLowerCase()
    .replace(/\b(home|traditional|authentic|classic|special|quick|easy)\b/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildContentHash(recipe) {
  const payload = JSON.stringify({
    title: normalizeTitle(recipe.title || recipe.name),
    cuisine: (recipe.cuisine || "").toLowerCase(),
    mealType: (recipe.mealType || "").toLowerCase(),
    ingredients: ingredientFingerprint(recipe.ingredients || []),
  });
  return crypto.createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

/**
 * @param {object} candidate
 * @param {Map<string, object>|object[]} existing - hash or id → recipe
 */
export function findDuplicate(candidate, existing) {
  const hash = buildContentHash(candidate);
  const entries = existing instanceof Map ? [...existing.entries()] : Object.entries(
    Array.isArray(existing) ? Object.fromEntries(existing.map((r) => [r.id, r])) : existing
  );

  for (const [id, recipe] of entries) {
    if (buildContentHash(recipe) === hash) {
      return { duplicate: true, duplicateOf: id, hash };
    }
    if (isSimilarTitle(candidate.title || candidate.name, recipe.title || recipe.name)) {
      const candIng = ingredientFingerprint(candidate.ingredients || []);
      const existIng = ingredientFingerprint(recipe.ingredients || []);
      if (candIng === existIng) {
        return { duplicate: true, duplicateOf: id, hash, reason: "title+ingredients" };
      }
    }
  }

  return { duplicate: false, hash };
}

function isSimilarTitle(a = "", b = "") {
  const na = normalizeTitle(a);
  const nb = normalizeTitle(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const wa = new Set(na.split(" ").filter((w) => w.length > 2));
  const wb = new Set(nb.split(" ").filter((w) => w.length > 2));
  const overlap = [...wa].filter((w) => wb.has(w)).length;
  return overlap >= Math.min(wa.size, wb.size) * 0.85;
}

export function slugify(title = "") {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}
