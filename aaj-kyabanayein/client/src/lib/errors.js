/** API error helpers — messages, retry, offline, empty states */

export function isOffline() {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

export function formatApiError({ status, message, offline } = {}) {
  if (offline || isOffline()) {
    return "You appear to be offline. Saved recipes and pantry still work.";
  }
  if (status === 401) return message || "Please log in to continue.";
  if (status === 403) return message || "You do not have permission for this action.";
  if (status === 404) return message || "We could not find that item.";
  if (status === 429) return "Too many requests — please wait a moment and try again.";
  if (status >= 500) return message || "Server is busy. Please try again shortly.";
  return message || "Something went wrong. Please try again.";
}

export async function parseResponse(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export async function fetchWithRetry(fn, { retries = 2, delay = 700 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (isOffline() || attempt === retries) break;
      await new Promise((resolve) => setTimeout(resolve, delay * (attempt + 1)));
    }
  }
  throw lastErr;
}

export const EMPTY_STATES = {
  recipes: {
    title: "No recipes found",
    message: "Try a different search or clear your filters.",
    actionLabel: "Browse recipes",
    action: "/recipes",
  },
  favorites: {
    title: "No favorites yet",
    message: "Save recipes you love while browsing.",
    actionLabel: "Browse recipes",
    action: "/recipes",
  },
  pantry: {
    title: "No pantry matches",
    message: "Add ingredients or try a different combination.",
    actionLabel: "Open pantry",
    action: "/pantry",
  },
  planner: {
    title: "No meal plan yet",
    message: "Generate a plan to see meals and grocery list.",
    actionLabel: null,
    action: null,
  },
  collections: {
    title: "No collections",
    message: "Curated collections will appear here.",
    actionLabel: "Go home",
    action: "/",
  },
  offline: {
    title: "Offline",
    message: "Connect to load fresh data. Cached recipes may still work.",
    actionLabel: "Retry",
    action: null,
  },
  error: {
    title: "Something went wrong",
    message: "Please try again in a moment.",
    actionLabel: "Go home",
    action: "/",
  },
  generic: {
    title: "Nothing here",
    message: "Check back later or try again.",
    actionLabel: "Go home",
    action: "/",
  },
};

export function getEmptyState(key = "generic") {
  return EMPTY_STATES[key] || EMPTY_STATES.generic;
}
