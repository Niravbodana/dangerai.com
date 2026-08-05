/**
 * One-shot catalog repair on boot:
 * - Canonicalize diet tags (vegetarian → veg, non-vegetarian → non-veg)
 * - Point thumb_url at local premium cache when available
 * - Soft-hide obvious name duplicates (prefer curated over lib-*)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getDb } from "../db/connection.js";
import { canonicalizeDiet, browseCategoryFor, isNonVegDiet, containsMeatWord } from "../lib/dietNormalize.js";
import { logger } from "../lib/logger.js";
import { initRecipeCatalog } from "../data/recipes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, "../../data/image-cache");
const META_DIR = path.join(__dirname, "../../data/image-cache-meta");
const CURATED_JSON_PATH = path.join(__dirname, "../data/curated/recipes.json");

/**
 * Ground-truth diet + cuisine for curated recipes, loaded from the source
 * JSON. A now-fixed regex bug in this repair used to mislabel real veg
 * dishes (e.g. "Khaman Dhokla", "Ada Pradhaman" — "ham"/"egg" substrings)
 * as non-veg, and once written to the DB the old logic never healed it
 * back. These maps let us restore the correct values for curated recipes.
 */
function loadCuratedMaps() {
  const dietMap = new Map();
  const cuisineMap = new Map();
  try {
    const raw = JSON.parse(fs.readFileSync(CURATED_JSON_PATH, "utf8"));
    const list = Array.isArray(raw) ? raw : raw?.recipes || [];
    for (const r of list) {
      if (!r?.id) continue;
      if (Array.isArray(r.diet)) dietMap.set(r.id, r.diet);
      if (r.cuisine) cuisineMap.set(r.id, r.cuisine);
    }
  } catch {
    // best-effort; if missing, self-heal falls back to tag-based inference
  }
  return { dietMap, cuisineMap };
}

/**
 * Ground-truth cuisine for phase3-bulk recipes, loaded from the
 * recipe_intelligence table (the generation source of truth). A previous
 * bug in this file's own SELECT statement (missing the "cuisine" column)
 * caused `row.cuisine` to read as undefined on every boot, which then
 * silently collapsed EVERY recipe's cuisine to the "indian" fallback —
 * wiping out Gujarati/Punjabi/Kerala/etc. This map heals that corruption.
 */
function loadIntelligenceCuisineMap(db) {
  const map = new Map();
  try {
    const rows = db.prepare("SELECT id, cuisine FROM recipe_intelligence WHERE cuisine IS NOT NULL").all();
    for (const r of rows) {
      if (r.id && r.cuisine) map.set(r.id, r.cuisine);
    }
  } catch {
    // recipe_intelligence table may not exist in older DBs; ignore
  }
  return map;
}

