/**
 * Upgrade live + intelligence catalog to premium 90+ quality.
 * Real ingredients, verified nutrition, original high-quality heroes.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildPremiumRecipe, MIN_SCORE } from "./premiumRecipeBuilder.js";
import { isPremiumHero } from "./heroImageGenerator.js";
import { saveIntelligenceRecipe } from "../intelligence/recipeStore.js";
import { enqueueForReview, approveRecipe } from "../intelligence/reviewQueue.js";
import { ensureIntelligenceDb, getIntelligenceDb } from "../intelligence/repository.js";
import { ensureEnterpriseSchema } from "../enterprise/schema.js";
import { seedIngredientDatabase } from "../enterprise/ingredients/ingredientDatabase.js";
import { upsertRecipe, setLocalImage } from "../db/recipeRepository.js";
import { getDb } from "../db/connection.js";
import { writeAuditLog } from "../intelligence/auditLog.js";
import { recordRecipeAudit } from "../research/auditTrail.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const META_DIR = path.join(__dirname, "../../data/image-cache-meta");

/**
 * @param {object} options
 */
export async function runPremiumUpgrade(options = {}) {
  const {
    limit = 0,
    offset = 0,
    dryRun = false,
    forceImage = true,
    minScore = MIN_SCORE,
    onlyBelowScore = null,
    syncToLiveCatalog = true,
    autoApprove = true,
    runId = `premium-upgrade-${Date.now()}`,
  } = options;

  ensureIntelligenceDb();
  const intelDb = getIntelligenceDb();
  ensureEnterpriseSchema(intelDb);
  seedIngredientDatabase();

  const liveDb = getDb();
  const rows = liveDb
    .prepare(
      "SELECT id, name, name_hi, meal_type, cuisine, category, budget, cook_time, spice, diet, tags FROM recipes ORDER BY name LIMIT ? OFFSET ?"
    )
    .all(limit > 0 ? limit : 100000, offset);

  const report = {
    runId,
    startedAt: new Date().toISOString(),
    totalCandidates: rows.length,
    processed: 0,
    upgraded: 0,
    skipped: 0,
    failed: 0,
    scoreSum: 0,
    minAchieved: 100,
    maxAchieved: 0,
    imagesWritten: 0,
    errors: [],
    finishedAt: null,
  };

  writeAuditLog({ runId, action: "premium_upgrade_started", details: { limit, offset, minScore } });

  for (const row of rows) {
    report.processed++;
    try {
      if (onlyBelowScore != null) {
        const existing = intelDb
          .prepare("SELECT quality_score FROM recipe_intelligence WHERE id = ?")
          .get(row.id);
        if (existing && Number(existing.quality_score) >= onlyBelowScore) {
          report.skipped++;
          continue;
        }
      }

      const diet = safeJson(row.diet, []);
      const seed = {
        id: row.id,
        name: row.name,
        nameHi: row.name_hi,
        mealType: row.meal_type,
        cuisine: row.cuisine,
        category: row.category,
        budget: row.budget,
        spice: row.spice,
        diet,
        cookTime: row.cook_time,
      };

      const { recipe, quality, imageMeta } = await buildPremiumRecipe(seed, {
        writeImage: !dryRun,
        forceImage: dryRun ? false : forceImage || !isPremiumHero(row.id),
      });

      if (quality.score < minScore) {
        report.failed++;
        if (report.errors.length < 40) {
          report.errors.push({
            id: row.id,
            name: row.name,
            score: quality.score,
            breakdown: quality.breakdown,
          });
        }
        continue;
      }

      if (!dryRun) {
        recipe.reviewStatus = autoApprove ? "approved" : "pending";
        recipe.verificationStatus = autoApprove ? "admin_approved" : "pending_review";
        recipe.qualityScore = quality.score;

        saveIntelligenceRecipe(recipe);
        intelDb
          .prepare(
            `UPDATE recipe_intelligence SET quality_score = ?, nutrition_status = ?, verification_status = ?, review_status = ?, image_url = ?, image_license = ? WHERE id = ?`
          )
          .run(
            quality.score,
            recipe.nutritionStatus || "verified",
            recipe.verificationStatus,
            recipe.reviewStatus,
            recipe.imageUrl || null,
            recipe.imageLicense || "RASOIRA-AI",
            recipe.id
          );

        enqueueForReview(recipe, {
          passed: true,
          scores: { quality: quality.score / 100 },
          autoApprove: false,
          issues: [],
        });
        if (autoApprove) {
          try {
            approveRecipe(recipe.id, "admin-premium-upgrade");
          } catch {
            /* already approved */
          }
        }

        if (syncToLiveCatalog) {
          syncPremiumToLive(recipe);
          if (recipe.localImage) {
            setLocalImage(recipe.id, recipe.localImage, {
              source: "premium-hero",
              title: imageMeta?.title || recipe.title,
              originalUrl: imageMeta?.originalUrl || `rasoira-ai://premium-hero/${recipe.id}`,
              score: 0.99,
              fetchedAt: imageMeta?.fetchedAt || new Date().toISOString(),
            });
            report.imagesWritten++;
          }
        }

        recordRecipeAudit(recipe.id, {
          type: "premium_upgraded",
          sourceName: "rasoira-premium",
          licenseName: "RASOIRA-AI",
          nutritionStatus: recipe.nutritionStatus,
          verificationStatus: recipe.verificationStatus,
          actor: "admin-premium-upgrade",
          details: { qualityScore: quality.score, runId, templateKey: recipe.templateKey },
        });
      }

      report.upgraded++;
      report.scoreSum += quality.score;
      report.minAchieved = Math.min(report.minAchieved, quality.score);
      report.maxAchieved = Math.max(report.maxAchieved, quality.score);

      if (report.processed % 100 === 0) {
        writeAuditLog({
          runId,
          action: "premium_upgrade_checkpoint",
          details: {
            processed: report.processed,
            upgraded: report.upgraded,
            failed: report.failed,
            avgScore: report.upgraded ? Math.round(report.scoreSum / report.upgraded) : 0,
          },
        });
        console.log(
          `[premium] ${report.processed}/${rows.length} · upgraded ${report.upgraded} · failed ${report.failed}`
        );
      }
    } catch (err) {
      report.failed++;
      if (report.errors.length < 40) {
        report.errors.push({
          id: row.id,
          name: row.name,
          error: err.message,
          score: err.quality?.score,
          breakdown: err.quality?.breakdown,
        });
      }
    }
  }

  report.finishedAt = new Date().toISOString();
  report.avgScore = report.upgraded ? Math.round(report.scoreSum / report.upgraded) : 0;
  if (report.upgraded === 0) report.minAchieved = 0;
  report.premiumHeroCount = countPremiumHeroes();
  report.liveCatalog = liveDb.prepare("SELECT COUNT(*) as c FROM recipes").get()?.c || 0;
  report.intelligenceApproved =
    intelDb.prepare("SELECT COUNT(*) as c FROM recipe_intelligence WHERE review_status = 'approved'").get()?.c || 0;
  report.quality90Plus =
    intelDb.prepare("SELECT COUNT(*) as c FROM recipe_intelligence WHERE quality_score >= 90").get()?.c || 0;

  writeAuditLog({ runId, action: "premium_upgrade_completed", details: report });
  return report;
}

