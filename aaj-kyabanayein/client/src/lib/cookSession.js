/** Persist cooking session for resume */
const KEY = "akb-cook-session";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function writeAll(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function saveCookSession(recipeId, session) {
  if (!recipeId) return;
  const data = readAll();
  data[recipeId] = { ...session, recipeId, updatedAt: new Date().toISOString() };
  writeAll(data);
}

export function loadCookSession(recipeId) {
  const entry = readAll()[recipeId];
  if (!entry) return null;
  const age = Date.now() - new Date(entry.updatedAt || 0).getTime();
  if (age > MAX_AGE_MS) {
    clearCookSession(recipeId);
    return null;
  }
  return entry;
}

export function clearCookSession(recipeId) {
  const data = readAll();
  delete data[recipeId];
  writeAll(data);
}
