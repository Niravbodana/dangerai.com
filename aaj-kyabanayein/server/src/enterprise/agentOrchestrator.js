/**
 * Agent orchestrator — runs 10 specialized agents in sequence.
 */
import crypto from "crypto";
import { getIntelligenceDb } from "../intelligence/repository.js";
import { ensureEnterpriseSchema } from "./schema.js";
import { AGENT_PIPELINE } from "./agents/index.js";
import { calculateQualityScore } from "./qualityScore.js";
import { buildContentHash, slugify } from "../pipeline/services/duplicateDetector.js";

/**
 * @param {object} seed - research seed
 * @param {object} options
 */
export async function runAgentPipeline(seed, options = {}) {
  const runId = options.runId || `enterprise-${Date.now()}`;
  const db = getIntelligenceDb();
  ensureEnterpriseSchema(db);

  const context = { seed, runId, servings: 4 };
  const agentResults = {};
  const agentRuns = [];
  let aborted = false;

  for (const AgentClass of AGENT_PIPELINE) {
    const agent = new AgentClass();
    const result = await agent.run(context);
    agentResults[agent.name] = result;
    agentRuns.push(result);

    recordAgentRun(db, {
      id: `ar-${crypto.randomBytes(6).toString("hex")}`,
      recipeId: seed.id,
      runId,
      agentName: agent.name,
      status: result.success ? "completed" : "failed",
      confidence: result.confidence,
      durationMs: result.durationMs,
      output: result.data,
      issues: result.issues,
    });

    mergeContext(context, agent.name, result);

    if (!result.success && isBlockingAgent(agent.name, options)) {
      aborted = true;
      break;
    }
  }

  const recipe = assembleEnterpriseRecipe(seed, context, agentResults);
  const quality = calculateQualityScore(agentResults, recipe);
  recipe.qualityScore = quality.score;
  recipe.qualityBreakdown = quality.breakdown;
  recipe.qualityGrade = quality.grade;

  return {
    runId,
    seed,
    recipe,
    agentResults,
    agentRuns,
    quality,
    aborted,
    success: !aborted && quality.score >= 60,
  };
}

function mergeContext(ctx, agentName, result) {
  const data = result.data || {};
  switch (agentName) {
    case "recipe_research":
      ctx.brief = data.brief;
      ctx.sources = data.sources;
      ctx.facts = data.facts;
      break;
    case "ingredient_knowledge":
      ctx.ingredients = data.ingredients;
      ctx.allergens = data.allergens;
      break;
    case "license_compliance":
      ctx.license = data;
      break;
    case "cuisine_expert":
      ctx.cuisineExpertise = data;
      break;
    case "original_writing":
      Object.assign(ctx, data);
      break;
    case "nutrition":
      ctx.nutrition = data.nutrition;
      break;
    case "image_verification":
      ctx.imageMetadata = data.imageMetadata;
      ctx.imageLicense = data.imageLicense;
      ctx.imageSource = data.imageSource;
      ctx.imageAttribution = data.imageAttribution;
      break;
    case "seo":
      ctx.seo = data;
      break;
    case "duplicate_detection":
      ctx.duplicate = data;
      break;
    default:
      break;
  }
}

