/** Soft account wall after N completed cooks or favorites */
const COOKS_THRESHOLD = 3;
const FAV_THRESHOLD = 2;
const DISMISS_KEY = "akb-account-wall-dismissed";

export function shouldShowAccountWall(isLoggedIn, totalCooks) {
  if (isLoggedIn) return false;
  if (localStorage.getItem(DISMISS_KEY) === "1") return false;
  return (totalCooks || 0) >= COOKS_THRESHOLD;
}

export function shouldShowFavoriteSignup(isLoggedIn, favoriteCount) {
  if (isLoggedIn) return false;
  if (localStorage.getItem(DISMISS_KEY) === "1") return false;
  return (favoriteCount || 0) >= FAV_THRESHOLD;
}

export function dismissAccountWall() {
  localStorage.setItem(DISMISS_KEY, "1");
}

export function getAccountWallThreshold() {
  return COOKS_THRESHOLD;
}
