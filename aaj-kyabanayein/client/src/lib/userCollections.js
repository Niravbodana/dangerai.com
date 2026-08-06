/** User-created recipe folders / collections (localStorage) */

const KEY = "akb-user-collections";

export function getUserCollections() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function save(collections) {
  localStorage.setItem(KEY, JSON.stringify(collections));
}

export function getUserCollection(id) {
  return getUserCollections().find((c) => c.id === id) || null;
}

export function createCollection(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return null;

  const collections = getUserCollections();
  if (collections.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) return null;

  const collection = {
    id: `col_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: trimmed,
    recipeIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  collections.push(collection);
  save(collections);
  return collection;
}

export function renameCollection(id, name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return false;

  const collections = getUserCollections();
  const idx = collections.findIndex((c) => c.id === id);
  if (idx < 0) return false;
  if (collections.some((c, i) => i !== idx && c.name.toLowerCase() === trimmed.toLowerCase())) return false;

  collections[idx] = { ...collections[idx], name: trimmed, updatedAt: new Date().toISOString() };
  save(collections);
  return true;
}

export function deleteCollection(id) {
  save(getUserCollections().filter((c) => c.id !== id));
}

export function addRecipeToCollection(collectionId, recipeId) {
  if (!collectionId || !recipeId) return false;

  const collections = getUserCollections();
  const idx = collections.findIndex((c) => c.id === collectionId);
  if (idx < 0) return false;

  const ids = collections[idx].recipeIds || [];
  if (ids.includes(recipeId)) return false;

  collections[idx] = {
    ...collections[idx],
    recipeIds: [...ids, recipeId],
    updatedAt: new Date().toISOString(),
  };
  save(collections);
  return true;
}

export function removeRecipeFromCollection(collectionId, recipeId) {
  const collections = getUserCollections();
  const idx = collections.findIndex((c) => c.id === collectionId);
  if (idx < 0) return false;

  collections[idx] = {
    ...collections[idx],
    recipeIds: (collections[idx].recipeIds || []).filter((id) => id !== recipeId),
    updatedAt: new Date().toISOString(),
  };
  save(collections);
  return true;
}

export function getCollectionShareUrl(collection) {
  return `${window.location.origin}/favorites?collection=${encodeURIComponent(collection.id)}`;
}

export function buildSharePayload(collection) {
  return {
    type: "user-collection",
    id: collection.id,
    name: collection.name,
    recipeIds: collection.recipeIds || [],
    sharedAt: new Date().toISOString(),
  };
}

export async function copyCollectionShareLink(collection) {
  const url = getCollectionShareUrl(collection);
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return url;
  }
  return url;
}

export function sortRecipes(recipes, sortBy = "recent", recipeOrder = []) {
  const list = [...recipes];
  switch (sortBy) {
    case "name-asc":
      return list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    case "name-desc":
      return list.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    case "time-asc":
      return list.sort((a, b) => (a.cookTime || 0) - (b.cookTime || 0));
    case "time-desc":
      return list.sort((a, b) => (b.cookTime || 0) - (a.cookTime || 0));
    case "recent":
    default:
      return list.sort((a, b) => recipeOrder.indexOf(b.id) - recipeOrder.indexOf(a.id));
  }
}

export function filterRecipes(recipes, filterBy = "all") {
  if (filterBy === "all") return recipes;
  if (filterBy === "veg") {
    return recipes.filter((r) => {
      const d = (r.diet || []).map((x) => String(x).toLowerCase());
      if (d.some((x) => x.includes("non-veg") || x === "non-vegetarian")) return false;
      return d.some((x) => x === "veg" || x === "vegetarian" || x === "vegan" || x === "jain") || !d.length;
    });
  }
  if (filterBy === "non-veg") {
    return recipes.filter((r) => r.diet?.includes("non-veg"));
  }
  return recipes.filter((r) => r.cuisine === filterBy);
}
