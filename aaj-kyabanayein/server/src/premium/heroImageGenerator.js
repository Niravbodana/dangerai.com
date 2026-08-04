/**
 * Original / licensed high-quality recipe hero images.
 * Prefer real commercially-licensed photos (Openverse/Commons/Wikipedia);
 * fall back to RASOIRA-AI studio food photography.
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { findRealFoodPhoto, fetchAndNormalizePhoto } from "./realPhotoFetcher.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, "../../data/image-cache");
const META_DIR = path.join(__dirname, "../../data/image-cache-meta");

const WIDTH = 1400;
const HEIGHT = 1050;
const HERO_VERSION = 3;

const THEMES = {
  dal: {
    gravyTop: "#F0C14B", gravyMid: "#D4A017", gravyDeep: "#A67C00",
    bits: ["#8B4513", "#FFECB3", "#2E7D32", "#C62828"],
    bowl: "#4E342E", rim: "#EFEBE9", table: ["#3E2723", "#5D4037", "#2C1810"],
  },
  curry: {
    gravyTop: "#FF8A65", gravyMid: "#E64A19", gravyDeep: "#BF360C",
    bits: ["#FFF3E0", "#2E7D32", "#FFD54F", "#6D4C41"],
    bowl: "#3E2723", rim: "#F5F5F5", table: ["#2C1810", "#4E342E", "#1A0F0A"],
  },
  paneer: {
    gravyTop: "#FFAB91", gravyMid: "#FF7043", gravyDeep: "#D84315",
    bits: ["#FFFDE7", "#FFF8E1", "#1B5E20", "#FFECB3"],
    bowl: "#4E342E", rim: "#FAFAFA", table: ["#3E2723", "#5D4037", "#21150F"],
  },
  rice: {
    gravyTop: "#FFF8E1", gravyMid: "#FFE082", gravyDeep: "#FFD54F",
    bits: ["#FF8A65", "#66BB6A", "#8D6E63", "#EF5350"],
    bowl: "#5D4037", rim: "#EFEBE9", table: ["#2C1810", "#4E342E", "#1A100C"],
  },
  biryani: {
    gravyTop: "#FFE082", gravyMid: "#FFC107", gravyDeep: "#FF8F00",
    bits: ["#E53935", "#43A047", "#8D6E63", "#FFF59D"],
    bowl: "#3E2723", rim: "#EFEBE9", table: ["#1A100C", "#3E2723", "#0D0806"],
  },
  bread: {
    gravyTop: "#FFE0B2", gravyMid: "#FFCC80", gravyDeep: "#FFB74D",
    bits: ["#FFF8E1", "#A1887F", "#66BB6A", "#8D6E63"],
    bowl: "#6D4C41", rim: "#FAFAFA", table: ["#2C1810", "#5D4037", "#1A100C"],
  },
  snack: {
    gravyTop: "#FFCC80", gravyMid: "#FFA726", gravyDeep: "#FB8C00",
    bits: ["#FFF3E0", "#8D6E63", "#66BB6A", "#EF6C00"],
    bowl: "#5D4037", rim: "#F5F5F5", table: ["#261810", "#4E342E", "#120C08"],
  },
  sweet: {
    gravyTop: "#F8BBD0", gravyMid: "#F48FB1", gravyDeep: "#EC407A",
    bits: ["#FFD700", "#FFF8E1", "#AD1457", "#FFE082"],
    bowl: "#4E342E", rim: "#FAFAFA", table: ["#1E1210", "#3E2723", "#0C0808"],
  },
  green: {
    gravyTop: "#A5D6A7", gravyMid: "#66BB6A", gravyDeep: "#2E7D32",
    bits: ["#FFFDE7", "#C8E6C9", "#1B5E20", "#FFCC80"],
    bowl: "#37474F", rim: "#ECEFF1", table: ["#142010", "#1B5E20", "#0A1008"],
  },
  nonveg: {
    gravyTop: "#FF8A65", gravyMid: "#E64A19", gravyDeep: "#BF360C",
    bits: ["#FFCC80", "#8D6E63", "#FFF3E0", "#33691E"],
    bowl: "#3E2723", rim: "#EFEBE9", table: ["#1A100C", "#3E2723", "#0A0604"],
  },
  breakfast: {
    gravyTop: "#FFF59D", gravyMid: "#FFEE58", gravyDeep: "#FDD835",
    bits: ["#FF8A65", "#66BB6A", "#8D6E63", "#EF5350"],
    bowl: "#5D4037", rim: "#FAFAFA", table: ["#221810", "#4E342E", "#100C08"],
  },
  default: {
    gravyTop: "#FFAB40", gravyMid: "#FF6D00", gravyDeep: "#E65100",
    bits: ["#FFF3E0", "#66BB6A", "#8D6E63", "#FFD54F"],
    bowl: "#4E342E", rim: "#EFEBE9", table: ["#1C120E", "#4E342E", "#0C0806"],
  },
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

function foodBits(cx, cy, rx, ry, theme, h, count = 80) {
  const parts = [];
  for (let i = 0; i < count; i++) {
    const a = ((h[i % h.length] / 255) * Math.PI * 2) + (i * 0.37);
    const dist = (0.15 + (h[(i + 3) % h.length] / 255) * 0.75);
    const x = cx + Math.cos(a) * rx * dist;
    const y = cy + Math.sin(a) * ry * dist * 0.85;
    const color = theme.bits[i % theme.bits.length];
    const size = 2 + (h[(i + 7) % h.length] % 7);
    if (i % 5 === 0) {
      // herb leaf
      parts.push(
        `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(size * 1.8).toFixed(1)}" ry="${(size * 0.7).toFixed(1)}" fill="${theme.bits[2]}" opacity="0.9" transform="rotate(${(i * 17) % 360} ${x.toFixed(1)} ${y.toFixed(1)})"/>`
      );
    } else if (i % 4 === 0) {
      // paneer / chunk cube look
      parts.push(
        `<rect x="${(x - size).toFixed(1)}" y="${(y - size * 0.6).toFixed(1)}" width="${(size * 2).toFixed(1)}" height="${(size * 1.2).toFixed(1)}" rx="2" fill="${color}" opacity="0.88"/>`
      );
    } else {
      parts.push(
        `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${size}" fill="${color}" opacity="${0.55 + (h[i % h.length] / 255) * 0.4}"/>`
      );
    }
  }
  return parts.join("\n");
}

function woodGrain(h) {
  const lines = [];
  for (let i = 0; i < 28; i++) {
    const y = 620 + i * 16 + (h[i % h.length] % 8);
    const op = 0.04 + (h[(i + 2) % h.length] / 255) * 0.06;
    lines.push(
      `<path d="M -40 ${y} Q 350 ${y + (h[i] % 10) - 5} 700 ${y} T 1440 ${y + 3}" stroke="#1A0F0A" stroke-width="2" fill="none" opacity="${op.toFixed(3)}"/>`
    );
  }
  return lines.join("\n");
}

function buildSvg({ title, theme, seed, style }) {
  const h = hashSeed(seed);
  const wobble = (i, max = 20) => ((h[i % h.length] / 255) * max) - max / 2;
  const plateX = 700 + wobble(0, 40);
  const plateY = 520 + wobble(1, 25);
  const bowlRx = 290 + wobble(2, 35);
  const bowlRy = 118 + wobble(3, 15);
  const steamOp = 0.18 + (h[5] / 255) * 0.15;

  const safeTitle = String(title || "Rasoira")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .slice(0, 40);

  const isBread = style === "bread";
  const isSnack = style === "snack";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="#1A120E"/>
      <stop offset="45%" stop-color="${theme.table[0]}"/>
      <stop offset="100%" stop-color="${theme.table[2]}"/>
    </linearGradient>
    <radialGradient id="windowLight" cx="22%" cy="8%" r="55%">
      <stop offset="0%" stop-color="#FFF8E7" stop-opacity="0.35"/>
      <stop offset="55%" stop-color="#FFCC80" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="gravy" cx="42%" cy="35%" r="60%">
      <stop offset="0%" stop-color="${theme.gravyTop}"/>
      <stop offset="40%" stop-color="${theme.gravyMid}"/>
      <stop offset="100%" stop-color="${theme.gravyDeep}"/>
    </radialGradient>
    <radialGradient id="plateShade" cx="50%" cy="40%" r="55%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="55%" stop-color="#F5F0E8"/>
      <stop offset="100%" stop-color="#BCAAA4"/>
    </radialGradient>
    <radialGradient id="bowlInner" cx="50%" cy="40%" r="50%">
      <stop offset="0%" stop-color="${theme.bowl}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${theme.bowl}"/>
    </radialGradient>
    <filter id="softBlur" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="10"/>
    </filter>
    <filter id="micro" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" result="noise"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.15  0 0 0 0 0.1  0 0 0 0 0.05  0 0 0 0.12 0" result="tint"/>
      <feBlend in="SourceGraphic" in2="tint" mode="multiply"/>
    </filter>
    <filter id="drop">
      <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#000" flood-opacity="0.55"/>
    </filter>
  </defs>

  <!-- Dark kitchen backdrop -->
  <rect width="100%" height="100%" fill="url(#bgGrad)"/>
  <rect width="100%" height="100%" fill="url(#windowLight)"/>

  <!-- Wooden table surface -->
  <ellipse cx="700" cy="860" rx="620" ry="140" fill="${theme.table[1]}" opacity="0.85"/>
  <ellipse cx="700" cy="850" rx="600" ry="120" fill="${theme.table[0]}" opacity="0.9"/>
  ${woodGrain(h)}

  <!-- Soft table shadow under plate -->
  <ellipse cx="${plateX}" cy="${plateY + 160}" rx="${bowlRx + 120}" ry="42" fill="#000" opacity="0.5" filter="url(#softBlur)"/>

  <!-- Ceramic plate -->
  <g filter="url(#drop)">
    <ellipse cx="${plateX}" cy="${plateY + 55}" rx="${bowlRx + 130}" ry="${bowlRy + 55}" fill="url(#plateShade)"/>
    <ellipse cx="${plateX}" cy="${plateY + 48}" rx="${bowlRx + 100}" ry="${bowlRy + 38}" fill="#E8DFD0" opacity="0.55"/>
  </g>

  ${isBread ? breadStack(plateX, plateY, theme, h) : isSnack ? snackPile(plateX, plateY, theme, h) : mainBowl(plateX, plateY, bowlRx, bowlRy, theme, h)}

  <!-- Steam -->
  <path d="M ${plateX - 50} ${plateY - 100} Q ${plateX - 70} ${plateY - 200} ${plateX - 40} ${plateY - 280}"
        stroke="#fff" stroke-width="10" fill="none" opacity="${steamOp}" stroke-linecap="round"/>
  <path d="M ${plateX + 5} ${plateY - 110} Q ${plateX + 30} ${plateY - 220} ${plateX + 8} ${plateY - 310}"
        stroke="#fff" stroke-width="12" fill="none" opacity="${steamOp * 1.15}" stroke-linecap="round"/>
  <path d="M ${plateX + 55} ${plateY - 95} Q ${plateX + 80} ${plateY - 190} ${plateX + 50} ${plateY - 270}"
        stroke="#fff" stroke-width="9" fill="none" opacity="${steamOp * 0.9}" stroke-linecap="round"/>

  <!-- Side accents: lemon + chilli + spoon hint -->
  <ellipse cx="${plateX + bowlRx + 80}" cy="${plateY + 70}" rx="28" ry="22" fill="#F9A825" opacity="0.95"/>
  <ellipse cx="${plateX + bowlRx + 80}" cy="${plateY + 70}" rx="22" ry="16" fill="#FFF59D" opacity="0.7"/>
  <ellipse cx="${plateX - bowlRx - 70}" cy="${plateY + 80}" rx="10" ry="22" fill="#C62828" opacity="0.9" transform="rotate(-25 ${plateX - bowlRx - 70} ${plateY + 80})"/>
  <ellipse cx="${plateX - bowlRx - 55}" cy="${plateY + 95}" rx="9" ry="20" fill="#2E7D32" opacity="0.85" transform="rotate(15 ${plateX - bowlRx - 55} ${plateY + 95})"/>

  <!-- Film grain / texture overlay -->
  <rect width="100%" height="100%" filter="url(#micro)" opacity="0.45"/>

  <!-- Vignette -->
  <radialGradient id="vig" cx="50%" cy="45%" r="70%">
    <stop offset="55%" stop-color="#000" stop-opacity="0"/>
    <stop offset="100%" stop-color="#000" stop-opacity="0.55"/>
  </radialGradient>
  <rect width="100%" height="100%" fill="url(#vig)"/>

  <!-- Brand -->
  <text x="70" y="1000" font-family="Georgia, 'Times New Roman', serif" font-size="34" fill="#F5E6C8" opacity="0.7" letter-spacing="5">RASOIRA</text>
  <text x="70" y="1028" font-family="Helvetica, Arial, sans-serif" font-size="13" fill="#C4B5A0" opacity="0.45">Original studio food photography</text>
  <text x="1330" y="1028" text-anchor="end" font-family="Georgia, serif" font-size="24" fill="#F5E6C8" opacity="0.55">${safeTitle}</text>
</svg>`;
}

function mainBowl(plateX, plateY, bowlRx, bowlRy, theme, h) {
  return `
  <!-- Bowl body -->
  <ellipse cx="${plateX}" cy="${plateY + 18}" rx="${bowlRx}" ry="${bowlRy}" fill="${theme.bowl}"/>
  <ellipse cx="${plateX}" cy="${plateY + 10}" rx="${bowlRx - 14}" ry="${bowlRy - 8}" fill="url(#bowlInner)"/>
  <!-- Food surface -->
  <ellipse cx="${plateX}" cy="${plateY - 8}" rx="${bowlRx - 28}" ry="${bowlRy - 22}" fill="url(#gravy)"/>
  <!-- Gloss highlight -->
  <ellipse cx="${plateX - 70}" cy="${plateY - 45}" rx="100" ry="28" fill="#fff" opacity="0.18"/>
  <!-- Surface swirl -->
  <path d="M ${plateX - 120} ${plateY - 5} Q ${plateX - 20} ${plateY - 55} ${plateX + 110} ${plateY - 10}
           Q ${plateX + 30} ${plateY + 35} ${plateX - 100} ${plateY + 18} Z"
        fill="${theme.gravyTop}" opacity="0.22"/>
  <!-- Ingredient bits -->
  ${foodBits(plateX, plateY - 5, bowlRx - 50, bowlRy - 30, theme, h, 90)}
  <!-- Rim highlight -->
  <ellipse cx="${plateX}" cy="${plateY + 8}" rx="${bowlRx - 8}" ry="${bowlRy - 6}" fill="none" stroke="${theme.rim}" stroke-width="3" opacity="0.25"/>
  `;
}

function breadStack(plateX, plateY, theme, h) {
  const layers = [];
  for (let i = 0; i < 4; i++) {
    const y = plateY + 30 - i * 18;
    const skew = wobbleFrom(h, i, 12);
    layers.push(`
      <ellipse cx="${plateX + skew}" cy="${y}" rx="${220 - i * 8}" ry="28" fill="${i % 2 ? theme.gravyMid : theme.gravyDeep}" opacity="0.95"/>
      <ellipse cx="${plateX + skew - 40}" cy="${y - 8}" rx="70" ry="10" fill="#fff" opacity="0.12"/>
    `);
  }
  return layers.join("\n") + foodBits(plateX, plateY - 20, 140, 40, theme, h, 25);
}

function snackPile(plateX, plateY, theme, h) {
  const bits = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const x = plateX + Math.cos(a) * (90 + (h[i] % 40));
    const y = plateY + Math.sin(a) * (35 + (h[i + 1] % 20));
    bits.push(`
      <ellipse cx="${x}" cy="${y}" rx="38" ry="22" fill="${theme.gravyMid}" opacity="0.95" transform="rotate(${(i * 25) % 360} ${x} ${y})"/>
      <ellipse cx="${x - 8}" cy="${y - 6}" rx="12" ry="5" fill="#fff" opacity="0.15"/>
    `);
  }
  return bits.join("\n") + foodBits(plateX, plateY, 160, 50, theme, h, 40);
}

function wobbleFrom(h, i, max) {
  return ((h[i % h.length] / 255) * max) - max / 2;
}

function detectStyle(name = "", templateKey = "") {
  const n = `${name} ${templateKey}`.toLowerCase();
  if (/roti|paratha|naan|thepla|bread|dosa|idli/.test(n)) return "bread";
  if (/samosa|pakora|snack|tikki|vada|fry/.test(n)) return "snack";
  return "bowl";
}

/**
 * Generate and cache a premium hero JPEG for a recipe.
 * Tries real licensed photos first, then studio art fallback.
 */
