/**
 * Bug Guardian — full site health scan (backend + config + sample frontend routes).
 */
import { RECIPE_INDEX, getRecipeById } from "../data/recipes.js";
import { validateIngredientSemantics } from "../lib/ingredientProfiles.js";
import { auditCachedImage, hasCachedImage } from "./recipeImageService.js";
import { getRecipeCount } from "../db/recipeRepository.js";
import { getFullConfig, getPartnerList } from "./siteConfigService.js";
import { getRazorpayCredentials } from "./siteConfigService.js";
import { runQualityGuardian } from "./qualityGuardian.js";

let lastBugReport = null;

export function getBugGuardianReport() {
  return lastBugReport;
}

const FRONTEND_ROUTES = [
  "/",
  "/today",
  "/recipes",
  "/pantry",
  "/planner",
  "/pricing",
  "/kitchen",
  "/admin",
  "/collections",
  "/favorites",
];

async function checkUrl(url, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: "HEAD", signal: controller.signal, redirect: "follow" });
    return { ok: res.ok || res.status < 400, status: res.status };
  } catch (err) {
    return { ok: false, error: err.message };
  } finally {
    clearTimeout(timer);
  }
}

export async function runBugGuardian({ fix = false, sampleSize = 100 } = {}) {
  const startedAt = new Date().toISOString();
  const issues = [];
  const fixes = [];

  const config = getFullConfig();
  const creds = getRazorpayCredentials();

  if (!config.payments?.razorpay?.keyId && config.payments?.razorpay?.enabled) {
    issues.push({ type: "config", severity: "high", message: "Razorpay enabled but keyId missing" });
  }
  if (config.payments?.razorpay?.enabled && !creds) {
    issues.push({ type: "config", severity: "high", message: "Razorpay enabled but credentials incomplete" });
  }

  for (const [id, partner] of Object.entries(config.partners || {})) {
    if (!partner.enabled || partner.comingSoon) continue;
    const url = (partner.searchUrlTemplate || "").replace("{query}", "test");
    if (!url.startsWith("http")) {
      issues.push({ type: "partner", severity: "medium", id, message: `Invalid URL template for ${partner.name}` });
      continue;
    }
    const check = await checkUrl(url);
    if (!check.ok) {
      issues.push({ type: "partner", severity: "low", id, message: `${partner.name} link check failed`, detail: check });
    }
  }

  const social = config.social || {};
  for (const [platform, link] of Object.entries(social)) {
    if (!link || !link.startsWith("http")) continue;
    const check = await checkUrl(link);
    if (!check.ok) {
      issues.push({ type: "social", severity: "low", platform, message: `${platform} link unreachable`, detail: check });
    }
  }

  let ingredientBad = 0;
  let photoBad = 0;
  const sample = RECIPE_INDEX.slice(0, sampleSize);
  for (const meta of sample) {
    const r = getRecipeById(meta.id);
    if (!r) continue;
    const sem = validateIngredientSemantics(r);
    if (!sem.ok) ingredientBad++;
    if (!hasCachedImage(meta.id)) photoBad++;
    else {
      const pa = auditCachedImage(r);
      if (!pa.ok) photoBad++;
    }
  }

  if (ingredientBad > 0) {
    issues.push({ type: "recipes", severity: "medium", message: `${ingredientBad}/${sample.length} sampled recipes have ingredient issues` });
  }
  if (photoBad > 0) {
    issues.push({ type: "recipes", severity: "medium", message: `${photoBad}/${sample.length} sampled recipes have photo issues` });
  }

  const dbCount = getRecipeCount();
  if (dbCount < RECIPE_INDEX.length * 0.9) {
    issues.push({ type: "database", severity: "high", message: `DB has ${dbCount} recipes but index has ${RECIPE_INDEX.length}` });
  }

  let guardianResult = null;
  if (fix) {
    guardianResult = await runQualityGuardian({ fix: true });
    fixes.push({
      type: "quality_guardian",
      photosFixed: guardianResult.photosFixed,
      ingredientsFixed: guardianResult.ingredientsFixed,
    });
  }

  const report = {
    startedAt,
    finishedAt: new Date().toISOString(),
    healthy: issues.filter((i) => i.severity === "high").length === 0,
    issueCount: issues.length,
    issues,
    fixes,
    stats: {
      totalRecipes: RECIPE_INDEX.length,
      dbRecipes: dbCount,
      partners: getPartnerList().length,
      frontendRoutes: FRONTEND_ROUTES,
      sampledRecipes: sample.length,
      ingredientIssuesSample: ingredientBad,
      photoIssuesSample: photoBad,
      razorpayConfigured: Boolean(creds),
    },
    guardianResult,
  };

  lastBugReport = report;
  return report;
}
