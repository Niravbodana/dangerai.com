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

const router = Router();

router.use(optionalAuth);
router.use(adminMiddleware);

ensureIntelligenceDb();
seedSourceRegistry();

router.get("/dashboard", (_req, res) => {
  res.json({
    success: true,
    pipeline: getPipelineStatus(),
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
  });
  res.json({ success: true, result });
});

export default router;
