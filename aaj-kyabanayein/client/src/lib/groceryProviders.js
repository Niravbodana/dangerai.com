/**
 * Grocery & food delivery provider deep-links.
 */

export const GROCERY_PROVIDERS = [
  {
    id: "instamart",
    name: "Instamart",
    type: "grocery",
    searchUrl: (query) =>
      `https://www.swiggy.com/instamart/search?custom_back=true&query=${encodeURIComponent(query)}`,
  },
  {
    id: "blinkit",
    name: "Blinkit",
    type: "grocery",
    searchUrl: (query) => `https://blinkit.com/s/?q=${encodeURIComponent(query)}`,
  },
  {
    id: "zepto",
    name: "Zepto",
    type: "grocery",
    searchUrl: (query) => `https://www.zeptonow.com/search?query=${encodeURIComponent(query)}`,
  },
  {
    id: "bigbasket",
    name: "BigBasket",
    type: "grocery",
    searchUrl: (query) => `https://www.bigbasket.com/ps/?q=${encodeURIComponent(query)}`,
  },
  {
    id: "zomato",
    name: "Zomato",
    type: "delivery",
    searchUrl: (query) => `https://www.zomato.com/search?q=${encodeURIComponent(query)}`,
  },
  {
    id: "swiggy",
    name: "Swiggy",
    type: "delivery",
    searchUrl: (query) => `https://www.swiggy.com/search?query=${encodeURIComponent(query)}`,
  },
];

export function getGroceryProviders() {
  return GROCERY_PROVIDERS;
}

export function getGroceryOnlyProviders() {
  return GROCERY_PROVIDERS.filter((p) => p.type === "grocery");
}

export function getDeliveryProviders() {
  return GROCERY_PROVIDERS.filter((p) => p.type === "delivery");
}

export function getProviderSearchUrl(providerId, query = "groceries") {
  const provider = GROCERY_PROVIDERS.find((p) => p.id === providerId);
  return provider ? provider.searchUrl(query) : null;
}

export function openProviderSearch(providerId, query) {
  const url = getProviderSearchUrl(providerId, query);
  if (url) window.open(url, "_blank", "noopener,noreferrer");
}

export async function fetchProviderCompare(itemName) {
  const res = await fetch("/api/grocery/compare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemName }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.providers || [];
}

export async function fetchRestockSuggestions(pantryItems) {
  const res = await fetch("/api/grocery/restock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pantryItems }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.suggestions || [];
}
