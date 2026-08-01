/** Offline cook packs — cache recipe JSON in localStorage for Plus users */
import { isPlusOrAbove } from "./subscription";

const KEY = "akb-offline-packs";
const MAX = 20;

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function write(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function canSaveOfflinePack() {
  return isPlusOrAbove();
}

export function saveOfflinePack(recipe) {
  if (!recipe?.id) return false;
  if (!isPlusOrAbove()) return false;
  const data = read();
  data[recipe.id] = {
    recipe,
    savedAt: new Date().toISOString(),
  };
  const ids = Object.keys(data);
  if (ids.length > MAX) {
    const sorted = ids.sort((a, b) => (data[a].savedAt || "").localeCompare(data[b].savedAt || ""));
    delete data[sorted[0]];
  }
  write(data);
  return true;
}

export function getOfflinePack(id) {
  return read()[id]?.recipe || null;
}

export function listOfflinePacks() {
  return Object.values(read()).map((e) => e.recipe).filter(Boolean);
}

export function removeOfflinePack(id) {
  const data = read();
  delete data[id];
  write(data);
}
