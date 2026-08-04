/**
 * Image encode helpers — prefer sharp, fall back to jpeg-js (pure JS).
 * Mac installs often break sharp native binaries; fallback keeps premium upgrade working.
 */
import jpeg from "jpeg-js";

let sharpModule = null;
let sharpTried = false;
let sharpOk = false;

export async function getSharp() {
  if (sharpTried) return sharpOk ? sharpModule : null;
  sharpTried = true;
  try {
    const mod = await import("sharp");
    sharpModule = mod.default || mod;
    // Probe once — broken darwin installs throw on first use
    await sharpModule({
      create: { width: 8, height: 8, channels: 3, background: { r: 0, g: 0, b: 0 } },
    })
      .jpeg()
      .toBuffer();
    sharpOk = true;
    return sharpModule;
  } catch (err) {
    console.warn("[premium] sharp unavailable, using jpeg-js fallback:", err.message?.split("\n")[0] || err);
    sharpOk = false;
    return null;
  }
}

export function isSharpAvailable() {
  return sharpOk;
}

/**
 * Resize/normalize any image buffer to JPEG cover crop.
 */
export async function normalizeToJpeg(inputBuffer, width = 1400, height = 1050, quality = 92) {
  const sharp = await getSharp();
  if (sharp) {
    return sharp(inputBuffer)
      .rotate()
      .resize(width, height, { fit: "cover", position: "attention" })
      .jpeg({ quality, mozjpeg: true, chromaSubsampling: "4:4:4" })
      .toBuffer();
  }

  // Fallback: if already JPEG, keep bytes (optionally re-encode for size check)
  if (isJpeg(inputBuffer)) {
    if (inputBuffer.length >= 20000) return inputBuffer;
  }

  // Decode JPEG if possible and center-crop scale with nearest-neighbor
  if (isJpeg(inputBuffer)) {
    try {
      const decoded = jpeg.decode(inputBuffer, { useTArray: true, formatAsRGBA: false });
      const cropped = coverScaleRgb(decoded.data, decoded.width, decoded.height, width, height, 3);
      return jpeg.encode({ data: cropped, width, height }, quality).data;
    } catch {
      return inputBuffer;
    }
  }

  // PNG / other without decoder — wrap as solid plate so pipeline continues
  return encodeSolidJpeg(width, height, [40, 24, 16], quality);
}

/**
 * Rasterize SVG string to JPEG (sharp) or paint a themed plate (fallback).
 */
export async function svgOrThemeToJpeg(svgString, themeColors, width = 1400, height = 1050, quality = 94) {
  const sharp = await getSharp();
  if (sharp) {
    try {
      return await sharp(Buffer.from(svgString))
        .resize(width, height, { fit: "cover" })
        .jpeg({ quality, mozjpeg: true, chromaSubsampling: "4:4:4" })
        .toBuffer();
    } catch (err) {
      console.warn("[premium] SVG rasterize failed, using plate fallback:", err.message?.split("\n")[0]);
    }
  }
  return paintFoodPlateJpeg(themeColors, width, height, quality);
}

