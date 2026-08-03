/**
 * Master Recipe Research Runner — research → verify → generate → review.
 * NOT scraping. NOT copying. Original content only.
 */
import crypto from "crypto";
import { generateResearchSeeds, getCatalogStats } from "./recipeCatalog.js";
import { buildResearchBrief, validateBriefSources } from "./factualKnowledge.js";
import { generateOriginalRecipeFromResearch } from "./originalContentGenerator.js";
import { calculateStrictNutrition } from "./strictNutrition.js";
import { runResearchQualityGate } from "./researchQualityGate.js";
import { recordRecipeAudit, saveResearchBrief } from "./auditTrail.js";
import { buildSeoBundle } from "../intelligence/seoBundle.js";
import { buildContentHash, slugify } from "../pipeline/services/duplicateDetector.js";
import { saveIntelligenceRecipe } from "../intelligence/recipeStore.js";
import { enqueueForReview } from "../intelligence/reviewQueue.js";
import { writeAuditLog } from "../intelligence/auditLog.js";
import { ensureIntelligenceDb } from "../intelligence/repository.js";
import { ensureAuditTrailSchema } from "./auditTrail.js";

/**
 * @param {object} options
 */
export async function runResearchPipeline(options = {}) {
  const {
    cuisines = null,
    limit = 10,
    offset = 0,
    dryRun = false,
    runId = `research-${Date.now()}`,
  } = options;

  ensureIntelligenceDb();
  const db = ensureIntelligenceDb();
  ensureAuditTrailSchema(db);

  const report = {
    runId,
    startedAt: new Date().toISOString(),
    catalog: getCatalogStats(),
    researched: 0,
    generated: 0,
    rejected: 0,
    queued: 0,
    errors: [],
    finishedAt: null,
  };

  writeAuditLog({ runId, action: "research_run_started", details: { limit, offset } });

  const seeds = generateResearchSeeds({ cuisines, limit, offset });

  for (const seed of seeds) {
    try {
      const brief = buildResearchBrief(seed);
      const briefCheck = validateBriefSources(brief);
      if (!briefCheck.valid) {
        report.rejected++;
        report.errors.push({ id: seed.id, error: "brief_invalid", issues: briefCheck.issues });
        continue;
      }

      if (!dryRun) saveResearchBrief(brief);
      report.researched++;

      const content = await generateOriginalRecipeFromResearch(brief, seed);
      const nutrition = await calculateStrictNutrition(content.ingredients, 4);

      const recipe = assembleRecipe(seed, brief, content, nutrition);
      const quality = runResearchQualityGate(recipe);

      recordRecipeAudit(recipe.id, {
        type: "research_generated",
        sourceName: "rasoira-research",
        licenseName: "RASOIRA-AI",
        nutritionStatus: nutrition.status,
        verificationStatus: quality.passed ? "pending_review" : "rejected",
        details: { briefId: brief.briefId, qualityIssues: quality.issues },
      });

      if (!quality.passed) {
        report.rejected++;
        report.errors.push({ id: seed.id, error: "quality_gate", issues: quality.issues });
        recordRecipeAudit(recipe.id, { type: "research_rejected", details: { issues: quality.issues } });
        continue;
      }

      report.generated++;

      if (!dryRun) {
        recipe.reviewStatus = "pending";
        saveIntelligenceRecipe(recipe);
        enqueueForReview(recipe, { ...quality, autoApprove: false });
        recordRecipeAudit(recipe.id, {
          type: "queued_for_review",
          nutritionStatus: nutrition.status,
          verificationStatus: "pending_review",
        });
        report.queued++;
      }
    } catch (err) {
      report.errors.push({ id: seed.id, error: err.message });
      report.rejected++;
    }
  }

  report.finishedAt = new Date().toISOString();
  writeAuditLog({ runId, action: "research_run_completed", details: report });
  return report;
}

function assembleRecipe(seed, brief, content, nutrition) {
  const title = content.title || seed.name;
  const slug = seed.slug || slugify(title);
  const prepTimeMin = 15;
  const cookTimeMin = brief.facts?.typicalCookTimeMin || 30;

  const recipe = {
    id: seed.id,
    uuid: crypto.randomUUID?.() || seed.id,
    slug,
    title,
    ...content,
    cuisine: seed.cuisine,
    region: seed.region,
    state: seed.state,
    mealType: seed.mealType,
    diet: seed.diet,
    category: seed.category,
    difficulty: "medium",
    servings: 4,
    prepTimeMin,
    cookTimeMin,
    totalTimeMin: prepTimeMin + cookTimeMin,
    calories: nutrition.calories,
    nutrition,
    nutritionStatus: nutrition.status,
    nutritionSource: nutrition.dataSource,
    proteinG: nutrition.proteinG,
    carbsG: nutrition.carbsG,
    fatG: nutrition.fatG,
    fiberG: nutrition.fiberG,
    sugarG: nutrition.sugarG,
    sodiumMg: nutrition.sodiumMg,
    dataSource: "rasoira-research",
    sourceName: "Rasoira Research System",
    licenseSpdx: "RASOIRA-AI",
    licenseName: "Rasoira AI-generated original content",
    commercialUseAllowed: true,
    verifiedOn: new Date().toISOString(),
    importedOn: new Date().toISOString(),
    researchBriefId: brief.briefId,
    contentHash: buildContentHash({ title, cuisine: seed.cuisine, mealType: seed.mealType, ingredients: content.ingredients }),
    duplicateScore: 0,
    reviewStatus: "pending",
    requireVerifiedNutrition: true,
  };

  const seo = buildSeoBundle(recipe);
  recipe.seoBundle = seo;
  recipe.seoTitle = seo.seoTitle;
  recipe.seoDescription = seo.seoDescription;
  recipe.canonicalUrl = seo.canonicalUrl;
  recipe.schemaOrg = seo.recipeSchema;

  return recipe;
}

export { getCatalogStats } from "./recipeCatalog.js";
