/** Pantry 2.0 — items with quantity + expiry */
const KEY = "akb-pantry-v2";

export function loadPantry() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function save(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function upsertPantryItem({ key, label, labelHi, quantity = "1", unit = "", expiry = "" }) {
  const items = loadPantry();
  const idx = items.findIndex((i) => i.key === key);
  const entry = {
    key,
    label: label || key,
    labelHi: labelHi || label || key,
    quantity: String(quantity || "1"),
    unit: unit || "",
    expiry: expiry || "",
    updatedAt: new Date().toISOString(),
  };
  if (idx >= 0) items[idx] = { ...items[idx], ...entry };
  else items.push(entry);
  save(items);
  return items;
}

export function removePantryItem(key) {
  const items = loadPantry().filter((i) => i.key !== key);
  save(items);
  return items;
}

export function clearPantry() {
  save([]);
  return [];
}

export function getExpiringSoon(withinDays = 3) {
  const now = Date.now();
  const limit = withinDays * 86400000;
  return loadPantry().filter((i) => {
    if (!i.expiry) return false;
    const t = new Date(i.expiry).getTime();
    return t >= now && t - now <= limit;
  });
}

export function getExpired() {
  const now = Date.now();
  return loadPantry().filter((i) => i.expiry && new Date(i.expiry).getTime() < now);
}

export function parseQuantity(qty) {
  const n = parseFloat(String(qty || "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 1;
}

export function getLowStock(maxQty = 1) {
  return loadPantry().filter((i) => parseQuantity(i.quantity) <= maxQty);
}

export function getExpiringKeys(withinDays = 3) {
  return getExpiringSoon(withinDays).map((i) => i.key);
}

export function getPantryPayload() {
  const items = loadPantry();
  return {
    ingredients: items.map((i) => i.key),
    expiringKeys: getExpiringKeys(3),
    lowStockKeys: getLowStock(1).map((i) => i.key),
    items,
  };
}

export function getLocalPantryAnalytics() {
  const items = loadPantry();
  const expiring = getExpiringSoon(3);
  const expired = getExpired();
  const lowStock = getLowStock(1);
  return {
    totalItems: items.length,
    withExpiry: items.filter((i) => i.expiry).length,
    expiringSoon: expiring.length,
    expired: expired.length,
    lowStock: lowStock.length,
  };
}

export function pantryKeysForSuggest() {
  return loadPantry().map((i) => i.key);
}

export function buildGroceryWhatsAppText(items = []) {
  const lines = ["🛒 *Rasoira Bazaar List*", ""];
  for (const item of items) {
    const name = item.nameHi || item.name || item.labelHi || item.label;
    const qty = item.quantity ? ` — ${item.quantity}` : "";
    lines.push(`☐ ${name}${qty}`);
  }
  lines.push("", "— Rasoira se");
  return lines.join("\n");
}

export function openWhatsAppShare(text) {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

/** Instamart / Blinkit style search deep-link (best-effort) */
export function openInstamartSearch(query = "vegetables") {
  const q = encodeURIComponent(query);
  // Swiggy Instamart web search fallback
  window.open(`https://www.swiggy.com/instamart/search?custom_back=true&query=${q}`, "_blank", "noopener,noreferrer");
}
