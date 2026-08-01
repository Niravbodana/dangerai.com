/**
 * Grocery provider adapters — ready for Blinkit / Zepto / Instamart integration.
 * Search deep-links today; cart/checkout can plug in later.
 */

export const GROCERY_PROVIDERS = [
  {
    id: "instamart",
    name: "Instamart",
    searchUrl: (query) =>
      `https://www.swiggy.com/instamart/search?custom_back=true&query=${encodeURIComponent(query)}`,
  },
  {
    id: "blinkit",
    name: "Blinkit",
    searchUrl: (query) => `https://blinkit.com/s/?q=${encodeURIComponent(query)}`,
  },
  {
    id: "zepto",
    name: "Zepto",
    searchUrl: (query) => `https://www.zeptonow.com/search?query=${encodeURIComponent(query)}`,
  },
];

export function getGroceryProviders() {
  return GROCERY_PROVIDERS;
}

export function getProviderSearchUrl(providerId, query = "groceries") {
  const provider = GROCERY_PROVIDERS.find((p) => p.id === providerId);
  return provider ? provider.searchUrl(query) : null;
}
