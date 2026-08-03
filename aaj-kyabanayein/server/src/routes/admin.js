import { Router } from "express";
import { optionalAuth } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/adminAuth.js";
import { validateAdminLogin, signAdminToken } from "../services/adminSessionService.js";
import { getGuardianReport, runQualityGuardian } from "../services/qualityGuardian.js";
import { getBugGuardianReport, runBugGuardian } from "../services/bugGuardian.js";
import { getAdminConfig, updateAdminConfig, getPublicConfig } from "../services/siteConfigService.js";
import { RECIPE_INDEX, getRecipeById, enrichRecipe } from "../data/recipes.js";
import { upsertRecipe, getRecipeCount } from "../db/recipeRepository.js";
import { validateIngredientSemantics } from "../lib/ingredientProfiles.js";
import { auditCachedImage, hasCachedImage } from "../services/recipeImageService.js";

const router = Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};
  const ok = await validateAdminLogin(username, password);
  if (!ok) {
    return res.status(401).json({ success: false, message: "Galat username ya password" });
  }
  const token = signAdminToken(username.trim());
  res.json({ success: true, token, message: "Admin login successful" });
});

router.use(optionalAuth);
router.use(adminMiddleware);

router.get("/dashboard", (_req, res) => {
  const ingredientBad = [];
  const photoBad = [];

  for (const meta of RECIPE_INDEX.slice(0, 500)) {
    const r = getRecipeById(meta.id);
    if (!r) continue;
    const sem = validateIngredientSemantics(r);
    if (!sem.ok) ingredientBad.push({ id: meta.id, name: meta.name, issues: sem.issues });
    if (hasCachedImage(meta.id)) {
      const pa = auditCachedImage(r);
      if (!pa.ok) photoBad.push({ id: meta.id, name: meta.name, issue: pa.issue });
    } else {
      photoBad.push({ id: meta.id, name: meta.name, issue: "missing" });
    }
  }

  res.json({
    success: true,
    totalRecipes: RECIPE_INDEX.length,
    dbRecipes: getRecipeCount(),
    ingredientIssues: ingredientBad.length,
    photoIssues: photoBad.length,
    sampleIngredientBad: ingredientBad.slice(0, 15),
    samplePhotoBad: photoBad.slice(0, 15),
    lastGuardian: getGuardianReport(),
  });
});

router.post("/guardian/run", async (req, res) => {
  const report = await runQualityGuardian({ fix: req.body?.fix !== false });
  res.json({ success: true, report });
});

router.get("/recipes/issues", (req, res) => {
  const type = req.query.type || "all";
  const list = [];

  for (const meta of RECIPE_INDEX) {
    const r = getRecipeById(meta.id);
    if (!r) continue;
    const sem = validateIngredientSemantics(r);
    const photo = hasCachedImage(meta.id) ? auditCachedImage(r) : { ok: false, issue: "missing" };

    if (type === "ingredients" && sem.ok) continue;
    if (type === "photos" && photo.ok) continue;
    if (type === "all" && sem.ok && photo.ok) continue;

    list.push({
      id: meta.id,
      name: r.name,
      profile: sem.profile,
      ingredientOk: sem.ok,
      ingredientIssues: sem.issues,
      photoOk: photo.ok,
      photoIssue: photo.issue,
    });
  }

  res.json({ success: true, count: list.length, recipes: list.slice(0, 100) });
});

router.post("/recipes/:id/fix", async (req, res) => {
  const raw = getRecipeById(req.params.id);
  if (!raw) return res.status(404).json({ success: false, message: "Recipe not found" });

  const enriched = enrichRecipe(raw);
  upsertRecipe(enriched);

  const { invalidateCachedImage, ensureRecipeImage } = await import("../services/recipeImageService.js");
  const { setLocalImage } = await import("../db/recipeRepository.js");

  let photoFixed = false;
  try {
    invalidateCachedImage(req.params.id);
    const file = await ensureRecipeImage(enriched, { force: true });
    setLocalImage(req.params.id, file, { source: "admin-fix" });
    photoFixed = true;
  } catch {
    photoFixed = false;
  }

  res.json({
    success: true,
    recipe: enriched,
    photoFixed,
    semantic: validateIngredientSemantics(enriched),
  });
});

router.patch("/recipes/:id", (req, res) => {
  const raw = getRecipeById(req.params.id);
  if (!raw) return res.status(404).json({ success: false, message: "Recipe not found" });

  const updated = enrichRecipe({
    ...raw,
    ...req.body,
    id: req.params.id,
  });
  upsertRecipe(updated);
  res.json({ success: true, recipe: updated });
});

// ——— Site config (partners, social, payments) ———
router.get("/config", (_req, res) => {
  res.json({ success: true, config: getAdminConfig(), publicPreview: getPublicConfig() });
});

router.put("/config", (req, res) => {
  const config = updateAdminConfig(req.body || {});
  res.json({ success: true, config: getAdminConfig(), message: "Config saved" });
});

router.patch("/config/partners/:id", (req, res) => {
  const id = req.params.id;
  const current = getAdminConfig();
  const partners = { ...current.partners, [id]: { ...current.partners?.[id], id, ...req.body } };
  updateAdminConfig({ partners });
  res.json({ success: true, partner: partners[id] });
});

// ——— Bug Guardian (full site scan + auto-fix) ———
router.get("/bug-guardian/report", (_req, res) => {
  res.json({ success: true, report: getBugGuardianReport() });
});

router.post("/bug-guardian/run", async (req, res) => {
  const report = await runBugGuardian({ fix: req.body?.fix !== false });
  res.json({ success: true, report });
});

export default router;
