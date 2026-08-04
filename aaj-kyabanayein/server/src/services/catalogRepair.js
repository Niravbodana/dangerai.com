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
import { canonicalizeDiet, browseCategoryFor, isNonVegDiet } from "../lib/dietNormalize.js";
import { logger } from "../lib/logger.js";
import { initRecipeCatalog } from "../data/recipes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, "../../data/image-cache");
const META_DIR = path.join(__dirname, "../../data/image-cache-meta");

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
  const rows = db.prepare("SELECT id, name, diet, category, meal_type, thumb_url, local_image, source FROM recipes").all();
  const report = {
    total: rows.length,
    dietFixed: 0,
    thumbFixed: 0,
    categoryFixed: 0,
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
      const meatHint = /chicken|mutton|fish|shrimp|prawn|pork|beef|lamb|goat|meat|keema|gosht|egg|seafood|bacon|ham|turkey|duck|crab|lobster|callaloo.*fish|saltfish/i.test(
        `${row.name} ${tagsArr.join(" ")}`
      );
      let canon = canonicalizeDiet(dietArr);
      if (meatHint && !isNonVegDiet(canon)) {
        canon = canonicalizeDiet([...canon.filter((d) => d !== "veg" && d !== "vegetarian" && d !== "vegan" && d !== "jain"), "non-vegetarian"]);
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

      // Fix mislabeled "continental" for clear Indian dishes
      let cuisine = row.cuisine || "indian";
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
    `Catalog repair: diet=${report.dietFixed} thumbs=${report.thumbFixed} category=${report.categoryFixed} dupesHidden=${report.duplicatesHidden} / ${report.total}`
  );
  return report;
}
