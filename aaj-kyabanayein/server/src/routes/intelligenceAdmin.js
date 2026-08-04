/**
 * Admin API — Recipe Intelligence System (Phase 2).
 */
import { Router } from "express";
import { adminMiddleware } from "../middleware/adminAuth.js";
import { optionalAuth } from "../middleware/auth.js";
import {
  listReviewQueue,
  getReviewItem,
  approveRecipe,
  rejectRecipe,
  bulkApprove,
  getReviewStats,
  listSources,
  getAuditLog,
  getQueueStats,
  listJobs,
  enqueueJob,
  processOneJob,
  getSearchIndexStats,
  getIntelligenceRecipe,
  countIntelligenceRecipes,
  seedSourceRegistry,
} from "../intelligence/index.js";
import { getPipelineStatus, runRecipePipeline } from "../pipeline/pipelineRunner.js";
import { readSkippedLog } from "../pipeline/license/skipLogger.js";
import { ensureIntelligenceDb } from "../intelligence/repository.js";
import {
  runResearchPipeline,
  getCatalogStats,
  getRecipeAuditTrail,
  getResearchBrief,
} from "../research/index.js";
import {
  runEnterpriseResearch,
  getAgentRuns,
  getAgentRunStats,
  getIngredientStats,
  searchIngredients,
  seedIngredientDatabase,
  AGENT_NAMES,
} from "../enterprise/index.js";
import {
  runPhase3Import,
  buildImportPlan,
  getPhase3Status,
  getImportProgress,
  getPopularRecipeCount,
} from "../phase3/index.js";

const router = Router();

router.use(optionalAuth);
router.use(adminMiddleware);

ensureIntelligenceDb();
seedSourceRegistry();
seedIngredientDatabase();

router.get("/dashboard", (_req, res) => {
  res.json({
    success: true,
    pipeline: getPipelineStatus(),
    research: getCatalogStats(),
    enterprise: {
      version: "2.0",
      agents: AGENT_NAMES,
      agentStats: getAgentRunStats(),
      ingredients: getIngredientStats(),
    },
    phase3: getPhase3Status(),
    review: getReviewStats(),
    jobs: getQueueStats(),
    search: getSearchIndexStats(),
    intelligenceRecipes: {
      total: countIntelligenceRecipes(),
      approved: countIntelligenceRecipes("approved"),
      pending: countIntelligenceRecipes("pending"),
      rejected: countIntelligenceRecipes("rejected"),
    },
  });
});

router.get("/sources", (_req, res) => {
  res.json({ success: true, sources: listSources() });
});

router.get("/review-queue", (req, res) => {
  const status = req.query.status || "pending";
  const limit = Math.min(100, parseInt(req.query.limit) || 50);
  const offset = parseInt(req.query.offset) || 0;
  res.json({
    success: true,
    items: listReviewQueue({ status, limit, offset }),
    stats: getReviewStats(),
  });
});

router.get("/review-queue/:id", (req, res) => {
  const item = getReviewItem(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: "Not found" });
  const recipe = getIntelligenceRecipe(item.recipe_id);
  res.json({ success: true, item, recipe });
});

router.post("/review-queue/:recipeId/approve", (req, res) => {
  const result = approveRecipe(req.params.recipeId, req.user?.email || "admin");
  res.json({ success: true, ...result });
});

router.post("/review-queue/:recipeId/reject", (req, res) => {
  const result = rejectRecipe(req.params.recipeId, req.user?.email || "admin", req.body?.reason || "");
  res.json({ success: true, ...result });
});

router.post("/review-queue/bulk-approve", (req, res) => {
  const ids = req.body?.recipeIds || [];
  const results = bulkApprove(ids, req.user?.email || "admin");
  res.json({ success: true, approved: results.length, results });
});

router.get("/audit-log", (req, res) => {
  res.json({
    success: true,
    log: getAuditLog({
      limit: parseInt(req.query.limit) || 100,
      entityType: req.query.entityType || null,
      runId: req.query.runId || null,
    }),
  });
});

router.get("/pipeline/status", (_req, res) => {
  res.json({ success: true, ...getPipelineStatus() });
});

router.get("/pipeline/skipped", (_req, res) => {
  res.json({ success: true, skipped: readSkippedLog(100) });
});

router.post("/pipeline/run", async (req, res) => {
  const opts = {
    datasets: req.body?.datasets || ["rasoira-curated-modules"],
    limit: req.body?.limit || Infinity,
    skipAi: req.body?.skipAi !== false,
    skipNutrition: req.body?.skipNutrition === true,
    dryRun: req.body?.dryRun === true,
    resume: req.body?.resume === true,
  };

  const jobId = enqueueJob("pipeline_run", opts);
  res.json({ success: true, jobId, message: "Pipeline job enqueued", opts });
});

