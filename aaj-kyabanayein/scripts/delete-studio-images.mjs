#!/usr/bin/env node
/**
 * Delete every AI/SVG "studio art" recipe photo and try to replace it with
 * a REAL photo (Google Images if configured, else Wikimedia/Wikipedia/
 * Openverse/MealDB). Recipes where no real photo can be found are left
 * without a cached image — the app shows a neutral "Photo…" placeholder
 * for those instead of a fake studio photo, until a future run (e.g. after
 * adding GOOGLE_CSE_API_KEY + GOOGLE_CSE_ID) fills them in.
 *
 * Usage:
 *   npm run delete-studio-images                # delete + try to refetch real
 *   npm run delete-studio-images -- --dry-run    # just count, don't delete
 *   npm run delete-studio-images -- --no-refetch # delete only, no network calls
 *   npm run delete-studio-images -- --concurrency 4
 *   npm run delete-studio-images -- --limit 50   # only process the first N (testing)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.join(__dirname, "..", "server");
const CACHE_DIR = path.join(serverRoot, "data/image-cache");
const META_DIR = path.join(serverRoot, "data/image-cache-meta");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const noRefetch = args.includes("--no-refetch");
const idsArg = args.find((a) => a.startsWith("--ids"));
const explicitIds = idsArg
  ? (idsArg.split("=")[1] || args[args.indexOf(idsArg) + 1]).split(",").map((s) => s.trim()).filter(Boolean)
  : null;
const concArg = args.find((a) => a.startsWith("--concurrency"));
const concurrency = concArg ? parseInt(concArg.split("=")[1] || args[args.indexOf(concArg) + 1], 10) || 4 : 4;
const limitArg = args.find((a) => a.startsWith("--limit"));
const limit = limitArg ? parseInt(limitArg.split("=")[1] || args[args.indexOf(limitArg) + 1], 10) : 0;

const { ensureDatabase } = await import(path.join(serverRoot, "src/db/ensureDatabase.js"));
const { initRecipeCatalog, getRecipeById } = await import(path.join(serverRoot, "src/data/recipes.js"));
const { getDb } = await import(path.join(serverRoot, "src/db/connection.js"));
const { generatePremiumHero } = await import(path.join(serverRoot, "src/premium/heroImageGenerator.js"));
const { forceFixRecipePhoto, invalidateCachedImage, readImageMeta } = await import(
  path.join(serverRoot, "src/services/recipeImageService.js")
);
const { setLocalImage } = await import(path.join(serverRoot, "src/db/recipeRepository.js"));
const { isGoogleSearchConfigured } = await import(path.join(serverRoot, "src/services/googleSearchService.js"));

ensureDatabase();
initRecipeCatalog(true);
const db = getDb();

if (!fs.existsSync(META_DIR) && !explicitIds) {
  console.log("No image-cache-meta directory found — nothing to delete.");
  process.exit(0);
}

const files = fs.existsSync(META_DIR) ? fs.readdirSync(META_DIR).filter((f) => f.endsWith(".json")) : [];
let studioIds = explicitIds || [];
if (!explicitIds) {
  for (const f of files) {
    try {
      const meta = JSON.parse(fs.readFileSync(path.join(META_DIR, f), "utf8"));
      if (meta.source === "premium-hero" || meta.source === "rasoira-ai-original") {
        studioIds.push(f.replace(/\.json$/, ""));
      }
    } catch {
      /* skip unreadable meta */
    }
  }
}

const targets = limit > 0 ? studioIds.slice(0, limit) : studioIds;
console.log(`Found ${studioIds.length} studio-art images out of ${files.length} cached images.${limit > 0 ? ` (processing first ${targets.length})` : ""}`);
console.log(`Google Custom Search configured: ${isGoogleSearchConfigured() ? "YES" : "NO (set GOOGLE_CSE_API_KEY + GOOGLE_CSE_ID for best real-photo coverage)"}`);

