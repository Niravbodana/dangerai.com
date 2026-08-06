/**
 * Grocery & food delivery providers — loaded from admin config via API.
 */
import { fetchSiteConfig } from "../context/SiteConfigContext.jsx";

let providersCache = null;
let urlMapCache = {};

const DEFAULT_PROVIDERS = [
  { id: "instamart", name: "Instamart", type: "grocery", comingSoon: true },
  { id: "blinkit", name: "Blinkit", type: "grocery", comingSoon: true },
  { id: "zepto", name: "Zepto", type: "grocery", comingSoon: true },
  { id: "bigbasket", name: "BigBasket", type: "grocery", comingSoon: false },
  { id: "zomato", name: "Zomato", type: "delivery", comingSoon: true },
  { id: "swiggy", name: "Swiggy", type: "delivery", comingSoon: true },
];

const URL_TEMPLATES = {
  instamart: (q) => `https://www.swiggy.com/instamart/search?custom_back=true&query=${encodeURIComponent(q)}`,
  blinkit: (q) => `https://blinkit.com/s/?q=${encodeURIComponent(q)}`,
  zepto: (q) => `https://www.zeptonow.com/search?query=${encodeURIComponent(q)}`,
  bigbasket: (q) => `https://www.bigbasket.com/ps/?q=${encodeURIComponent(q)}`,
  zomato: (q) => `https://www.zomato.com/search?q=${encodeURIComponent(q)}`,
  swiggy: (q) => `https://www.swiggy.com/search?query=${encodeURIComponent(q)}`,
};

export async function loadGroceryProviders() {
  if (providersCache) return providersCache;
  try {
    const res = await fetch("/api/grocery/providers");
    if (res.ok) {
      const data = await res.json();
      providersCache = data.providers || DEFAULT_PROVIDERS;
      urlMapCache = Object.fromEntries(
        providersCache.filter((p) => p.searchUrl).map((p) => [p.id, p.searchUrl])
      );
      return providersCache;
    }
  } catch {
    /* fallback */
  }
  providersCache = DEFAULT_PROVIDERS;
  return providersCache;
}

export function clearProvidersCache() {
  providersCache = null;
  urlMapCache = {};
}

export function getGroceryProvidersSync() {
  return providersCache || DEFAULT_PROVIDERS;
}

export function isProviderComingSoon(providerId) {
  const p = getGroceryProvidersSync().find((x) => x.id === providerId);
  return Boolean(p?.comingSoon);
}

export function getGroceryProviders() {
  return getGroceryProvidersSync();
}

export function getGroceryOnlyProviders() {
  return getGroceryProvidersSync().filter((p) => p.type === "grocery");
}

export function getDeliveryProviders() {
  return getGroceryProvidersSync().filter((p) => p.type === "delivery");
}

export function getProviderSearchUrl(providerId, query = "groceries") {
  const cached = urlMapCache[providerId];
  if (cached) {
    return cached.replace(encodeURIComponent("groceries"), encodeURIComponent(query));
  }
  const fn = URL_TEMPLATES[providerId];
  return fn ? fn(query) : null;
}

export function openProviderSearch(providerId, query) {
  if (isProviderComingSoon(providerId)) {
    return { ok: false, comingSoon: true, providerId };
  }
  const url = getProviderSearchUrl(providerId, query);
  if (url) window.open(url, "_blank", "noopener,noreferrer");
  return { ok: true };
}

export async function fetchProviderCompare(itemName) {
  const res = await fetch("/api/grocery/compare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemName }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.providers || []).map((p) => ({
    ...p,
    comingSoon: Boolean(p.comingSoon),
  }));
}

export async function fetchRestockSuggestions(pantryItems) {
  const res = await fetch("/api/grocery/restock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pantryItems }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.suggestions || []).map((s) => ({
    ...s,
    providers: (s.providers || []).map((p) => ({ ...p, comingSoon: Boolean(p.comingSoon) })),
  }));
}

// Preload on module import in browser
if (typeof window !== "undefined") {
  loadGroceryProviders();
  fetchSiteConfig().catch(() => {});
}
