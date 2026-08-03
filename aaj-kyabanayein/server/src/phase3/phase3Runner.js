/**
 * Phase 3 — import runner.
 * Imports curated popular recipes via Enterprise v2 agent pipeline.
 */
import { buildImportQueue, buildImportPlan } from "./importPlanner.js";
import { ensurePhase3Schema, recordImportProgress, getImportedIds, getImportProgress } from "./schema.js";
import { runAgentPipeline } from "../enterprise/agentOrchestrator.js";
import { runResearchQualityGate } from "../research/researchQualityGate.js";
import { saveIntelligenceRecipe } from "../intelligence/recipeStore.js";
import { enqueueForReview } from "../intelligence/reviewQueue.js";
import { writeAuditLog } from "../intelligence/auditLog.js";
import { recordRecipeAudit } from "../research/auditTrail.js";
import { ensureIntelligenceDb, getIntelligenceDb } from "../intelligence/repository.js";
import { seedIngredientDatabase } from "../enterprise/ingredients/ingredientDatabase.js";
import { POPULAR_RECIPES } from "./popularRecipes.js";
import { PHASE3_TARGETS } from "./importTargets.js";

/**
 * @param {object} options
 */
export async function runPhase3Import(options = {}) {
  const {
    phase = 1,
    cuisines = null,
    categories = null,
    limit = 10,
    offset = 0,
    dryRun = false,
    runId = `phase3-${Date.now()}`,
    minQualityScore = 70,
  } = options;

  ensureIntelligenceDb();
  const db = getIntelligenceDb();
  ensurePhase3Schema(db);
  seedIngredientDatabase();

  const excludeImported = getImportedIds(db);

  const report = {
    runId,
    version: "3.0",
    phase,
    startedAt: new Date().toISOString(),
    plan: buildImportPlan(),
    queued: 0,
    imported: 0,
    rejected: 0,
    skipped: 0,
    errors: [],
    finishedAt: null,
  };

  writeAuditLog({ runId, action: "phase3_import_started", details: { phase, limit } });

  const seeds = buildImportQueue({ phase, cuisines, categories, limit, offset, excludeImported });

  for (const seed of seeds) {
    const progressId = seed.id;

    if (excludeImported.has(progressId)) {
      report.skipped++;
      continue;
    }

    try {
      const pipeline = await runAgentPipeline(seed, { runId });
      const recipe = {
        ...pipeline.recipe,
        dataSource: "rasoira-phase3",
        sourceName: "Rasoira Phase 3 Curated Import",
        phase3: true,
        curated: true,
        popularityScore: seed.popularityScore,
        alternativeNames: seed.alternativeNames,
        searchKeywords: seed.searchKeywords,
      };

      recordRecipeAudit(recipe.id, {
        type: "phase3_import_generated",
        sourceName: "rasoira-phase3",
        licenseName: "RASOIRA-AI",
        nutritionStatus: recipe.nutritionStatus,
        verificationStatus: pipeline.success ? "pending_review" : "rejected",
        details: { popularityScore: seed.popularityScore, qualityScore: pipeline.quality.score },
      });

      if (!pipeline.success || pipeline.quality.score < minQualityScore) {
        report.rejected++;
        report.errors.push({
          id: seed.id,
          name: seed.name,
          error: "quality_below_threshold",
          qualityScore: pipeline.quality.score,
        });
        if (!dryRun) {
          recordImportProgress(db, {
            id: progressId,
            recipe_name: seed.name,
            cuisine: seed.cuisine,
            category: seed.category,
            popularity_score: seed.popularityScore,
            priority: seed.priority,
            import_phase: phase,
            status: "rejected",
            quality_score: pipeline.quality.score,
            recipe_id: recipe.id,
            run_id: runId,
            error: "quality_below_threshold",
            imported_at: null,
          });
        }
        continue;
      }

      const qc = runResearchQualityGate(recipe);
      if (!qc.passed) {
        report.rejected++;
        report.errors.push({ id: seed.id, name: seed.name, error: "quality_gate", issues: qc.issues });
        continue;
      }

      report.imported++;

      if (!dryRun) {
        recipe.reviewStatus = "pending";
        recipe.verificationStatus = "pending_review";
        saveIntelligenceRecipe(recipe);
        db.prepare(`
          UPDATE recipe_intelligence SET quality_score = ?, nutrition_status = ?, verification_status = ?
          WHERE id = ?
        `).run(pipeline.quality.score, recipe.nutritionStatus, "pending_review", recipe.id);

        enqueueForReview(recipe, { ...qc, scores: { ...qc.scores, quality: pipeline.quality.score / 100 }, autoApprove: false });

        recordImportProgress(db, {
          id: progressId,
          recipe_name: seed.name,
          cuisine: seed.cuisine,
          category: seed.category,
          popularity_score: seed.popularityScore,
          priority: seed.priority,
          import_phase: phase,
          status: "imported",
          quality_score: pipeline.quality.score,
          recipe_id: recipe.id,
          run_id: runId,
          error: null,
          imported_at: new Date().toISOString(),
        });

        recordRecipeAudit(recipe.id, {
          type: "phase3_queued_for_review",
          nutritionStatus: recipe.nutritionStatus,
          verificationStatus: "pending_review",
          details: { qualityScore: pipeline.quality.score, popularityScore: seed.popularityScore },
        });
      }
    } catch (err) {
      report.rejected++;
      report.errors.push({ id: seed.id, name: seed.name, error: err.message });
    }
  }

  report.queued = report.imported;
  report.finishedAt = new Date().toISOString();
  writeAuditLog({ runId, action: "phase3_import_completed", details: report });
  return report;
}

export { buildImportPlan, buildImportQueue } from "./importPlanner.js";
export { POPULAR_RECIPES, getPhase1Recipes, getPopularRecipeCount } from "./popularRecipes.js";
export { PHASE3_TARGETS, TOTAL_PHASE3_TARGET, IMPORT_PHASES } from "./importTargets.js";
export { getImportProgress } from "./schema.js";

export function getPhase3Status() {
  const db = getIntelligenceDb();
  ensurePhase3Schema(db);
  const plan = buildImportPlan();
  const progress = getImportProgress(db, { limit: 500 });
  const imported = progress.filter((p) => p.status === "imported").length;
  const rejected = progress.filter((p) => p.status === "rejected").length;
  const pending = POPULAR_RECIPES.length - imported - rejected;

  return {
    version: "3.0",
    plan,
    progress: { imported, rejected, pending, total: POPULAR_RECIPES.length },
    targets: PHASE3_TARGETS,
    phase1Ready: plan.phase1Count,
  };
}