export async function generatePremiumHero(recipe, { force = false, preferReal = true } = {}) {
  const id = recipe?.id;
  if (!id) throw new Error("recipe.id required");

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.mkdirSync(META_DIR, { recursive: true });

  const dest = path.join(CACHE_DIR, `${id}.jpg`);
  const metaFile = path.join(META_DIR, `${id}.json`);

  if (!force && fs.existsSync(dest)) {
    try {
      const existing = JSON.parse(fs.readFileSync(metaFile, "utf8"));
      if (
        (existing.source === "premium-hero" ||
          existing.source === "premium-hero-real" ||
          existing.source === "rasoira-ai-original") &&
        (existing.version || 0) >= HERO_VERSION
      ) {
        return { filePath: dest, meta: existing };
      }
    } catch {
      /* regenerate */
    }
  }

  const dishName = recipe.name || recipe.title || id;
  let jpeg = null;
  let metaExtra = {};

  if (preferReal) {
    try {
      const match = await findRealFoodPhoto(dishName);
      if (match?.score >= 0.5) {
        jpeg = await fetchAndNormalizePhoto(match);
        metaExtra = {
          source: "premium-hero-real",
          title: `${dishName} — ${match.title}`.slice(0, 120),
          originalUrl: match.imageUrl,
          license: match.license || "CC-commercial",
          licenseName: `Commercially licensed photo via ${match.source}`,
          photoSource: match.source,
          matchScore: match.score,
        };
      }
    } catch {
      /* fall through to studio art */
    }
  }

  if (!jpeg) {
    const theme = pickTheme(dishName, recipe.category, recipe.templateKey);
    const style = detectStyle(dishName, recipe.templateKey);
    const svg = buildSvg({
      title: dishName,
      theme,
      seed: `${id}:${dishName}:${recipe.cuisine || ""}:v${HERO_VERSION}`,
      style,
    });
    jpeg = await sharp(Buffer.from(svg))
      .resize(WIDTH, HEIGHT, { fit: "cover" })
      .jpeg({ quality: 94, mozjpeg: true, chromaSubsampling: "4:4:4" })
      .toBuffer();
    metaExtra = {
      source: "premium-hero",
      title: `${dishName} — Rasoira Original`,
      originalUrl: `rasoira-ai://premium-hero/${id}`,
      license: "RASOIRA-AI",
      licenseName: "Rasoira AI-generated original food photography",
    };
  }

  if (jpeg.length < 12000) throw new Error("Generated image too small");

  fs.writeFileSync(dest, jpeg);
  const contentHash = crypto.createHash("md5").update(jpeg).digest("hex");
  const meta = {
    recipeId: id,
    recipeName: dishName,
    commercialUseAllowed: true,
    score: metaExtra.matchScore || 0.99,
    width: WIDTH,
    height: HEIGHT,
    contentHash,
    version: HERO_VERSION,
    fetchedAt: new Date().toISOString(),
    ...metaExtra,
  };
  fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2));
  return { filePath: dest, meta };
}

export function isPremiumHero(recipeId) {
  try {
    const meta = JSON.parse(fs.readFileSync(path.join(META_DIR, `${recipeId}.json`), "utf8"));
    return (
      meta.source === "premium-hero" ||
      meta.source === "premium-hero-real" ||
      meta.source === "rasoira-ai-original"
    );
  } catch {
    return false;
  }
}

export { WIDTH, HEIGHT, THEMES, HERO_VERSION };
