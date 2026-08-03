/**
 * Quality Guardian — auto-fix bad photos & ingredient mismatches on startup.
 * Only re-fetches photos that fail audit (not all images).
 */
import { logger } from "../lib/logger.js";
import { RECIPE_INDEX, getRecipeById, initRecipeCatalog, enrichRecipe, invalidateRecipeCache } from "../data/recipes.js";
import { validateIngredientSemantics } from "../lib/ingredientProfiles.js";
import {
  auditCachedImage,
  ensureRecipeImage,
  forceFixRecipePhoto,
  hasCachedImage,
} from "./recipeImageService.js";
import { setLocalImage, upsertRecipe } from "../db/recipeRepository.js";

const MAX_PHOTO_FIXES = parseInt(process.env.GUARDIAN_MAX_PHOTO_FIXES || "40", 10);
const FIX_INGREDIENTS = process.env.GUARDIAN_FIX_INGREDIENTS !== "0";

let lastReport = null;

export function getGuardianReport() {
  return lastReport;
}

export async function runQualityGuardian({ fix = true } = {}) {
  initRecipeCatalog(true);

  const report = {
    startedAt: new Date().toISOString(),
    totalRecipes: RECIPE_INDEX.length,
    ingredientIssues: [],
    photoIssues: [],
    photosFixed: 0,
    photosFailed: 0,
    ingredientsFixed: 0,
  };

  for (const meta of RECIPE_INDEX) {
    if (meta.id?.startsWith("tmdb-")) continue;
    const raw = getRecipeById(meta.id);
    if (!raw) continue;

    const semantic = validateIngredientSemantics(raw);
    if (!semantic.ok) {
      report.ingredientIssues.push({
        id: meta.id,
        name: meta.name,
        profile: semantic.profile,
        issues: semantic.issues,
      });

      if (fix && FIX_INGREDIENTS) {
        const fixed = enrichRecipe({ ...raw, ingredients: raw.ingredients });
        upsertRecipe(fixed);
        report.ingredientsFixed++;
      }
    }

    if (!hasCachedImage(meta.id)) {
      report.photoIssues.push({ id: meta.id, name: meta.name, issue: "missing" });
      continue;
    }

    const photoAudit = auditCachedImage(raw);
    if (!photoAudit.ok) {
      report.photoIssues.push({
        id: meta.id,
        name: meta.name,
        issue: photoAudit.issue,
        title: photoAudit.meta?.title,
      });
    }
  }

  if (fix && report.photoIssues.length) {
    const toFix = report.photoIssues
      .filter((p) => p.issue !== "missing" || true)
      .slice(0, MAX_PHOTO_FIXES);

    for (const item of toFix) {
      if (item.id?.startsWith("tmdb-")) continue;
      try {
        const recipe = getRecipeById(item.id);
        if (!recipe) continue;
        const result = await forceFixRecipePhoto(recipe);
        if (!result.ok || !result.file) {
          report.photosFailed++;
          logger.warn(`Guardian photo fix failed ${item.id}: ${result.error || "unknown"}`);
          continue;
        }
        setLocalImage(item.id, result.file, {
          source: result.source || "guardian-fix",
          fetchedAt: new Date().toISOString(),
        });
        invalidateRecipeCache(item.id);
        const audit = auditCachedImage(getRecipeById(item.id) || recipe);
        if (audit.ok) {
          report.photosFixed++;
        } else {
          report.photosFailed++;
          logger.warn(`Guardian photo fix audit failed ${item.id}: ${audit.issue}`);
        }
      } catch (err) {
        report.photosFailed++;
        logger.warn(`Guardian photo fix failed ${item.id}: ${err.message}`);
      }
    }

    // Fetch missing images (limited)
    const missing = report.photoIssues.filter((p) => p.issue === "missing").slice(0, 20);
    for (const item of missing) {
      if (item.id?.startsWith("tmdb-")) continue;
      if (report.photosFixed + report.photosFailed >= MAX_PHOTO_FIXES) break;
      try {
        const recipe = getRecipeById(item.id);
        if (!recipe) continue;
        const file = await ensureRecipeImage(recipe);
        setLocalImage(item.id, file, { source: "guardian-fetch", fetchedAt: new Date().toISOString() });
        report.photosFixed++;
      } catch {
        report.photosFailed++;
      }
    }
  }

  report.finishedAt = new Date().toISOString();
  report.ingredientIssueCount = report.ingredientIssues.length;
  report.photoIssueCount = report.photoIssues.length;
  lastReport = report;

  logger.info(
    `Quality Guardian: ${report.ingredientIssueCount} ingredient issues (${report.ingredientsFixed} fixed), ` +
      `${report.photoIssueCount} photo issues (${report.photosFixed} fixed, ${report.photosFailed} failed)`
  );

  return report;
}

/** Non-blocking startup — only fixes bad/missing photos, never full re-sync */
export function startQualityGuardianOnBoot() {
  if (process.env.GUARDIAN_DISABLED === "1") return;
  setTimeout(() => {
    runQualityGuardian({ fix: true }).catch((err) => logger.warn(`Guardian: ${err.message}`));
  }, 3000);
}
