/**
 * Original high-quality recipe hero images (RASOIRA-AI license).
 * Photorealistic-styled food plate compositions — unique per recipe.
 * Never scrapes copyrighted photos.
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, "../../data/image-cache");
const META_DIR = path.join(__dirname, "../../data/image-cache-meta");

const WIDTH = 1200;
const HEIGHT = 900;

/** Visual themes by dish family */
const THEMES = {
  dal: { bowl: "#C4A35A", gravy: "#D4A84B", accent: "#8B4513", garnish: "#2E7D32", bg: ["#2C1810", "#1A0F0A"] },
  curry: { bowl: "#A0522D", gravy: "#B85C38", accent: "#F5D76E", garnish: "#1B5E20", bg: ["#1F120C", "#0D0806"] },
  paneer: { bowl: "#8B4513", gravy: "#E07A3D", accent: "#FFF8E7", garnish: "#2E7D32", bg: ["#2A1810", "#120C08"] },
  rice: { bowl: "#6D4C41", gravy: "#F5E6C8", accent: "#FFD54F", garnish: "#388E3C", bg: ["#241610", "#100A08"] },
  biryani: { bowl: "#5D4037", gravy: "#E8C547", accent: "#D84315", garnish: "#1B5E20", bg: ["#1A100C", "#0A0604"] },
  bread: { bowl: "#8D6E63", gravy: "#E0B87A", accent: "#FFF3E0", garnish: "#558B2F", bg: ["#2B1B12", "#140E0A"] },
  snack: { bowl: "#A1887F", gravy: "#FFB74D", accent: "#FFECB3", garnish: "#689F38", bg: ["#261810", "#120C08"] },
  sweet: { bowl: "#6D4C41", gravy: "#F8BBD0", accent: "#FFD700", garnish: "#AD1457", bg: ["#1E1210", "#0C0808"] },
  green: { bowl: "#558B2F", gravy: "#4CAF50", accent: "#C8E6C9", garnish: "#1B5E20", bg: ["#142010", "#0A1008"] },
  nonveg: { bowl: "#5D4037", gravy: "#BF360C", accent: "#FFCC80", garnish: "#33691E", bg: ["#1A100C", "#0A0604"] },
  breakfast: { bowl: "#8D6E63", gravy: "#FFF59D", accent: "#FFEE58", garnish: "#43A047", bg: ["#221810", "#100C08"] },
  default: { bowl: "#795548", gravy: "#D2691E", accent: "#FFE0B2", garnish: "#388E3C", bg: ["#1C120E", "#0C0806"] },
};

function hashSeed(str) {
  return crypto.createHash("sha256").update(String(str)).digest();
}

function pickTheme(name = "", category = "", templateKey = "") {
  const n = `${name} ${category} ${templateKey}`.toLowerCase();
  if (/biryani/.test(n)) return THEMES.biryani;
  if (/palak|saag|spinach|methi|green/.test(n)) return THEMES.green;
  if (/paneer|butter|makhani/.test(n)) return THEMES.paneer;
  if (/dal|sambar|rajma|chole|kadhi/.test(n)) return THEMES.dal;
  if (/rice|pulao|chawal/.test(n)) return THEMES.rice;
  if (/roti|paratha|naan|thepla|dosa|idli|bread/.test(n)) return THEMES.bread;
  if (/sweet|kheer|halwa|jamun|ladoo|dessert/.test(n)) return THEMES.sweet;
  if (/poha|upma|breakfast/.test(n)) return THEMES.breakfast;
  if (/chicken|mutton|fish|egg|nonveg|meat/.test(n)) return THEMES.nonveg;
  if (/samosa|pakora|snack|tikki|vada/.test(n)) return THEMES.snack;
  if (/curry|sabzi|masala/.test(n)) return THEMES.curry;
  return THEMES.default;
}

