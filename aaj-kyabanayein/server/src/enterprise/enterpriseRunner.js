/**
 * Enterprise AI Research Runner v2.0
 */
import { generateResearchSeeds, getCatalogStats } from "../research/recipeCatalog.js";
import { runAgentPipeline, getAgentRuns, getAgentRunStats } from "./agentOrchestrator.js";
import { seedIngredientDatabase, getIngredientStats } from "./ingredients/ingredientDatabase.js";
import { saveIntelligenceRecipe } from "../intelligence/recipeStore.js";
import { enqueueForReview } from "../intelligence/reviewQueue.js";
import { writeAuditLog } from "../intelligence/auditLog.js";
import { recordRecipeAudit } from "../research/auditTrail.js";
import { ensureIntelligenceDb, getIntelligenceDb } from "../intelligence/repository.js";
import { ensureEnterpriseSchema } from "./schema.js";
import { runResearchQualityGate } from "../research/researchQualityGate.js";

export async function runEnterpriseResearch(options = {}) {
  const {
    cuisines = null,
    limit = 10,
    offset = 0,
    dryRun = false,
    runId = `enterprise-${Date.now()}`,
    minQualityScore = 60,
  } = options;

  ensureIntelligenceDb();
  const db = getIntelligenceDb();
  ensureEnterpriseSchema(db);
  seedIngredientDatabase();

  const report = {
    runId,
    version: "2.0",
    startedAt: new Date().toISOString(),
    catalog: getCatalogStats(),
    ingredients: getIngredientStats(),
    processed: 0,
    generated: 0,
    rejected: 0,
    queued: 0,
    avgQualityScore: 0,
    agentStats: getAgentRunStats(),
    errors: [],
    finishedAt: null,
  };

  writeAuditLog({ runId, action: "enterprise_run_started", details: { limit, offset, version: "2.0" } });

  const seeds = generateResearchSeeds({ cuisines, limit, offset });
  let qualitySum = 0;

  for (const seed of seeds) {
    try {
      const pipeline = await runAgentPipeline(seed, { runId });
      report.processed++;

      const recipe = pipeline.recipe;
      const quality = pipeline.quality;
      qualitySum += quality.score;

      recordRecipeAudit(recipe.id, {
        type: "enterprise_generated",
        sourceName: "rasoira-enterprise-v2",
        licenseName: "RASOIRA-AI",
        nutritionStatus: recipe.nutritionStatus,
        verificationStatus: pipeline.success ? "pending_review" : "rejected",
        details: {
          qualityScore: quality.score,
          qualityGrade: quality.grade,
          agentRuns: pipeline.agentRuns.length,
          aborted: pipeline.aborted,
        },
      });

      if (!pipeline.success || quality.score < minQualityScore) {
        report.rejected++;
        report.errors.push({
          id: seed.id,
          error: pipeline.aborted ? "agent_pipeline_aborted" : "quality_below_threshold",
          qualityScore: quality.score,
          issues: pipeline.agentRuns.flatMap((a) => a.issues),
        });
        continue;
      }

      const qc = runResearchQualityGate(recipe);
      if (!qc.passed) {
        report.rejected++;
        report.errors.push({ id: seed.id, error: "quality_gate", issues: qc.issues });
        continue;
      }

      report.generated++;

      if (!dryRun) {
        recipe.reviewStatus = "pending";
        recipe.verificationStatus = "pending_review";
        saveEnterpriseRecipe(recipe);
        enqueueForReview(recipe, { ...qc, scores: { ...qc.scores, quality: quality.score / 100 }, autoApprove: false });
        recordRecipeAudit(recipe.id, {
          type: "queued_for_review",
          nutritionStatus: recipe.nutritionStatus,
          verificationStatus: "pending_review",
          details: { qualityScore: quality.score },
        });
        report.queued++;
      }
    } catch (err) {
      report.errors.push({ id: seed.id, error: err.message });
      report.rejected++;
    }
  }

  report.avgQualityScore = report.processed > 0 ? Math.round(qualitySum / report.processed) : 0;
  report.finishedAt = new Date().toISOString();
  writeAuditLog({ runId, action: "enterprise_run_completed", details: report });
  return report;
}

function saveEnterpriseRecipe(recipe) {
  saveIntelligenceRecipe(recipe);
  const db = getIntelligenceDb();
  db.prepare(`
    UPDATE recipe_intelligence SET
      quality_score = @quality_score,
      nutrition_status = @nutrition_status,
      verification_status = @verification_status
    WHERE id = @id
  `).run({
    id: recipe.id,
    quality_score: recipe.qualityScore || 0,
    nutrition_status: recipe.nutritionStatus || "unknown",
    verification_status: recipe.verificationStatus || "pending_review",
  });
}

export { getCatalogStats } from "../research/recipeCatalog.js";
export { getAgentRuns, getAgentRunStats } from "./agentOrchestrator.js";
export { getIngredientStats, searchIngredients, seedIngredientDatabase } from "./ingredients/ingredientDatabase.js";
export { calculateQualityScore } from "./qualityScore.js";
export { AGENT_NAMES } from "./agents/index.js";
