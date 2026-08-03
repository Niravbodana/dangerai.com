import { Router } from "express";
import { optionalAuth } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/adminAuth.js";
import { getGuardianReport, runQualityGuardian } from "../services/qualityGuardian.js";
import { RECIPE_INDEX, getRecipeById, enrichRecipe } from "../data/recipes.js";
import { upsertRecipe, getRecipeCount } from "../db/recipeRepository.js";
import { validateIngredientSemantics } from "../lib/ingredientProfiles.js";
import { auditCachedImage, hasCachedImage } from "../services/recipeImageService.js";

const router = Router();

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

export default router;
