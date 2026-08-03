/**
 * Rasoira Recipe Data Pipeline — resumable, legally compliant orchestrator.
 *
 * Stages:
 *  1. verify  — license gate (skip if not commercial-safe)
 *  2. fetch   — load from registered adapters only
 *  3. transform — normalize, nutrition, AI text, SEO, dedupe
 *  4. persist — PostgreSQL (+ optional SQLite provenance)
 */
import { REGISTERED_DATASETS, BLOCKED_SOURCES } from "./config/allowedSources.js";
import { verifyDatasetLicense } from "./license/licenseVerifier.js";
import { CuratedModulesAdapter } from "./adapters/curatedModulesAdapter.js";
import { transformRecipeDraft } from "./transformRecipe.js";
import {
  createRunId,
  initRunState,
  loadPipelineState,
  markProcessed,
  markRunComplete,
  incrementStat,
  isAlreadyProcessed,
  updateCheckpoint,
} from "./pipelineState.js";
import { log } from "./pipelineLogger.js";
import { isPostgresConfigured } from "./db/postgresClient.js";
import {
  createPipelineRun,
  updatePipelineRun,
  upsertProductionRecipe,
  getExistingContentHashes,
  countProductionRecipes,
  logSkippedToPostgres,
} from "./db/postgresRepository.js";

const STAGES = ["verify", "fetch", "transform", "persist", "complete"];

/**
 * @param {object} options
 * @param {string[]} [options.datasets] - dataset ids to import (default: rasoira-curated-modules)
 * @param {boolean} [options.resume] - resume from checkpoint
 * @param {boolean} [options.skipAi] - skip AI text generation (faster, uses existing steps)
 * @param {boolean} [options.skipNutrition] - skip USDA calls
 * @param {number} [options.limit] - max recipes to process
 * @param {boolean} [options.dryRun] - transform only, no persist
 */
