import crypto from "crypto";
import { getDb } from "../db/connection.js";
import { getRecipeById } from "../data/recipes.js";
import { generateDailyBrief } from "./dailyBriefService.js";

function id() {
  return crypto.randomBytes(8).toString("hex");
}

export function listHelpers(userId) {
  return getDb()
    .prepare("SELECT * FROM kitchen_helpers WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId);
}

export function createHelper(userId, { name, language = "hi", phone = "" }) {
  const helperId = `helper-${id()}`;
  const now = new Date().toISOString();
  getDb()
    .prepare(
      "INSERT INTO kitchen_helpers (id, user_id, name, language, phone, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .run(helperId, userId, name.trim(), language, phone || null, now);
  return getHelper(helperId, userId);
}

export function getHelper(helperId, userId) {
  return getDb()
    .prepare("SELECT * FROM kitchen_helpers WHERE id = ? AND user_id = ?")
    .get(helperId, userId);
}

export function deleteHelper(helperId, userId) {
  getDb().prepare("DELETE FROM helper_tokens WHERE helper_id = ? AND user_id = ?").run(helperId, userId);
  return getDb().prepare("DELETE FROM kitchen_helpers WHERE id = ? AND user_id = ?").run(helperId, userId);
}

export function createHelperToken(userId, helperId, { daysValid = 90 } = {}) {
  const helper = getHelper(helperId, userId);
  if (!helper) return null;
  const token = crypto.randomBytes(24).toString("hex");
  const now = new Date();
  const expires = new Date(now);
  expires.setDate(expires.getDate() + daysValid);
  getDb()
    .prepare(
      "INSERT INTO helper_tokens (token, helper_id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?)"
    )
    .run(token, helperId, userId, expires.toISOString(), now.toISOString());
  return { token, expiresAt: expires.toISOString(), helper };
}

export function resolveHelperToken(token) {
  const row = getDb().prepare("SELECT * FROM helper_tokens WHERE token = ?").get(token);
  if (!row) return null;
  if (row.expires_at && new Date(row.expires_at) < new Date()) return null;
  const helper = getDb().prepare("SELECT * FROM kitchen_helpers WHERE id = ?").get(row.helper_id);
  return { ...row, helper };
}

function formatIngredients(recipe, lang = "hi") {
  return (recipe.ingredients || []).map((ing, i) => {
    const name = lang === "hi" ? ing.nameHi || ing.name : ing.name;
    const qty = ing.quantity ? ` — ${ing.quantity}` : "";
    return `${i + 1}. ${name}${qty}`;
  });
}

function formatSteps(recipe, lang = "hi") {
  const steps = lang === "hi" ? recipe.stepsHi || recipe.steps : recipe.steps || recipe.stepsHi;
  return (steps || []).map((s, i) => `${i + 1}. ${s}`);
}

export function buildDailyInstructions({ planMeals = [], profile = {}, language = "hi" } = {}) {
  const brief = generateDailyBrief(profile);
  const meals = [];

  if (planMeals.length) {
    for (const m of planMeals) {
      const recipe = m.recipe || getRecipeById(m.recipeId);
      if (!recipe) continue;
      meals.push({
        mealType: m.mealType,
        name: recipe.name,
        nameHi: recipe.nameHi,
        cookTime: recipe.cookTime,
        ingredients: formatIngredients(recipe, language),
        steps: formatSteps(recipe, language),
      });
    }
  } else if (brief?.meals) {
    for (const [mealType, entry] of Object.entries(brief.meals)) {
      const recipe = entry?.recipe || getRecipeById(entry?.id);
      if (!recipe) continue;
      meals.push({
        mealType,
        name: recipe.name,
        nameHi: recipe.nameHi,
        cookTime: recipe.cookTime,
        ingredients: formatIngredients(recipe, language),
        steps: formatSteps(recipe, language),
      });
    }
  }

  const date = new Date().toISOString().split("T")[0];
  const introHi =
    language === "hi"
      ? `Aaj ${date} ke liye kitchen instructions. Kripya step-by-step follow karein.`
      : `Kitchen instructions for ${date}. Please follow step by step.`;

  return {
    date,
    language,
    intro: introHi,
    meals,
    notes: profile.notes || [],
    generatedAt: new Date().toISOString(),
  };
}

export function getHelperViewPayload(token, { planMeals, profile } = {}) {
  const resolved = resolveHelperToken(token);
  if (!resolved) return null;
  const lang = resolved.helper?.language || "hi";
  return {
    helperName: resolved.helper?.name,
    householdUserId: resolved.user_id,
    instructions: buildDailyInstructions({ planMeals, profile, language: lang }),
  };
}
