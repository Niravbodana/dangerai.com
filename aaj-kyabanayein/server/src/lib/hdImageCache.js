/**
 * Download HD image and cache locally for recipe heroes.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, "../../data/image-cache");
const META_DIR = path.join(__dirname, "../../data/image-cache-meta");
const USER_AGENT = "RasoiraMealPlanner/1.0";

function ensureDirs() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.mkdirSync(META_DIR, { recursive: true });
}

/**
 * @returns {{ filePath: string, meta: object } | null}
 */
export async function cacheHdImage(recipeId, imageUrl, meta = {}) {
  if (!recipeId || !imageUrl) return null;
  ensureDirs();
  const dest = path.join(CACHE_DIR, `${recipeId}.jpg`);

  try {
    const res = await fetch(imageUrl, {
      headers: { "User-Agent": USER_AGENT, Accept: "image/*" },
      signal: AbortSignal.timeout(12000),
      redirect: "follow",
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 5000) return null;

    fs.writeFileSync(dest, buf);
    const imageMeta = {
      recipeId,
      source: meta.source || "wikipedia-hd",
      title: meta.title || recipeId,
      originalUrl: imageUrl,
      license: meta.license || "CC-BY-SA",
      fetchedAt: new Date().toISOString(),
      bytes: buf.length,
    };
    fs.writeFileSync(path.join(META_DIR, `${recipeId}.json`), JSON.stringify(imageMeta, null, 2));
    return { filePath: dest, meta: imageMeta };
  } catch {
    return null;
  }
}