function assembleEnterpriseRecipe(seed, ctx, agentResults) {
  const content = ctx;
  const nutrition = ctx.nutrition || {};
  const expertise = ctx.cuisineExpertise || {};
  const seo = ctx.seo || {};
  const prepTimeMin = 15;
  const cookTimeMin = ctx.facts?.typicalCookTimeMin || 30;

  return {
    id: seed.id,
    uuid: crypto.randomUUID?.() || seed.id,
    slug: seed.slug || slugify(content.title || seed.name),
    title: content.title || seed.name,
    alternativeNames: content.alternativeNames || [],
    introduction: content.introduction,
    steps: content.steps || [],
    stepsHi: content.stepsHi || [],
    chefNotes: content.chefNotes,
    servingSuggestions: content.servingSuggestions,
    commonMistakes: content.commonMistakes,
    storage: content.storage,
    shelfLife: content.shelfLife,
    reheating: content.reheating,
    recipeHistory: content.recipeHistory,
    interestingFacts: content.interestingFacts || [],
    festivalAssociation: seed.festival || content.festivalAssociation,
    faq: content.faq || [],
    cuisine: seed.cuisine,
    region: expertise.region || seed.region,
    state: expertise.state || seed.state,
    cityOfOrigin: expertise.cityOfOrigin,
    mealType: seed.mealType,
    diet: seed.diet,
    category: seed.category,
    difficulty: inferDifficulty(ctx),
    servings: 4,
    prepTimeMin,
    cookTimeMin,
    totalTimeMin: prepTimeMin + cookTimeMin,
    ingredients: ctx.ingredients || [],
    optionalIngredients: content.optionalIngredients || [],
    substitutes: content.substitutes || [],
    cookingEquipment: content.cookingEquipment || ctx.facts?.equipment || [],
    cookingMethod: content.cookingMethod || ctx.facts?.cookingMethod,
    temperature: content.temperature || ctx.facts?.temperature,
    calories: nutrition.calories,
    proteinG: nutrition.proteinG,
    carbsG: nutrition.carbsG,
    fatG: nutrition.fatG,
    fiberG: nutrition.fiberG,
    sugarG: nutrition.sugarG,
    sodiumMg: nutrition.sodiumMg,
    calciumMg: nutrition.minerals?.calcium,
    ironMg: nutrition.minerals?.iron,
    potassiumMg: nutrition.minerals?.potassium,
    vitaminA: nutrition.vitamins?.a,
    vitaminC: nutrition.vitamins?.c,
    vitaminD: nutrition.vitamins?.d,
    nutrition,
    nutritionStatus: nutrition.status || "unknown",
    nutritionSource: nutrition.dataSource || "USDA FoodData Central",
    allergens: ctx.allergens || [],
    tags: buildTags(seed, expertise),
    dataSource: "rasoira-enterprise-v2",
    sourceName: "Rasoira Enterprise AI Research",
    licenseSpdx: "RASOIRA-AI",
    licenseName: "Rasoira AI-generated original content",
    commercialUseAllowed: true,
    verifiedOn: new Date().toISOString(),
    researchBriefId: ctx.brief?.briefId,
    contentHash: buildContentHash({ title: content.title || seed.name, cuisine: seed.cuisine, mealType: seed.mealType, ingredients: ctx.ingredients }),
    duplicateScore: agentResults.duplicate_detection?.data?.duplicateScore || 0,
    similarityScore: agentResults.duplicate_detection?.data?.similarityScore || 0,
    originalityVerified: content.originalityVerified !== false,
    imageMetadata: ctx.imageMetadata,
    imageLicense: ctx.imageLicense,
    imageSource: ctx.imageSource,
    imageAttribution: ctx.imageAttribution,
    seoTitle: seo.seoTitle,
    seoDescription: seo.seoDescription,
    canonicalUrl: seo.canonicalUrl,
    schemaOrg: seo.recipeSchema,
    seoBundle: seo.seoBundle,
    metaTags: seo.metaTags,
    agentRunId: ctx.runId,
    reviewStatus: "pending",
    verificationStatus: "pending_review",
    requireVerifiedNutrition: true,
  };
}

function inferDifficulty(ctx) {
  const time = ctx.facts?.typicalCookTimeMin || 30;
  if (time > 60) return "hard";
  if (time > 30) return "medium";
  return "easy";
}

function buildTags(seed, expertise) {
  const tags = [seed.cuisine, seed.mealType, ...(seed.diet || [])];
  if (seed.festival) tags.push(seed.festival);
  if (expertise.typicalSpiceLevel) tags.push(expertise.typicalSpiceLevel);
  return [...new Set(tags.filter(Boolean))];
}

function isBlockingAgent(name, options = {}) {
  const nonBlocking = options.nonBlockingAgents || [];
  if (nonBlocking.includes(name)) return false;
  return ["license_compliance", "duplicate_detection"].includes(name);
}

function recordAgentRun(db, run) {
  db.prepare(`
    INSERT INTO agent_runs (id, recipe_id, run_id, agent_name, status, confidence, duration_ms, output_json, issues_json)
    VALUES (@id, @recipe_id, @run_id, @agent_name, @status, @confidence, @duration_ms, @output_json, @issues_json)
  `).run({
    id: run.id,
    recipe_id: run.recipeId,
    run_id: run.runId,
    agent_name: run.agentName,
    status: run.status,
    confidence: run.confidence,
    duration_ms: run.durationMs,
    output_json: JSON.stringify(run.output),
    issues_json: JSON.stringify(run.issues),
  });
}

export function getAgentRuns(params = {}) {
  const db = getIntelligenceDb();
  ensureEnterpriseSchema(db);
  const { recipeId, runId, limit = 50 } = params;

  let sql = "SELECT * FROM agent_runs WHERE 1=1";
  const sqlParams = [];
  if (recipeId) { sql += " AND recipe_id = ?"; sqlParams.push(recipeId); }
  if (runId) { sql += " AND run_id = ?"; sqlParams.push(runId); }
  sql += " ORDER BY created_at DESC LIMIT ?";
  sqlParams.push(limit);

  return db.prepare(sql).all(...sqlParams).map((row) => ({
    ...row,
    output: row.output_json ? JSON.parse(row.output_json) : null,
    issues: row.issues_json ? JSON.parse(row.issues_json) : [],
  }));
}

export function getAgentRunStats() {
  const db = getIntelligenceDb();
  ensureEnterpriseSchema(db);
  const total = db.prepare("SELECT COUNT(*) as c FROM agent_runs").get()?.c || 0;
  const byAgent = db.prepare(`
    SELECT agent_name, COUNT(*) as runs, AVG(confidence) as avg_confidence
    FROM agent_runs GROUP BY agent_name
  `).all();
  return { total, byAgent, agents: 10 };
}