router.post("/pipeline/run-sync", async (req, res) => {
  try {
    const report = await runRecipePipeline({
      datasets: req.body?.datasets || ["rasoira-curated-modules"],
      limit: req.body?.limit || 50,
      skipAi: req.body?.skipAi !== false,
      skipNutrition: req.body?.skipNutrition === true,
      dryRun: req.body?.dryRun === true,
      resume: req.body?.resume === true,
    });
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/jobs", (req, res) => {
  res.json({
    success: true,
    stats: getQueueStats(),
    jobs: listJobs({ status: req.query.status || null, limit: 50 }),
  });
});

router.post("/jobs/process-one", async (_req, res) => {
  const result = await processOneJob({
    pipeline_run: async (payload) => runRecipePipeline(payload),
    research_run: async (payload) => runResearchPipeline(payload),
    enterprise_run: async (payload) => runEnterpriseResearch(payload),
    phase3_import: async (payload) => runPhase3Import(payload),
  });
  res.json({ success: true, result });
});

router.get("/research/status", (_req, res) => {
  res.json({ success: true, catalog: getCatalogStats() });
});

router.get("/research/audit/:recipeId", (req, res) => {
  const trail = getRecipeAuditTrail(req.params.recipeId);
  res.json({ success: true, recipeId: req.params.recipeId, trail });
});

router.get("/research/brief/:briefId", (req, res) => {
  const brief = getResearchBrief(req.params.briefId);
  if (!brief) return res.status(404).json({ success: false, message: "Brief not found" });
  res.json({ success: true, brief });
});

router.post("/research/run", (req, res) => {
  const opts = {
    limit: req.body?.limit || 10,
    offset: req.body?.offset || 0,
    cuisines: req.body?.cuisines || null,
    dryRun: req.body?.dryRun === true,
  };
  const jobId = enqueueJob("research_run", opts);
  res.json({ success: true, jobId, message: "Research job enqueued", opts });
});

router.post("/research/run-sync", async (req, res) => {
  try {
    const report = await runResearchPipeline({
      limit: req.body?.limit || 10,
      offset: req.body?.offset || 0,
      cuisines: req.body?.cuisines || null,
      dryRun: req.body?.dryRun === true,
    });
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/enterprise/status", (_req, res) => {
  res.json({
    success: true,
    version: "2.0",
    catalog: getCatalogStats(),
    agents: AGENT_NAMES,
    agentStats: getAgentRunStats(),
    ingredients: getIngredientStats(),
  });
});

router.get("/enterprise/agents", (req, res) => {
  res.json({
    success: true,
    agents: AGENT_NAMES,
    stats: getAgentRunStats(),
    runs: getAgentRuns({
      recipeId: req.query.recipeId || null,
      runId: req.query.runId || null,
      limit: parseInt(req.query.limit) || 50,
    }),
  });
});

router.get("/enterprise/agents/:recipeId", (req, res) => {
  res.json({
    success: true,
    recipeId: req.params.recipeId,
    runs: getAgentRuns({ recipeId: req.params.recipeId }),
    audit: getRecipeAuditTrail(req.params.recipeId),
  });
});

router.get("/ingredients", (req, res) => {
  res.json({
    success: true,
    ...searchIngredients({
      q: req.query.q || null,
      category: req.query.category || null,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
    }),
    stats: getIngredientStats(),
  });
});

router.post("/enterprise/run", (req, res) => {
  const opts = {
    limit: req.body?.limit || 5,
    offset: req.body?.offset || 0,
    cuisines: req.body?.cuisines || null,
    dryRun: req.body?.dryRun === true,
    minQualityScore: req.body?.minQualityScore || 60,
  };
  const jobId = enqueueJob("enterprise_run", opts);
  res.json({ success: true, jobId, message: "Enterprise research job enqueued", opts });
});

router.post("/enterprise/run-sync", async (req, res) => {
  try {
    const report = await runEnterpriseResearch({
      limit: req.body?.limit || 5,
      offset: req.body?.offset || 0,
      cuisines: req.body?.cuisines || null,
      dryRun: req.body?.dryRun === true,
      minQualityScore: req.body?.minQualityScore || 60,
    });
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/phase3/plan", (_req, res) => {
  res.json({ success: true, ...getPhase3Status() });
});

router.get("/phase3/progress", (req, res) => {
  const db = ensureIntelligenceDb();
  res.json({
    success: true,
    items: getImportProgress(db, {
      status: req.query.status || null,
      cuisine: req.query.cuisine || null,
      limit: parseInt(req.query.limit) || 100,
    }),
  });
});

router.post("/phase3/import", (req, res) => {
  const opts = {
    phase: req.body?.phase || 1,
    limit: req.body?.limit || 5,
    offset: req.body?.offset || 0,
    cuisines: req.body?.cuisines || null,
    categories: req.body?.categories || null,
    dryRun: req.body?.dryRun === true,
    minQualityScore: req.body?.minQualityScore || 70,
  };
  const jobId = enqueueJob("phase3_import", opts);
  res.json({ success: true, jobId, message: "Phase 3 import job enqueued", opts });
});

router.post("/phase3/import-sync", async (req, res) => {
  try {
    const report = await runPhase3Import({
      phase: req.body?.phase || 1,
      limit: req.body?.limit || 5,
      offset: req.body?.offset || 0,
      cuisines: req.body?.cuisines || null,
      categories: req.body?.categories || null,
      dryRun: req.body?.dryRun === true,
      minQualityScore: req.body?.minQualityScore || 70,
    });
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