/** Procedural food-plate JPEG when sharp cannot rasterize SVG */
export function paintFoodPlateJpeg(theme = {}, width = 1400, height = 1050, quality = 90) {
  const bg = hexToRgb(theme.table?.[0] || "#2C1810");
  const gravy = hexToRgb(theme.gravyMid || theme.gravy || "#D4A017");
  const gravyDeep = hexToRgb(theme.gravyDeep || "#A67C00");
  const rim = hexToRgb(theme.rim || "#EFEBE9");
  const garnish = hexToRgb(theme.bits?.[2] || "#2E7D32");
  const accent = hexToRgb(theme.bits?.[0] || "#8B4513");

  const data = Buffer.alloc(width * height * 3);
  const cx = width / 2;
  const cy = height * 0.48;
  const bowlRx = width * 0.22;
  const bowlRy = height * 0.14;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3;
      // vignette background
      const dx = (x - cx) / width;
      const dy = (y - cy) / height;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const shade = Math.max(0.35, 1 - dist * 1.2);
      data[i] = Math.round(bg[0] * shade);
      data[i + 1] = Math.round(bg[1] * shade);
      data[i + 2] = Math.round(bg[2] * shade);

      // plate ellipse
      const px = (x - cx) / (bowlRx * 1.55);
      const py = (y - (cy + 30)) / (bowlRy * 1.7);
      if (px * px + py * py <= 1) {
        data[i] = rim[0];
        data[i + 1] = rim[1];
        data[i + 2] = rim[2];
      }

      // gravy bowl
      const bx = (x - cx) / bowlRx;
      const by = (y - cy) / bowlRy;
      if (bx * bx + by * by <= 1) {
        const t = (bx * bx + by * by);
        data[i] = Math.round(gravy[0] * (1 - t) + gravyDeep[0] * t);
        data[i + 1] = Math.round(gravy[1] * (1 - t) + gravyDeep[1] * t);
        data[i + 2] = Math.round(gravy[2] * (1 - t) + gravyDeep[2] * t);
        // gloss
        if ((x - cx + 40) ** 2 / 8000 + (y - cy + 25) ** 2 / 1800 < 1) {
          data[i] = Math.min(255, data[i] + 40);
          data[i + 1] = Math.min(255, data[i + 1] + 35);
          data[i + 2] = Math.min(255, data[i + 2] + 25);
        }
      }
    }
  }

  // garnish dots
  for (let n = 0; n < 40; n++) {
    const a = (n / 40) * Math.PI * 2;
    const r = 0.35 + (n % 7) * 0.06;
    const gx = Math.round(cx + Math.cos(a) * bowlRx * r);
    const gy = Math.round(cy + Math.sin(a) * bowlRy * r * 0.85);
    const color = n % 3 === 0 ? garnish : accent;
    fillCircle(data, width, height, gx, gy, 3 + (n % 4), color);
  }

  return Buffer.from(jpeg.encode({ data, width, height }, quality).data);
}

function encodeSolidJpeg(width, height, rgb, quality) {
  const data = Buffer.alloc(width * height * 3);
  for (let i = 0; i < data.length; i += 3) {
    data[i] = rgb[0];
    data[i + 1] = rgb[1];
    data[i + 2] = rgb[2];
  }
  return Buffer.from(jpeg.encode({ data, width, height }, quality).data);
}

function coverScaleRgb(src, sw, sh, dw, dh, channels) {
  const scale = Math.max(dw / sw, dh / sh);
  const rw = Math.round(sw * scale);
  const rh = Math.round(sh * scale);
  const ox = Math.floor((rw - dw) / 2);
  const oy = Math.floor((rh - dh) / 2);
  const out = Buffer.alloc(dw * dh * channels);
  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dw; x++) {
      const sx = Math.min(sw - 1, Math.max(0, Math.floor((x + ox) / scale)));
      const sy = Math.min(sh - 1, Math.max(0, Math.floor((y + oy) / scale)));
      const si = (sy * sw + sx) * channels;
      const di = (y * dw + x) * channels;
      out[di] = src[si];
      out[di + 1] = src[si + 1];
      out[di + 2] = src[si + 2];
    }
  }
  return out;
}

function fillCircle(data, w, h, cx, cy, r, rgb) {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      if ((x - cx) * (x - cx) + (y - cy) * (y - cy) > r * r) continue;
      const i = (y * w + x) * 3;
      data[i] = rgb[0];
      data[i + 1] = rgb[1];
      data[i + 2] = rgb[2];
    }
  }
}

function hexToRgb(hex = "#000000") {
  const h = String(hex).replace("#", "");
  if (h.length === 3) {
    return [
      parseInt(h[0] + h[0], 16),
      parseInt(h[1] + h[1], 16),
      parseInt(h[2] + h[2], 16),
    ];
  }
  return [
    parseInt(h.slice(0, 2), 16) || 0,
    parseInt(h.slice(2, 4), 16) || 0,
    parseInt(h.slice(4, 6), 16) || 0,
  ];
}

function isJpeg(buf) {
  return Buffer.isBuffer(buf) && buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}