export async function runRecipePipeline(options = {}) {
  const {
    datasets = ["rasoira-curated-modules"],
    resume = false,
    skipAi = true,
    skipNutrition = false,
    limit = Infinity,
    dryRun = false,
  } = options;

  let state = resume ? loadPipelineState() : null;
  const runId = state?.runId || createRunId();

  if (!state) {
    state = initRunState(runId, { datasets, skipAi, skipNutrition, limit, dryRun });
    log.info("Pipeline run started", { runId });
  } else {
    log.info("Resuming pipeline run", { runId, stage: state.checkpoint.stage });
  }

  if (isPostgresConfigured() && !dryRun) {
    try {
      await createPipelineRun(runId, state.config);
    } catch (err) {
      log.warn("PostgreSQL run record skipped", { error: err.message, runId });
    }
  }

  const report = {
    runId,
    startedAt: state.startedAt,
    datasets: [],
    imported: 0,
    skipped: 0,
    failed: 0,
    duplicates: 0,
    errors: [],
  };

  try {
    // Stage 1: Verify all requested datasets
    updateCheckpoint({ stage: "verify" });
    const verifiedDatasets = [];

    for (const datasetId of datasets) {
      const verification = verifyDatasetLicense({ id: datasetId }, { runId });
      if (!verification.allowed) {
        report.skipped++;
        report.datasets.push({ id: datasetId, status: "skipped", reason: verification.reason });
        incrementStat("skipped");
        if (isPostgresConfigured()) {
          await logSkippedToPostgres({ runId, datasetId, reason: verification.reason }).catch(() => {});
        }
        continue;
      }
      verifiedDatasets.push(datasetId);
      incrementStat("verified");
      report.datasets.push({ id: datasetId, status: "verified", license: verification.licenseSpdx });
      log.info(`Dataset verified: ${datasetId}`, { runId, license: verification.licenseSpdx });
    }

    if (!verifiedDatasets.length) {
      throw new Error("No datasets passed license verification — nothing to import");
    }

    // Stage 2: Fetch
    updateCheckpoint({ stage: "fetch" });
    let rawRecipes = [];

    for (const datasetId of verifiedDatasets) {
      if (datasetId === "rasoira-curated-modules") {
        const adapter = new CuratedModulesAdapter();
        adapter.verifyLicense(runId);
        const batch = await adapter.fetch();
        rawRecipes.push(...batch);
        log.info(`Fetched ${batch.length} recipes from ${datasetId}`, { runId });
      }
    }

  rawRecipes = rawRecipes.slice(0, limit);

    // Stage 3 & 4: Transform + Persist
    updateCheckpoint({ stage: "transform" });
    let existing = [];
    if (isPostgresConfigured()) {
      try {
        existing = await getExistingContentHashes();
      } catch {
        existing = [];
      }
    }

    for (const raw of rawRecipes) {
      if (isAlreadyProcessed(raw.id)) {
        log.info(`Skipping already processed: ${raw.id}`, { runId });
        continue;
      }

      try {
        const result = await transformRecipeDraft(raw, {
          skipAi,
          skipNutrition,
          existingRecipes: existing,
          batchId: runId,
        });

        if (!result.ok) {
          if (result.error === "duplicate") {
            report.duplicates++;
            incrementStat("duplicates");
            log.skip(`Duplicate: ${raw.id} → ${result.duplicateOf}`, { runId, recipeId: raw.id });
          } else {
            report.failed++;
            incrementStat("failed");
            report.errors.push({ id: raw.id, error: result.error, issues: result.issues });
          }
          markProcessed(raw.id);
          continue;
        }

        incrementStat("normalized");
        incrementStat("textGenerated");
        if (!skipNutrition) incrementStat("nutritionCalculated");

        if (!dryRun && isPostgresConfigured()) {
          updateCheckpoint({ stage: "persist" });
          await upsertProductionRecipe(result.recipe, runId);
          incrementStat("persisted");
          report.imported++;
        } else if (dryRun) {
          report.imported++;
        }

        existing.push({ id: result.recipe.id, content_hash: result.recipe.contentHash, title: result.recipe.title, ingredients: result.recipe.ingredients });
        markProcessed(raw.id);

        if (report.imported % 50 === 0 && report.imported > 0) {
          log.info(`Progress: ${report.imported} recipes processed`, { runId });
        }
      } catch (err) {
        report.failed++;
        report.errors.push({ id: raw.id, error: err.message });
        log.error(`Failed: ${raw.id}`, { runId, recipeId: raw.id, error: err.message });
        markProcessed(raw.id);
      }
    }

    updateCheckpoint({ stage: "complete" });
    markRunComplete("completed");
    report.finishedAt = new Date().toISOString();
    report.status = "completed";

    if (isPostgresConfigured()) {
      await updatePipelineRun(runId, {
        status: "completed",
        finishedAt: report.finishedAt,
        stats: state.stats,
        checkpoint: state.checkpoint,
      }).catch(() => {});
      report.postgresCount = await countProductionRecipes().catch(() => null);
    }

    log.info("Pipeline completed", { runId, imported: report.imported, skipped: report.skipped });
    return report;
  } catch (err) {
    markRunComplete("failed", err.message);
    if (isPostgresConfigured()) {
      await updatePipelineRun(runId, { status: "failed", error: err.message }).catch(() => {});
    }
    log.error("Pipeline failed", { runId, error: err.message });
    throw err;
  }
}

export function getPipelineStatus() {
  const state = loadPipelineState();
  return {
    state,
    registeredDatasets: Object.keys(REGISTERED_DATASETS),
    blockedSources: BLOCKED_SOURCES.map((b) => b.id),
    postgresConfigured: isPostgresConfigured(),
    stages: STAGES,
  };
}

export { verifyDatasetLicense } from "./license/licenseVerifier.js";
export { REGISTERED_DATASETS, BLOCKED_SOURCES } from "./config/allowedSources.js";