function parseJson(val, fallback) {
  try {
    return JSON.parse(val || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

function hasCachedImage(id) {
  return fs.existsSync(path.join(CACHE_DIR, `${id}.jpg`));
}

function cacheMetaSource(id) {
  try {
    const p = path.join(META_DIR, `${id}.json`);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8"))?.source || null;
  } catch {
    return null;
  }
}

function normalizeName(name = "") {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function repairCatalogOnBoot() {
  if (process.env.SKIP_CATALOG_REPAIR === "1") {
    logger.info("Catalog repair skipped (SKIP_CATALOG_REPAIR=1)");
    return { skipped: true };
  }

  const db = getDb();
  const rows = db.prepare("SELECT id, name, diet, tags, category, cuisine, meal_type, thumb_url, local_image, source FROM recipes").all();
  const { dietMap: curatedDietMap, cuisineMap: curatedCuisineMap } = loadCuratedMaps();
  const intelCuisineMap = loadIntelligenceCuisineMap(db);
  const report = {
    total: rows.length,
    dietFixed: 0,
    thumbFixed: 0,
    categoryFixed: 0,
    cuisineFixed: 0,
    duplicatesHidden: 0,
  };

  const update = db.prepare(`
    UPDATE recipes
    SET diet = @diet, category = @category, cuisine = @cuisine,
        thumb_url = @thumb_url, local_image = @local_image, updated_at = @updated_at
    WHERE id = @id
  `);

  const hide = db.prepare(`
    UPDATE recipes SET tags = @tags, updated_at = @updated_at WHERE id = @id
  `);

  const now = new Date().toISOString();
  const byName = new Map();

  const tx = db.transaction(() => {
    for (const row of rows) {
      const dietArr = parseJson(row.diet, []);
      const tagsArr = parseJson(row.tags, []);
      const tagsLower = tagsArr.map((t) => String(t).toLowerCase());
      const meatHint = containsMeatWord(`${row.name} ${tagsArr.join(" ")}`);
      let canon = canonicalizeDiet(dietArr);

      if (meatHint) {
        if (!isNonVegDiet(canon)) {
          canon = canonicalizeDiet([...canon.filter((d) => d !== "veg" && d !== "vegetarian" && d !== "vegan" && d !== "jain"), "non-vegetarian"]);
        }
      } else if (isNonVegDiet(canon)) {
        // Self-heal: no meat word anywhere, but diet says non-veg — this can
        // only be leftover corruption from the old substring-matching bug
        // (or, occasionally, a stale mismatch in the source data itself).
        // An explicit "vegetarian"/"jain"/"vegan" tag is the strongest
        // available signal (it reflects the dish's real ingredients), so it
        // takes priority; the curated source diet is used as a fallback for
        // dishes with no tag evidence either way.
        const curatedDiet = curatedDietMap.get(row.id);
        const tagsSayVeg = tagsLower.some((t) => t === "vegetarian" || t === "jain" || t === "vegan");
        const tagsSayNonVeg = tagsLower.includes("non-vegetarian");
        if (tagsSayVeg && !tagsSayNonVeg) {
          canon = canonicalizeDiet(tagsLower.filter((t) => ["vegetarian", "jain", "vegan", "eggetarian"].includes(t)));
        } else if (curatedDiet) {
          canon = canonicalizeDiet(curatedDiet);
        }
      }
      const dietChanged = JSON.stringify(canon) !== JSON.stringify(dietArr.map((d) => String(d).toLowerCase()));

      let thumb = row.thumb_url || null;
      let localImage = row.local_image || null;
      let thumbChanged = false;

      if (hasCachedImage(row.id)) {
        const localPath = path.join(CACHE_DIR, `${row.id}.jpg`);
        if (!localImage) {
          localImage = localPath;
          thumbChanged = true;
        }
        // Prefer API/local premium over MealDB/dummyjson remotes
        const remoteJunk = !thumb || /themealdb\.com|dummyjson\.com/i.test(thumb);
        const source = cacheMetaSource(row.id);
        if (remoteJunk || source?.startsWith("premium-hero")) {
          const nextThumb = `/api/recipes/image/${row.id}`;
          if (thumb !== nextThumb) {
            thumb = nextThumb;
            thumbChanged = true;
          }
        }
      }

      const mealType = row.meal_type || "lunch";
      const browse = browseCategoryFor({ diet: canon, mealType });
      const known = new Set([
        "veg-breakfast", "nonveg-breakfast", "veg-lunch", "nonveg-lunch",
        "veg-dinner", "nonveg-dinner", "healthy", "snack",
      ]);
      let category = row.category;
      if (!category || !known.has(category) || (isNonVegDiet(canon) !== category.startsWith("nonveg-") && category !== "snack" && category !== "healthy")) {
        // Keep healthy; otherwise align with diet+mealType
        if (category !== "healthy") {
          category = browse;
        }
      }
      const categoryChanged = category !== row.category;

      // Restore the real cuisine (Gujarati/Punjabi/Kerala/etc) when it has
      // collapsed to the generic "indian" fallback — either from a bulk-gen
      // dish that never had one, or from this repair's own past corruption.
      let cuisine = row.cuisine || "indian";
      const NON_CUISINE_WORDS = new Set(["breakfast", "lunch", "dinner", "snack", "hidden-duplicate", "vegetarian", "non-vegetarian", "vegan", "jain", "eggetarian"]);
      if (cuisine === "indian" || !row.cuisine) {
        const restored =
          (row.source === "phase3-bulk" && intelCuisineMap.get(row.id)) ||
          curatedCuisineMap.get(row.id) ||
          (row.source === "phase3-bulk" && tagsLower.length && !NON_CUISINE_WORDS.has(tagsLower[0]) ? tagsLower[0] : null);
        if (restored) cuisine = restored;
      }

      // Fix mislabeled "continental" for clear Indian dishes
      const n = normalizeName(row.name);
      if (cuisine === "continental" && /aloo|paneer|dal|roti|paratha|biryani|dosa|idli|chole|rajma|sabzi|tikki|chaat|gobi|palak|saag|khichdi|poha|upma|sambar|rasam|thali|masala|curry|korma|biryani/.test(n)) {
        cuisine = "indian";
      }
      const cuisineChanged = cuisine !== row.cuisine;

      if (dietChanged || thumbChanged || categoryChanged || cuisineChanged) {
        update.run({
          id: row.id,
          diet: JSON.stringify(canon),
          category,
          cuisine,
          thumb_url: thumb,
          local_image: localImage,
          updated_at: now,
        });
        if (dietChanged) report.dietFixed++;
        if (thumbChanged) report.thumbFixed++;
        if (categoryChanged) report.categoryFixed++;
        if (cuisineChanged) report.cuisineFixed++;
      }

      const key = normalizeName(row.name);
      if (!byName.has(key)) byName.set(key, []);
      byName.get(key).push(row);
    }

    // Soft-hide duplicate names: keep curated/non-lib first, mark others with tag "hidden-duplicate"
    for (const [, group] of byName) {
      if (group.length < 2) continue;
      group.sort((a, b) => {
        const score = (r) => {
          let s = 0;
          if (!String(r.id).startsWith("lib-")) s += 10;
          if (r.source === "curated" || !r.source) s += 5;
          if (r.thumb_url && !/dummyjson|themealdb/i.test(r.thumb_url || "")) s += 2;
          return s;
        };
        return score(b) - score(a);
      });
      for (const dup of group.slice(1)) {
        const tags = parseJson(dup.tags || "[]", []);
        if (tags.includes("hidden-duplicate")) continue;
        tags.push("hidden-duplicate");
        hide.run({ id: dup.id, tags: JSON.stringify(tags), updated_at: now });
        report.duplicatesHidden++;
      }
    }
  });

  tx();

  // Reload in-memory catalog so API sees fixes immediately
  initRecipeCatalog(true);

  logger.info(
    `Catalog repair: diet=${report.dietFixed} thumbs=${report.thumbFixed} category=${report.categoryFixed} cuisine=${report.cuisineFixed} dupesHidden=${report.duplicatesHidden} / ${report.total}`
  );
  return report;
}
