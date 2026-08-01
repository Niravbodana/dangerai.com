import { addFavorite, rateRecipe, removeFavorite } from "../api";

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

export function isLocalFavorite(recipeId) {
  return getLocalFavorites().includes(recipeId);
}

export async function toggleFavorite(recipeId) {
  const guestId = getGuestId();
  const favs = getLocalFavorites();
  const exists = favs.includes(recipeId);

  if (exists) {
    const updated = favs.filter((id) => id !== recipeId);
    setLocalFavorites(updated);
    removeFavorite(recipeId, guestId).catch(() => {});
    return false;
  }

  const updated = [...favs, recipeId];
  setLocalFavorites(updated);
  await addFavorite(recipeId, guestId).catch(() => {});
  await rateRecipe(recipeId, 5, guestId).catch(() => {});
  return true;
}

export const isFavorite = isLocalFavorite;

export function shareOnWhatsApp(recipe) {
  const text = `${recipe.name}\n\nRasoira — home cooked food, step by step recipe\n${window.location.origin}/recipe/${recipe.id}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
}