if (dryRun) {
  console.log("Dry run — no files deleted, no DB changes made.");
  process.exit(0);
}

const clearRow = db.prepare("UPDATE recipes SET local_image = NULL, thumb_url = NULL, updated_at = ? WHERE id = ?");

let deleted = 0;
let realFound = 0;
let leftPending = 0;
let noRecipe = 0;
let processed = 0;

async function processId(id) {
  const jpg = path.join(CACHE_DIR, `${id}.jpg`);
  const metaFile = path.join(META_DIR, `${id}.json`);
  if (fs.existsSync(jpg)) fs.unlinkSync(jpg);
  if (fs.existsSync(metaFile)) fs.unlinkSync(metaFile);
  deleted++;

  const recipe = getRecipeById(id);
  if (!recipe) {
    clearRow.run(new Date().toISOString(), id);
    noRecipe++;
    processed++;
    return;
  }

  if (noRefetch) {
    clearRow.run(new Date().toISOString(), id);
    leftPending++;
    processed++;
    return;
  }

  try {
    const { meta } = await generatePremiumHero(recipe, { force: true, preferReal: true, allowStudioArt: false });
    setLocalImage(id, jpg, meta);
    db.prepare("UPDATE recipes SET local_image = ?, thumb_url = ?, updated_at = ? WHERE id = ?").run(
      jpg,
      `/api/recipes/image/${id}`,
      new Date().toISOString(),
      id
    );
    realFound++;
  } catch {
    // Second chance via the runtime scraper (MealDB/Wikipedia/Google/Openverse).
    // Reject "similar-fallback" — that just copies a DIFFERENT dish's cached
    // photo, which is not a real photo of THIS recipe and would be misleading.
    // NOTE: forceFixRecipePhoto's own `source` label lies here (it hardcodes
    // "search" for its ensureRecipeImage branch even when THAT function's own
    // internal last-resort also silently copied a similar recipe's photo) —
    // so re-read the actual on-disk meta to see what really got written.
    try {
      const result = await forceFixRecipePhoto(recipe);
      const actualSource = result.ok ? readImageMeta(id)?.source : null;
      if (result.ok && actualSource !== "similar-fallback") {
        db.prepare("UPDATE recipes SET local_image = ?, thumb_url = ?, updated_at = ? WHERE id = ?").run(
          result.file,
          `/api/recipes/image/${id}`,
          new Date().toISOString(),
          id
        );
        realFound++;
      } else {
        invalidateCachedImage(id);
        clearRow.run(new Date().toISOString(), id);
        leftPending++;
      }
    } catch {
      invalidateCachedImage(id);
      clearRow.run(new Date().toISOString(), id);
      leftPending++;
    }
  }
  processed++;
  if (processed % 50 === 0 || processed === targets.length) {
    console.log(`[delete-studio] ${processed}/${targets.length} · real ${realFound} · pending ${leftPending} · no-recipe ${noRecipe}`);
  }
}

async function runPool(items, limit, worker) {
  let i = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      await worker(items[idx]);
    }
  });
  await Promise.all(runners);
}

await runPool(targets, concurrency, processId);

initRecipeCatalog(true);

console.log("\n--- Delete Studio Images Report ---");
console.log(
  JSON.stringify(
    {
      studioImagesFound: studioIds.length,
      processedThisRun: targets.length,
      deleted,
      replacedWithRealPhoto: realFound,
      leftAsPlaceholder: leftPending,
      noLongerARecipe: noRecipe,
      googleConfigured: isGoogleSearchConfigured(),
    },
    null,
    2
  )
);
if (leftPending > 0) {
  console.log(
    `\n${leftPending} recipes have no real photo available yet and will show a "Photo…" placeholder.\n` +
      "Add GOOGLE_CSE_API_KEY + GOOGLE_CSE_ID to server/.env (see server/.env.example) and re-run this\n" +
      "script, or run: npm run premium:upgrade -- --only-studio-art --concurrency 4"
  );
}
