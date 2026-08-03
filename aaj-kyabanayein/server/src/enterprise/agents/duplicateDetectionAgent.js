/**
 * 10. Duplicate Detection Agent — title, ingredient, instruction similarity.
 */
import { BaseAgent } from "./baseAgent.js";
import { findDuplicate, buildContentHash } from "../../pipeline/services/duplicateDetector.js";
import { getIntelligenceDb } from "../../intelligence/repository.js";
import { ingredientFingerprint } from "../../pipeline/services/ingredientNormalizer.js";

export class DuplicateDetectionAgent extends BaseAgent {
  constructor() {
    super("duplicate_detection");
  }

  async execute(context) {
    const candidate = context.recipe || context;
    const existing = loadExistingRecipes();
    const result = findDuplicate(candidate, existing);

    const titleSim = computeTitleSimilarity(candidate, existing);
    const ingredientSim = computeIngredientSimilarity(candidate, existing);
    const instructionSim = computeInstructionSimilarity(candidate, existing);

    const maxSim = Math.max(titleSim, ingredientSim, instructionSim);
    const duplicateScore = result.duplicate ? 1 : maxSim;
    const confidence = 1 - duplicateScore;

    return {
      success: !result.duplicate && duplicateScore < 0.85,
      confidence,
      data: {
        duplicate: result.duplicate,
        duplicateOf: result.duplicateOf || null,
        duplicateScore,
        similarityScore: maxSim,
        contentHash: result.hash || buildContentHash(candidate),
        signals: { titleSim, ingredientSim, instructionSim },
      },
      issues: result.duplicate ? [`Duplicate of ${result.duplicateOf}: ${result.reason || "content hash match"}`] : [],
    };
  }
}

function loadExistingRecipes() {
  try {
    const db = getIntelligenceDb();
    const rows = db.prepare("SELECT id, payload_json FROM recipe_intelligence").all();
    return rows.map((r) => ({ id: r.id, ...JSON.parse(r.payload_json) }));
  } catch {
    return [];
  }
}

function computeTitleSimilarity(candidate, existing) {
  const ct = normalize(candidate.title || "");
  let max = 0;
  for (const r of existing) {
    const rt = normalize(r.title || "");
    if (!ct || !rt) continue;
    if (ct === rt) return 1;
    const overlap = [...new Set(ct.split(" "))].filter((w) => rt.includes(w)).length;
    max = Math.max(max, overlap / Math.max(ct.split(" ").length, 1));
  }
  return max;
}

function computeIngredientSimilarity(candidate, existing) {
  const cf = ingredientFingerprint(candidate.ingredients || []);
  let max = 0;
  for (const r of existing) {
    const rf = ingredientFingerprint(r.ingredients || []);
    if (cf === rf) return 1;
    if (cf && rf) {
      const ca = new Set(cf.split(","));
      const overlap = [...ca].filter((x) => rf.includes(x)).length;
      max = Math.max(max, overlap / ca.size);
    }
  }
  return max;
}

function computeInstructionSimilarity(candidate, existing) {
  const cs = (candidate.steps || []).join(" ").toLowerCase();
  let max = 0;
  for (const r of existing) {
    const rs = (r.steps || []).join(" ").toLowerCase();
    if (!cs || !rs) continue;
    const cw = new Set(cs.split(/\s+/).filter((w) => w.length > 4));
    const overlap = [...cw].filter((w) => rs.includes(w)).length;
    max = Math.max(max, overlap / Math.max(cw.size, 1));
  }
  return max;
}

function normalize(s) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
}
