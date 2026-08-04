/**
 * Master ingredient database — normalize, lookup, search.
 */
import { getIntelligenceDb } from "../../intelligence/repository.js";
import { ensureEnterpriseSchema } from "../schema.js";
import { INGREDIENT_SEED } from "./seedData.js";

export function ensureIngredientDatabase() {
  const db = getIntelligenceDb();
  ensureEnterpriseSchema(db);
  return db;
}

export function seedIngredientDatabase() {
  const db = ensureIngredientDatabase();
  const insert = db.prepare(`
    INSERT OR REPLACE INTO ingredients_master (
      id, english_name, hindi_name, gujarati_name, scientific_name, category,
      nutrition_json, shelf_life, storage, season, substitutes_json,
      common_uses_json, allergens_json, aliases_json, updated_at
    ) VALUES (
      @id, @english_name, @hindi_name, @gujarati_name, @scientific_name, @category,
      @nutrition_json, @shelf_life, @storage, @season, @substitutes_json,
      @common_uses_json, @allergens_json, @aliases_json, datetime('now')
    )
  `);

  let seeded = 0;
  for (const ing of INGREDIENT_SEED) {
    insert.run({
      id: ing.id,
      english_name: ing.englishName,
      hindi_name: ing.hindiName || null,
      gujarati_name: ing.gujaratiName || null,
      scientific_name: ing.scientificName || null,
      category: ing.category,
      nutrition_json: JSON.stringify(ing.nutrition || {}),
      shelf_life: ing.shelfLife || null,
      storage: ing.storage || null,
      season: ing.season || null,
      substitutes_json: JSON.stringify(ing.substitutes || []),
      common_uses_json: JSON.stringify(ing.commonUses || []),
      allergens_json: JSON.stringify(ing.allergens || []),
      aliases_json: JSON.stringify(ing.aliases || []),
    });
    seeded++;
  }
  return seeded;
}

export function lookupIngredient(name = "") {
  const db = ensureIngredientDatabase();
  const key = name.trim().toLowerCase();
  const rows = db.prepare("SELECT * FROM ingredients_master").all();
  for (const row of rows) {
    const aliases = JSON.parse(row.aliases_json || "[]").map((a) => a.toLowerCase());
    const names = [row.english_name, row.hindi_name, row.gujarati_name, ...aliases]
      .filter(Boolean)
      .map((n) => n.toLowerCase());
    if (names.some((n) => n === key || key.includes(n) || n.includes(key))) {
      return parseIngredientRow(row);
    }
  }
  return null;
}

export function enrichIngredients(ingredients = []) {
  return ingredients.map((ing) => {
    const match = lookupIngredient(ing.name || "");
    if (!match) {
      return {
        ...ing,
        normalized: false,
        allergens: ing.allergens || [],
      };
    }
    return {
      ...ing,
      name: match.englishName,
      nameHi: match.hindiName || ing.nameHi,
      nameGu: match.gujaratiName,
      scientificName: match.scientificName,
      category: match.category,
      shelfLife: match.shelfLife,
      storage: match.storage,
      season: match.season,
      substitutes: match.substitutes,
      allergens: match.allergens,
      normalized: true,
      ingredientId: match.id,
    };
  });
}

export function searchIngredients(params = {}) {
  const db = ensureIngredientDatabase();
  const { q, category, limit = 50, offset = 0 } = params;
  let sql = "SELECT * FROM ingredients_master WHERE 1=1";
  const sqlParams = [];

  if (q) {
    sql += " AND (english_name LIKE ? OR hindi_name LIKE ? OR gujarati_name LIKE ? OR aliases_json LIKE ?)";
    const like = `%${q}%`;
    sqlParams.push(like, like, like, like);
  }
  if (category) {
    sql += " AND category = ?";
    sqlParams.push(category);
  }
  sql += " ORDER BY english_name LIMIT ? OFFSET ?";
  sqlParams.push(limit, offset);

  const rows = db.prepare(sql).all(...sqlParams);
  const total = db.prepare(
    `SELECT COUNT(*) as c FROM ingredients_master WHERE 1=1${q ? " AND (english_name LIKE ? OR hindi_name LIKE ? OR gujarati_name LIKE ?)" : ""}${category ? " AND category = ?" : ""}`
  ).get(...(q ? [`%${q}%`, `%${q}%`, `%${q}%`] : []), ...(category ? [category] : []))?.c || 0;

  return { items: rows.map(parseIngredientRow), total };
}

export function getIngredientStats() {
  const db = ensureIngredientDatabase();
  const total = db.prepare("SELECT COUNT(*) as c FROM ingredients_master").get()?.c || 0;
  const categories = db.prepare(`
    SELECT category, COUNT(*) as count FROM ingredients_master GROUP BY category ORDER BY count DESC
  `).all();
  return { total, categories, target: 1_000_000 };
}

function parseIngredientRow(row) {
  return {
    id: row.id,
    englishName: row.english_name,
    hindiName: row.hindi_name,
    gujaratiName: row.gujarati_name,
    scientificName: row.scientific_name,
    category: row.category,
    nutrition: JSON.parse(row.nutrition_json || "{}"),
    shelfLife: row.shelf_life,
    storage: row.storage,
    season: row.season,
    substitutes: JSON.parse(row.substitutes_json || "[]"),
    commonUses: JSON.parse(row.common_uses_json || "[]"),
    allergens: JSON.parse(row.allergens_json || "[]"),
    aliases: JSON.parse(row.aliases_json || "[]"),
  };
}
