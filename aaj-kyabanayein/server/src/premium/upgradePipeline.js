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
import { refreshQualityCatalog } from "../services/qualityCatalog.js";

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
    concurrency = 6,
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
    realPhotos: 0,
    studioArt: 0,
    errors: [],
    finishedAt: null,
  };

  writeAuditLog({ runId, action: "premium_upgrade_started", details: { limit, offset, minScore, concurrency } });

  async function processOne(row) {
    if (onlyBelowScore != null) {
      const existing = intelDb
        .prepare("SELECT quality_score FROM recipe_intelligence WHERE id = ?")
        .get(row.id);
      if (existing && Number(existing.quality_score) >= onlyBelowScore) {
        report.skipped++;
        report.processed++;
        return;
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

    try {
      const { recipe, quality, imageMeta } = await buildPremiumRecipe(seed, {
        writeImage: !dryRun,
        forceImage: dryRun ? false : forceImage || !isPremiumHero(row.id),
      });

      if (quality.score < minScore) {
        report.failed++;
        report.processed++;
        if (report.errors.length < 40) {
          report.errors.push({
            id: row.id,
            name: row.name,
            score: quality.score,
            breakdown: quality.breakdown,
          });
        }
        return;
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
              source: imageMeta?.source || "premium-hero",
              title: imageMeta?.title || recipe.title,
              originalUrl: imageMeta?.originalUrl || `rasoira-ai://premium-hero/${recipe.id}`,
              score: 0.99,
              fetchedAt: imageMeta?.fetchedAt || new Date().toISOString(),
            });
            report.imagesWritten++;
            if (imageMeta?.source === "premium-hero-real") report.realPhotos++;
            else report.studioArt++;
          }
        }

        recordRecipeAudit(recipe.id, {
          type: "premium_upgraded",
          sourceName: "rasoira-premium",
          licenseName: recipe.imageLicense || "RASOIRA-AI",
          nutritionStatus: recipe.nutritionStatus,
          verificationStatus: recipe.verificationStatus,
          actor: "admin-premium-upgrade",
          details: {
            qualityScore: quality.score,
            runId,
            templateKey: recipe.templateKey,
            imageSource: imageMeta?.source,
          },
        });
      }

      report.upgraded++;
      report.scoreSum += quality.score;
      report.minAchieved = Math.min(report.minAchieved, quality.score);
      report.maxAchieved = Math.max(report.maxAchieved, quality.score);
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
    } finally {
      report.processed++;
      if (report.processed % 100 === 0) {
        writeAuditLog({
          runId,
          action: "premium_upgrade_checkpoint",
          details: {
            processed: report.processed,
            upgraded: report.upgraded,
            failed: report.failed,
            realPhotos: report.realPhotos,
            avgScore: report.upgraded ? Math.round(report.scoreSum / report.upgraded) : 0,
          },
        });
        console.log(
          `[premium] ${report.processed}/${rows.length} · upgraded ${report.upgraded} · real ${report.realPhotos} · studio ${report.studioArt} · failed ${report.failed}`
        );
        refreshQualityCatalog();
      }
    }
  }

  // Concurrent worker pool
  let cursor = 0;
  async function worker() {
    while (cursor < rows.length) {
      const i = cursor++;
      await processOne(rows[i]);
    }
  }
  const workers = Array.from({ length: Math.max(1, concurrency) }, () => worker());
  await Promise.all(workers);

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
  refreshQualityCatalog();
  return report;
}

function syncPremiumToLive(recipe) {
  // Dynamic import avoided — keep sync path light; canonicalize inline
  const diets = (Array.isArray(recipe.diet) ? recipe.diet : [recipe.diet]).filter(Boolean).map((d) => String(d).toLowerCase());
  const nonVeg = diets.some((d) => d.includes("non-veg") || d === "nonveg" || d === "non-vegetarian");
  const canon = nonVeg
    ? [...new Set([...diets, "non-veg"])]
    : [...new Set([...diets, "veg", diets.includes("vegetarian") ? null : "vegetarian"].filter(Boolean))];
  const mealType = recipe.mealType || "lunch";
  const category = mealType === "snack" ? "snack" : nonVeg ? `nonveg-${mealType}` : `veg-${mealType}`;
  const id = recipe.id;
  const hasLocal = Boolean(recipe.localImage);

  upsertRecipe({
    id,
    name: recipe.title || recipe.name,
    nameHi: recipe.nameHi || recipe.title,
    mealType,
    diet: canon,
    cuisine: recipe.cuisine || "indian",
    category,
    budget: recipe.budget || "medium",
    cookTime: recipe.cookTimeMin || recipe.totalTimeMin || 30,
    calories: recipe.calories || 300,
    spice: recipe.spice || "medium",
    healthScore: recipe.healthScore ?? 9,
    localImage: recipe.localImage || null,
    thumbUrl: hasLocal ? `/api/recipes/image/${id}` : recipe.thumbUrl || null,
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
      if (m.source === "premium-hero" || m.source === "premium-hero-real" || m.source === "rasoira-ai-original") n++;
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
  const realPhotos = countByImageSource("premium-hero-real");
  return {
    liveCatalog: live,
    quality90Plus: q90,
    nutritionVerified: verified,
    avgQualityScore: avg ? Math.round(avg) : 0,
    premiumHeroes: countPremiumHeroes(),
    realPhotos,
    studioArt: countByImageSource("premium-hero"),
    minScoreRequired: MIN_SCORE,
    remainingBelow90: Math.max(0, live - q90),
  };
}

function countByImageSource(source) {
  if (!fs.existsSync(META_DIR)) return 0;
  let n = 0;
  for (const f of fs.readdirSync(META_DIR)) {
    if (!f.endsWith(".json")) continue;
    try {
      const m = JSON.parse(fs.readFileSync(path.join(META_DIR, f), "utf8"));
      if (m.source === source) n++;
    } catch {
      /* skip */
    }
  }
  return n;
}
