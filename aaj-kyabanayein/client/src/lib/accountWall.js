/** Soft account wall after N completed cooks */
const COOKS_THRESHOLD = 3;
const DISMISS_KEY = "akb-account-wall-dismissed";

export function shouldShowAccountWall(isLoggedIn, totalCooks) {
  if (isLoggedIn) return false;
  if (localStorage.getItem(DISMISS_KEY) === "1") return false;
  return (totalCooks || 0) >= COOKS_THRESHOLD;
}

export function dismissAccountWall() {
  localStorage.setItem(DISMISS_KEY, "1");
}

export function getAccountWallThreshold() {
  return COOKS_THRESHOLD;
}
