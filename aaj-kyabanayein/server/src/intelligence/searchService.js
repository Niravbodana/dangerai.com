/**
 * Recipe Intelligence search — facets, filters, scoring.
 * Designed for sub-200ms on indexed SQLite; scales to PostgreSQL + pg_trgm at 1M+.
 */
import { filterRecipeIndex, RECIPE_INDEX, getRecipeById, toListItem } from "../data/recipes.js";
import { recipeMatchesSearch, scoreRecipeSearch } from "../lib/searchUtils.js";
import { semanticSearch } from "../services/ai/semanticSearch.js";
import { getIntelligenceDb, ensureIntelligenceDb } from "./repository.js";

const searchCache = new Map();
const CACHE_TTL_MS = 60_000;

/**
 * @param {object} params
 */
export function searchRecipes(params = {}) {
  const {
    q = "",
    cuisine = null,
    region = null,
    festival = null,
    mealType = null,
    diet = null,
    difficulty = null,
    maxCookTime = null,
    minCalories = null,
    maxCalories = null,
    minProtein = null,
    mode = "keyword",
    page = 1,
    limit = 24,
  } = params;

  const cacheKey = JSON.stringify({ q, cuisine, region, festival, mealType, diet, difficulty, maxCookTime, minCalories, maxCalories, minProtein, mode, page, limit });
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.result;
  }

  let results;
  if (mode === "semantic" && q) {
    results = semanticSearch(q, { cuisine, mealType, diet });
  } else {
    results = filterRecipeIndex({
      search: q || undefined,
      cuisine: cuisine || undefined,
      mealType: mealType || undefined,
      diet: diet || undefined,
      maxCookTime: maxCookTime ? Number(maxCookTime) : undefined,
    });
  }

  results = applyAdvancedFilters(results, {
    region,
    festival,
    difficulty,
    minCalories,
    maxCalories,
    minProtein,
    q,
    mode,
  });

  const total = results.length;
  const offset = (Math.max(1, page) - 1) * limit;
  const pageItems = results.slice(offset, offset + limit).map((r) => {
    const full = getRecipeById(r.id) || r;
    return {
      ...toListItem(full),
      searchScore: r._searchScore ?? scoreRecipeSearch(q, full),
    };
  });

  const result = {
    items: pageItems,
    total,
    page: Math.max(1, page),
    limit,
    pages: Math.ceil(total / limit) || 1,
    facets: buildFacets(results),
    query: q,
    mode,
  };

  searchCache.set(cacheKey, { ts: Date.now(), result });
  if (searchCache.size > 500) {
    const first = searchCache.keys().next().value;
    searchCache.delete(first);
  }

  return result;
}

function applyAdvancedFilters(results, filters) {
  return results.filter((r) => {
    const recipe = getRecipeById(r.id) || r;
    if (filters.region && recipe.region && recipe.region !== filters.region) return false;
    if (filters.festival && recipe.festival !== filters.festival) return false;
    if (filters.difficulty && recipe.difficulty !== filters.difficulty) return false;
    if (filters.minCalories && (recipe.calories || 0) < filters.minCalories) return false;
    if (filters.maxCalories && (recipe.calories || 9999) > filters.maxCalories) return false;
    if (filters.minProtein) {
      const protein = recipe.nutrition?.proteinG || recipe.proteinG || 0;
      if (protein < filters.minProtein) return false;
    }
    if (filters.q && filters.mode === "ingredient") {
      const blob = (recipe.ingredients || []).map((i) => i.name).join(" ").toLowerCase();
      if (!blob.includes(filters.q.toLowerCase())) return false;
    }
    return true;
  });
}

function buildFacets(results) {
  const facets = {
    cuisine: {},
    mealType: {},
    diet: {},
    difficulty: {},
  };

  for (const r of results) {
    const recipe = getRecipeById(r.id) || r;
    if (recipe.cuisine) facets.cuisine[recipe.cuisine] = (facets.cuisine[recipe.cuisine] || 0) + 1;
    if (recipe.mealType) facets.mealType[recipe.mealType] = (facets.mealType[recipe.mealType] || 0) + 1;
    for (const d of recipe.diet || []) {
      facets.diet[d] = (facets.diet[d] || 0) + 1;
    }
    if (recipe.difficulty) facets.difficulty[recipe.difficulty] = (facets.difficulty[recipe.difficulty] || 0) + 1;
  }

  return facets;
}

export function searchIntelligenceDb(params = {}) {
  ensureIntelligenceDb();
  const db = getIntelligenceDb();
  const { q, cuisine, mealType, reviewStatus = "approved", limit = 50 } = params;

  let sql = "SELECT id, slug, title, cuisine, meal_type, diet, calories, protein_g, review_status, seo_title FROM recipe_intelligence WHERE review_status = ?";
  const sqlParams = [reviewStatus];

  if (cuisine) {
    sql += " AND cuisine = ?";
    sqlParams.push(cuisine);
  }
  if (mealType) {
    sql += " AND meal_type = ?";
    sqlParams.push(mealType);
  }
  if (q) {
    sql += " AND (title LIKE ? OR slug LIKE ?)";
    sqlParams.push(`%${q}%`, `%${q}%`);
  }

  sql += " ORDER BY title LIMIT ?";
  sqlParams.push(limit);

  return db.prepare(sql).all(...sqlParams);
}

export function getSearchIndexStats() {
  return {
    catalogRecipes: RECIPE_INDEX.length,
    intelligenceRecipes: ensureIntelligenceDb()
      ? getIntelligenceDb().prepare("SELECT COUNT(*) as c FROM recipe_intelligence").get()?.c || 0
      : 0,
    cacheSize: searchCache.size,
  };
}
