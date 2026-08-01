const KEY = "akb-recent-searches";
const MAX = 8;

export function getRecentSearches() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function addRecentSearch(term) {
  const q = String(term || "").trim();
  if (!q) return getRecentSearches();
  const next = [q, ...getRecentSearches().filter((s) => s.toLowerCase() !== q.toLowerCase())].slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function clearRecentSearches() {
  localStorage.removeItem(KEY);
  return [];
}
