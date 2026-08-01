/** Local-first product analytics — no third-party providers */

const KEY = "akb-analytics";
const MAX = 500;

export const EVENTS = {
  RECIPE_VIEW: "recipe_view",
  SEARCH: "search",
  PLANNER_USE: "planner_use",
  PANTRY_USE: "pantry_use",
  FAVORITE: "favorite",
  COLLECTION: "collection",
  COOKING_COMPLETE: "cooking_complete",
  STREAK: "streak",
};

/** Legacy event names still counted in summaries */
const LEGACY_ALIASES = {
  [EVENTS.RECIPE_VIEW]: ["recipe_open"],
  [EVENTS.SEARCH]: ["search_suggestion_click"],
  [EVENTS.PANTRY_USE]: ["pantry_suggest"],
  [EVENTS.COLLECTION]: ["collection_open"],
  [EVENTS.COOKING_COMPLETE]: ["cook_finish"],
  [EVENTS.STREAK]: [],
};

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(events) {
  localStorage.setItem(KEY, JSON.stringify(events.slice(-MAX)));
}

export function track(event, props = {}) {
  const entry = {
    event,
    props,
    ts: new Date().toISOString(),
    path: typeof window !== "undefined" ? window.location.pathname : "",
  };
  const events = read();
  events.push(entry);
  write(events);
  if (typeof window !== "undefined" && window.__RASOIRA_DEBUG__) {
    console.debug("[analytics]", event, props);
  }
  return entry;
}

function countEvent(events, name) {
  const aliases = LEGACY_ALIASES[name] || [];
  return events.filter((e) => e.event === name || aliases.includes(e.event)).length;
}

export function trackRecipeView(recipeId, props = {}) {
  return track(EVENTS.RECIPE_VIEW, { id: recipeId, ...props });
}

export function trackSearch(query, props = {}) {
  return track(EVENTS.SEARCH, { q: query, ...props });
}

export function trackPlannerUse(action, props = {}) {
  return track(EVENTS.PLANNER_USE, { action, ...props });
}

export function trackPantryUse(action, props = {}) {
  return track(EVENTS.PANTRY_USE, { action, ...props });
}

export function trackFavorite(recipeId, added, props = {}) {
  return track(EVENTS.FAVORITE, { id: recipeId, added, ...props });
}

export function trackCollection(collectionId, props = {}) {
  return track(EVENTS.COLLECTION, { id: collectionId, ...props });
}

export function trackCookingComplete(recipeId, props = {}) {
  return track(EVENTS.COOKING_COMPLETE, { id: recipeId, ...props });
}

export function trackStreak(action, props = {}) {
  return track(EVENTS.STREAK, { action, ...props });
}

export function getAnalyticsEvents(limit = 100) {
  return read().slice(-limit);
}

export function getAnalyticsSummary() {
  const events = read();
  return {
    recipeViews: countEvent(events, EVENTS.RECIPE_VIEW),
    searches: countEvent(events, EVENTS.SEARCH),
    plannerUsage: countEvent(events, EVENTS.PLANNER_USE),
    pantryUsage: countEvent(events, EVENTS.PANTRY_USE),
    favorites: countEvent(events, EVENTS.FAVORITE),
    collections: countEvent(events, EVENTS.COLLECTION),
    cookingCompletions: countEvent(events, EVENTS.COOKING_COMPLETE),
    streak: countEvent(events, EVENTS.STREAK),
    totalEvents: events.length,
  };
}

/** @deprecated use getAnalyticsSummary */
export function getFunnelStats() {
  const s = getAnalyticsSummary();
  return {
    recipeOpen: s.recipeViews,
    cookStart: s.streak,
    cookFinish: s.cookingCompletions,
    search: s.searches,
    dailyOpen: read().filter((e) => e.event === "daily_brief_open").length,
    pantrySuggest: s.pantryUsage,
  };
}

export function getEventsByType(type, limit = 50) {
  const aliases = LEGACY_ALIASES[type] || [];
  return read()
    .filter((e) => e.event === type || aliases.includes(e.event))
    .slice(-limit);
}
