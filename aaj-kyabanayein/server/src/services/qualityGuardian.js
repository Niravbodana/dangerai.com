/**
 * Quality Guardian — auto-fix bad photos & ingredient mismatches on startup.
 * Only re-fetches photos that fail audit (not all images).
 * Yields to the event loop so /api/recipes stays responsive during large catalogs.
 */
import { logger } from "../lib/logger.js";
import { RECIPE_INDEX, getRecipeById, initRecipeCatalog, enrichRecipe, invalidateRecipeCache } from "../data/recipes.js";
import { validateIngredientSemantics } from "../lib/ingredientProfiles.js";
import {
  auditCachedImage,
  ensureRecipeImage,
  forceFixRecipePhoto,
  hasCachedImage,
  readImageMeta,
} from "./recipeImageService.js";
import { setLocalImage, upsertRecipe } from "../db/recipeRepository.js";

const MAX_PHOTO_FIXES = parseInt(process.env.GUARDIAN_MAX_PHOTO_FIXES || "40", 10);
const FIX_INGREDIENTS = process.env.GUARDIAN_FIX_INGREDIENTS !== "0";
const YIELD_EVERY = parseInt(process.env.GUARDIAN_YIELD_EVERY || "20", 10);
const BOOT_DELAY_MS = parseInt(process.env.GUARDIAN_BOOT_DELAY_MS || "15000", 10);

let lastReport = null;
let running = false;

export function getGuardianReport() {
  return lastReport;
}

function yieldEventLoop() {
  return new Promise((resolve) => setImmediate(resolve));
}

function isPremiumHero(recipeId) {
  const meta = readImageMeta(recipeId);
  const source = String(meta?.source || "");
  return source.startsWith("premium-hero");
}

export async function runQualityGuardian({ fix = true } = {}) {
  if (running) {
    logger.info("Quality Guardian already running — skip");
    return lastReport;
  }
  running = true;

  try {
    initRecipeCatalog(true);

    const report = {
      startedAt: new Date().toISOString(),
      totalRecipes: RECIPE_INDEX.length,
      ingredientIssues: [],
      photoIssues: [],
      photosFixed: 0,
      photosFailed: 0,
      ingredientsFixed: 0,
      scanned: 0,
      skippedPremium: 0,
    };

    let i = 0;
    for (const meta of RECIPE_INDEX) {
      i++;
      if (i % YIELD_EVERY === 0) await yieldEventLoop();

      if (meta.id?.startsWith("tmdb-")) continue;
      report.scanned++;

      // Premium heroes already passed 90+ gate — skip heavy audit
      if (isPremiumHero(meta.id)) {
        report.skippedPremium++;
        continue;
      }

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
      const toFix = report.photoIssues.slice(0, MAX_PHOTO_FIXES);

      for (const item of toFix) {
        await yieldEventLoop();
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

      const missing = report.photoIssues.filter((p) => p.issue === "missing").slice(0, 20);
      for (const item of missing) {
        await yieldEventLoop();
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
        `${report.photoIssueCount} photo issues (${report.photosFixed} fixed, ${report.photosFailed} failed), ` +
        `skippedPremium=${report.skippedPremium}`
    );

    return report;
  } finally {
    running = false;
  }
}

/** Non-blocking startup — yields so API stays responsive with 10k+ recipes */
export function startQualityGuardianOnBoot() {
  if (process.env.GUARDIAN_DISABLED === "1") return;
  setTimeout(() => {
    // After premium upgrade, almost all heroes are already good — skip heavy boot scan
    try {
      const total = RECIPE_INDEX.length;
      if (total >= 2000) {
        let premium = 0;
        const sample = Math.min(total, 200);
        for (let i = 0; i < sample; i++) {
          if (isPremiumHero(RECIPE_INDEX[i].id)) premium++;
        }
        if (premium / sample >= 0.7) {
          logger.info(
            `Quality Guardian skipped on boot (${premium}/${sample} sample are premium heroes; set GUARDIAN_FORCE=1 to run)`
          );
          if (process.env.GUARDIAN_FORCE !== "1") return;
        }
      }
    } catch {
      /* continue to guardian */
    }
    runQualityGuardian({ fix: true }).catch((err) => logger.warn(`Guardian: ${err.message}`));
  }, BOOT_DELAY_MS);
}