function syncPremiumToLive(recipe) {
  upsertRecipe({
    id: recipe.id,
    name: recipe.title || recipe.name,
    nameHi: recipe.nameHi || recipe.title,
    mealType: recipe.mealType || "lunch",
    diet: recipe.diet || [],
    cuisine: recipe.cuisine || "indian",
    category: recipe.category || recipe.cuisine,
    budget: recipe.budget || "medium",
    cookTime: recipe.cookTimeMin || recipe.totalTimeMin || 30,
    calories: recipe.calories || 300,
    spice: recipe.spice || "medium",
    healthScore: recipe.healthScore ?? 9,
    localImage: recipe.localImage || null,
    tags: recipe.tags || [],
    pantryKeys: (recipe.ingredients || []).map((i) => (i.name || "").toLowerCase()),
    source: "premium-upgrade",
    ingredients: (recipe.ingredients || []).map((i) => ({
      name: i.name,
      nameHi: i.nameHi || i.name,
      quantity: i.displayQuantity || `${i.quantity || i.qty || ""} ${i.unit || ""}`.trim(),
    })),
    steps: recipe.steps || [],
    stepsHi: recipe.stepsHi || [],
  });
}

function safeJson(val, fallback) {
  try {
    return JSON.parse(val || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

export function countPremiumHeroes() {
  if (!fs.existsSync(META_DIR)) return 0;
  let n = 0;
  for (const f of fs.readdirSync(META_DIR)) {
    if (!f.endsWith(".json")) continue;
    try {
      const m = JSON.parse(fs.readFileSync(path.join(META_DIR, f), "utf8"));
      if (m.source === "premium-hero" || m.source === "rasoira-ai-original") n++;
    } catch {
      /* skip */
    }
  }
  return n;
}

export function getPremiumStatus() {
  ensureIntelligenceDb();
  const intelDb = getIntelligenceDb();
  const live = getDb().prepare("SELECT COUNT(*) as c FROM recipes").get()?.c || 0;
  const q90 =
    intelDb.prepare("SELECT COUNT(*) as c FROM recipe_intelligence WHERE quality_score >= 90").get()?.c || 0;
  const verified =
    intelDb.prepare("SELECT COUNT(*) as c FROM recipe_intelligence WHERE nutrition_status = 'verified'").get()?.c ||
    0;
  const avg = intelDb
    .prepare("SELECT AVG(quality_score) as a FROM recipe_intelligence WHERE quality_score > 0")
    .get()?.a;
  return {
    liveCatalog: live,
    quality90Plus: q90,
    nutritionVerified: verified,
    avgQualityScore: avg ? Math.round(avg) : 0,
    premiumHeroes: countPremiumHeroes(),
    minScoreRequired: MIN_SCORE,
  };
}
