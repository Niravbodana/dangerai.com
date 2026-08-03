import { getDb } from "./connection.js";

function parseJson(val, fallback) {
  try {
    return JSON.parse(val || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

function rowToRecipe(row, ingredients, stepsEn, stepsHi) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    nameHi: row.name_hi,
    mealType: row.meal_type,
    diet: parseJson(row.diet, []),
    cuisine: row.cuisine,
    category: row.category,
    budget: row.budget,
    cookTime: row.cook_time,
    calories: row.calories,
    spice: row.spice,
    healthScore: row.health_score,
    thumbUrl: row.thumb_url || undefined,
    localImage: row.local_image || undefined,
    tags: parseJson(row.tags, []),
    pantryKeys: parseJson(row.pantry_keys, []),
    source: row.source,
    ingredients: ingredients || [],
    steps: stepsEn || [],
    stepsHi: stepsHi || [],
    isCustom: !!row.is_custom,
    ownerUserId: row.owner_user_id || undefined,
  };
}

export function upsertRecipe(recipe) {
  const db = getDb();
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO recipes (
      id, name, name_hi, meal_type, cuisine, category, budget, cook_time, calories,
      spice, health_score, thumb_url, local_image, source, is_custom, owner_user_id,
      tags, diet, pantry_keys, created_at, updated_at
    ) VALUES (
      @id, @name, @name_hi, @meal_type, @cuisine, @category, @budget, @cook_time, @calories,
      @spice, @health_score, @thumb_url, @local_image, @source, @is_custom, @owner_user_id,
      @tags, @diet, @pantry_keys, @created_at, @updated_at
    )
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name, name_hi=excluded.name_hi, meal_type=excluded.meal_type,
      cuisine=excluded.cuisine, category=excluded.category, budget=excluded.budget,
      cook_time=excluded.cook_time, calories=excluded.calories, spice=excluded.spice,
      health_score=excluded.health_score, thumb_url=excluded.thumb_url,
      local_image=excluded.local_image, tags=excluded.tags, diet=excluded.diet,
      pantry_keys=excluded.pantry_keys, updated_at=excluded.updated_at
  `);

  stmt.run({
    id: recipe.id,
    name: recipe.name,
    name_hi: recipe.nameHi || recipe.name,
    meal_type: recipe.mealType || "lunch",
    cuisine: recipe.cuisine || "indian",
    category: recipe.category || null,
    budget: recipe.budget || "medium",
    cook_time: recipe.cookTime || 30,
    calories: recipe.calories || 300,
    spice: recipe.spice || "medium",
    health_score: recipe.healthScore ?? 5,
    thumb_url: recipe.thumbUrl || null,
    local_image: recipe.localImage || null,
    source: recipe.source || "curated",
    is_custom: recipe.isCustom ? 1 : 0,
    owner_user_id: recipe.ownerUserId || null,
    tags: JSON.stringify(recipe.tags || []),
    diet: JSON.stringify(recipe.diet || []),
    pantry_keys: JSON.stringify(recipe.pantryKeys || []),
    created_at: recipe.createdAt || now,
    updated_at: now,
  });

  db.prepare("DELETE FROM recipe_ingredients WHERE recipe_id = ?").run(recipe.id);
  db.prepare("DELETE FROM recipe_steps WHERE recipe_id = ?").run(recipe.id);

  const ingStmt = db.prepare(
    "INSERT INTO recipe_ingredients (recipe_id, sort_order, name, name_hi, quantity) VALUES (?, ?, ?, ?, ?)"
  );
  (recipe.ingredients || []).forEach((ing, i) => {
    ingStmt.run(recipe.id, i, ing.name, ing.nameHi || null, ing.quantity || null);
  });

  const stepStmt = db.prepare(
    "INSERT INTO recipe_steps (recipe_id, lang, sort_order, body) VALUES (?, ?, ?, ?)"
  );
  (recipe.steps || []).forEach((s, i) => stepStmt.run(recipe.id, "en", i, s));
  (recipe.stepsHi || []).forEach((s, i) => stepStmt.run(recipe.id, "hi", i, s));
}

export function getRecipeById(id) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM recipes WHERE id = ?").get(id);
  if (!row) return null;
  const ingredients = db
    .prepare("SELECT name, name_hi as nameHi, quantity FROM recipe_ingredients WHERE recipe_id = ? ORDER BY sort_order")
    .all(id);
  const stepsEn = db
    .prepare("SELECT body FROM recipe_steps WHERE recipe_id = ? AND lang = 'en' ORDER BY sort_order")
    .all(id)
    .map((r) => r.body);
  const stepsHi = db
    .prepare("SELECT body FROM recipe_steps WHERE recipe_id = ? AND lang = 'hi' ORDER BY sort_order")
    .all(id)
    .map((r) => r.body);
  return rowToRecipe(row, ingredients, stepsEn, stepsHi);
}

export function getRecipeIndex() {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, name, name_hi as nameHi, meal_type as mealType, diet, cuisine, category,
              budget, cook_time as cookTime, calories, spice, tags, thumb_url as thumbUrl,
              local_image as localImage, pantry_keys as pantryKeys
       FROM recipes ORDER BY name`
    )
    .all()
    .map((r) => ({
      ...r,
      diet: parseJson(r.diet, []),
      tags: parseJson(r.tags, []),
      pantryKeys: parseJson(r.pantryKeys, []),
      thumbUrl: r.thumbUrl || undefined,
    }));
}

export function getRecipeCount() {
  return getDb().prepare("SELECT COUNT(*) as c FROM recipes").get().c;
}

export function setLocalImage(recipeId, filePath, meta = {}) {
  const db = getDb();
  db.prepare("UPDATE recipes SET local_image = ? WHERE id = ?").run(filePath, recipeId);
  db.prepare(
    `INSERT INTO recipe_images (recipe_id, file_path, source, title, original_url, score, fetched_at)
     VALUES (@recipe_id, @file_path, @source, @title, @original_url, @score, @fetched_at)
     ON CONFLICT(recipe_id) DO UPDATE SET
       file_path=excluded.file_path, source=excluded.source, title=excluded.title,
       original_url=excluded.original_url, score=excluded.score, fetched_at=excluded.fetched_at`
  ).run({
    recipe_id: recipeId,
    file_path: filePath,
    source: meta.source || null,
    title: meta.title || null,
    original_url: meta.originalUrl || null,
    score: meta.score || null,
    fetched_at: meta.fetchedAt || new Date().toISOString(),
  });
}

export function getLocalImagePath(recipeId) {
  const row = getDb().prepare("SELECT local_image FROM recipes WHERE id = ?").get(recipeId);
  return row?.local_image || null;
}