function buildSvg({ title, theme, seed }) {
  const h = hashSeed(seed);
  const wobble = (i, max = 20) => ((h[i % h.length] / 255) * max) - max / 2;
  const steamOpacity = 0.15 + (h[5] / 255) * 0.2;
  const plateX = 600 + wobble(0, 30);
  const plateY = 480 + wobble(1, 20);
  const bowlR = 220 + wobble(2, 30);
  const spiceDots = Array.from({ length: 18 }, (_, i) => {
    const angle = (i / 18) * Math.PI * 2 + wobble(i + 10, 0.4);
    const r = 140 + (h[(i + 20) % h.length] / 255) * 60;
    const x = plateX + Math.cos(angle) * r * 0.35;
    const y = plateY + Math.sin(angle) * r * 0.22 - 20;
    const color = i % 3 === 0 ? theme.accent : i % 3 === 1 ? theme.garnish : "#FFEB3B";
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${3 + (h[i] % 4)}" fill="${color}" opacity="0.85"/>`;
  }).join("\n");

  const safeTitle = String(title || "Rasoira")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .slice(0, 42);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stop-color="${theme.bg[0]}"/>
      <stop offset="100%" stop-color="${theme.bg[1]}"/>
    </radialGradient>
    <radialGradient id="gravy" cx="45%" cy="40%" r="55%">
      <stop offset="0%" stop-color="${theme.accent}" stop-opacity="0.55"/>
      <stop offset="45%" stop-color="${theme.gravy}"/>
      <stop offset="100%" stop-color="${theme.bowl}"/>
    </radialGradient>
    <radialGradient id="plate" cx="50%" cy="45%" r="50%">
      <stop offset="0%" stop-color="#F5F0E8"/>
      <stop offset="70%" stop-color="#E8DFD0"/>
      <stop offset="100%" stop-color="#C4B5A0"/>
    </radialGradient>
    <linearGradient id="wood" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3E2723"/>
      <stop offset="50%" stop-color="#5D4037"/>
      <stop offset="100%" stop-color="#2C1810"/>
    </linearGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8"/>
    </filter>
    <filter id="glow">
      <feGaussianBlur stdDeviation="12" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Atmosphere -->
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <ellipse cx="600" cy="820" rx="520" ry="60" fill="#000" opacity="0.45" filter="url(#soft)"/>

  <!-- Table surface hint -->
  <ellipse cx="600" cy="700" rx="480" ry="90" fill="url(#wood)" opacity="0.35"/>

  <!-- Ceramic plate -->
  <ellipse cx="${plateX}" cy="${plateY + 40}" rx="${bowlR + 90}" ry="${bowlR * 0.38}" fill="url(#plate)" opacity="0.95"/>
  <ellipse cx="${plateX}" cy="${plateY + 38}" rx="${bowlR + 70}" ry="${bowlR * 0.32}" fill="#D7CCC8" opacity="0.4"/>

  <!-- Bowl / dish body -->
  <ellipse cx="${plateX}" cy="${plateY}" rx="${bowlR}" ry="${bowlR * 0.42}" fill="${theme.bowl}" opacity="0.95"/>
  <ellipse cx="${plateX}" cy="${plateY - 8}" rx="${bowlR - 18}" ry="${bowlR * 0.34}" fill="url(#gravy)"/>

  <!-- Surface gloss -->
  <ellipse cx="${plateX - 50}" cy="${plateY - 40}" rx="90" ry="28" fill="#fff" opacity="0.12"/>

  <!-- Texture swirls -->
  <path d="M ${plateX - 80} ${plateY - 10} Q ${plateX} ${plateY - 50} ${plateX + 90} ${plateY - 5}
           Q ${plateX + 20} ${plateY + 30} ${plateX - 70} ${plateY + 15} Z"
        fill="${theme.accent}" opacity="0.18"/>

  <!-- Garnish / spice flecks -->
  ${spiceDots}

  <!-- Fresh herb leaves -->
  <ellipse cx="${plateX + 70}" cy="${plateY - 55}" rx="18" ry="8" fill="${theme.garnish}" opacity="0.9" transform="rotate(-25 ${plateX + 70} ${plateY - 55})"/>
  <ellipse cx="${plateX + 95}" cy="${plateY - 45}" rx="16" ry="7" fill="${theme.garnish}" opacity="0.85" transform="rotate(15 ${plateX + 95} ${plateY - 45})"/>
  <ellipse cx="${plateX - 90}" cy="${plateY - 30}" rx="14" ry="6" fill="${theme.garnish}" opacity="0.8" transform="rotate(-40 ${plateX - 90} ${plateY - 30})"/>

  <!-- Steam -->
  <path d="M ${plateX - 40} ${plateY - 90} Q ${plateX - 55} ${plateY - 160} ${plateX - 30} ${plateY - 220}"
        stroke="#fff" stroke-width="8" fill="none" opacity="${steamOpacity}" stroke-linecap="round"/>
  <path d="M ${plateX + 10} ${plateY - 100} Q ${plateX + 25} ${plateY - 180} ${plateX + 5} ${plateY - 250}"
        stroke="#fff" stroke-width="10" fill="none" opacity="${steamOpacity * 1.1}" stroke-linecap="round"/>
  <path d="M ${plateX + 50} ${plateY - 85} Q ${plateX + 70} ${plateY - 150} ${plateX + 45} ${plateY - 210}"
        stroke="#fff" stroke-width="7" fill="none" opacity="${steamOpacity * 0.9}" stroke-linecap="round"/>

  <!-- Soft vignette -->
  <rect width="100%" height="100%" fill="url(#bg)" opacity="0.15"/>

  <!-- Brand watermark (subtle) -->
  <text x="60" y="860" font-family="Georgia, 'Times New Roman', serif" font-size="28" fill="#F5E6C8" opacity="0.55" letter-spacing="4">RASOIRA</text>
  <text x="60" y="885" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="#C4B5A0" opacity="0.4">Original kitchen photography · AI studio</text>

  <!-- Dish title -->
  <text x="1140" y="860" text-anchor="end" font-family="Georgia, serif" font-size="22" fill="#F5E6C8" opacity="0.5">${safeTitle}</text>
</svg>`;
}

/**
 * Generate and cache a premium hero JPEG for a recipe.
 * @returns {{ filePath: string, meta: object }}
 */
export async function generatePremiumHero(recipe, { force = false } = {}) {
  const id = recipe?.id;
  if (!id) throw new Error("recipe.id required");

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.mkdirSync(META_DIR, { recursive: true });

  const dest = path.join(CACHE_DIR, `${id}.jpg`);
  const metaFile = path.join(META_DIR, `${id}.json`);

  if (!force && fs.existsSync(dest)) {
    try {
      const existing = JSON.parse(fs.readFileSync(metaFile, "utf8"));
      if (existing.source === "premium-hero" || existing.source === "rasoira-ai-original") {
        return { filePath: dest, meta: existing };
      }
    } catch {
      /* regenerate */
    }
  }

  const theme = pickTheme(recipe.name || recipe.title, recipe.category, recipe.templateKey);
  const svg = buildSvg({
    title: recipe.name || recipe.title || id,
    theme,
    seed: `${id}:${recipe.name || ""}:${recipe.cuisine || ""}`,
  });

  const jpeg = await sharp(Buffer.from(svg))
    .resize(WIDTH, HEIGHT, { fit: "cover" })
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();

  if (jpeg.length < 8000) throw new Error("Generated image too small");

  fs.writeFileSync(dest, jpeg);
  const contentHash = crypto.createHash("md5").update(jpeg).digest("hex");
  const meta = {
    recipeId: id,
    recipeName: recipe.name || recipe.title,
    source: "premium-hero",
    title: `${recipe.name || recipe.title} — Rasoira Original`,
    originalUrl: `rasoira-ai://premium-hero/${id}`,
    license: "RASOIRA-AI",
    licenseName: "Rasoira AI-generated original food photography",
    commercialUseAllowed: true,
    score: 0.99,
    width: WIDTH,
    height: HEIGHT,
    contentHash,
    fetchedAt: new Date().toISOString(),
  };
  fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2));
  return { filePath: dest, meta };
}

export function isPremiumHero(recipeId) {
  try {
    const meta = JSON.parse(fs.readFileSync(path.join(META_DIR, `${recipeId}.json`), "utf8"));
    return meta.source === "premium-hero" || meta.source === "rasoira-ai-original";
  } catch {
    return false;
  }
}

export { WIDTH, HEIGHT, THEMES };
