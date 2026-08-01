#!/usr/bin/env node
/** Build sitemap.xml from curated recipe index. Run before client build. */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const site = (process.env.VITE_SITE_URL || "https://rasoira.com").replace(/\/$/, "");
const indexPath = path.join(root, "server/src/data/curated/index.json");
const outPath = path.join(root, "client/public/sitemap.xml");

const staticRoutes = [
  { loc: "/", priority: "1.0", changefreq: "daily" },
  { loc: "/recipes", priority: "0.9", changefreq: "daily" },
  { loc: "/today", priority: "0.8", changefreq: "daily" },
  { loc: "/collections", priority: "0.8", changefreq: "weekly" },
  { loc: "/pantry", priority: "0.7", changefreq: "weekly" },
  { loc: "/pricing", priority: "0.5", changefreq: "monthly" },
];

const collectionIds = [
  "sunday-lunch", "budget-50", "diwali-sweets", "south-comfort",
  "protein-power", "street-chaat", "diabetic-friendly", "15-min",
  "guests-coming", "kids-tiffin", "rainy-comfort",
];

let recipes = [];
if (fs.existsSync(indexPath)) {
  recipes = JSON.parse(fs.readFileSync(indexPath, "utf8"));
}

const urls = [
  ...staticRoutes.map((r) => ({ ...r, loc: `${site}${r.loc}` })),
  ...collectionIds.map((id) => ({
    loc: `${site}/collections/${id}`,
    priority: "0.7",
    changefreq: "weekly",
  })),
  ...recipes.map((r) => ({
    loc: `${site}/recipe/${r.id}`,
    priority: "0.6",
    changefreq: "monthly",
  })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>
`;

fs.writeFileSync(outPath, xml);
console.log(`sitemap.xml: ${urls.length} URLs → ${outPath}`);
