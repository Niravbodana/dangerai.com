/** Grocery list persistence + shopping completion tracking */
import { getProviderSearchUrl } from "./groceryProviders";

const LIST_KEY = "akb-grocery-list";
const CHECKED_KEY = "akb-grocery-checked";
const META_KEY = "akb-grocery-meta";

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function saveGroceryFromPlan(items = [], meta = {}) {
  writeJson(LIST_KEY, items);
  writeJson(META_KEY, { ...meta, updatedAt: new Date().toISOString(), source: "planner" });
  return items;
}

export function loadGroceryList() {
  return readJson(LIST_KEY, []);
}

export function loadGroceryMeta() {
  return readJson(META_KEY, {});
}

export function getCheckedState() {
  return readJson(CHECKED_KEY, {});
}

export function toggleGroceryChecked(itemId) {
  const checked = getCheckedState();
  checked[itemId] = !checked[itemId];
  writeJson(CHECKED_KEY, checked);
  return checked;
}

export function clearGroceryChecked() {
  writeJson(CHECKED_KEY, {});
}

export function getGroceryCompletion(items = loadGroceryList()) {
  const checked = getCheckedState();
  const done = items.filter((i) => checked[i.id || i.name]).length;
  return { done, total: items.length, percent: items.length ? Math.round((done / items.length) * 100) : 0 };
}

export function openProviderSearch(providerId, query) {
  const url = getProviderSearchUrl(providerId, query);
  if (url) window.open(url, "_blank", "noopener,noreferrer");
}
