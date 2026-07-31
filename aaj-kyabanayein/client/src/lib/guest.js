export function getGuestId() {
  let id = localStorage.getItem("akb-guest-id");
  if (!id) {
    id = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem("akb-guest-id", id);
  }
  return id;
}

export function getLocalFavorites() {
  try {
    return JSON.parse(localStorage.getItem("akb-favorites") || "[]");
  } catch {
    return [];
  }
}

export function setLocalFavorites(ids) {
  localStorage.setItem("akb-favorites", JSON.stringify(ids));
}

export function toggleLocalFavorite(recipeId) {
  const favs = getLocalFavorites();
  const exists = favs.includes(recipeId);
  const updated = exists ? favs.filter((id) => id !== recipeId) : [...favs, recipeId];
  setLocalFavorites(updated);
  return !exists;
}

export function isLocalFavorite(recipeId) {
  return getLocalFavorites().includes(recipeId);
}

export const isFavorite = isLocalFavorite;
export const toggleFavorite = toggleLocalFavorite;

export function shareOnWhatsApp(recipe) {
  const text = `${recipe.name}\n\nRasoira — home cooked food, step by step recipe\n${window.location.origin}/recipe/${recipe.id}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
}
