/** Lightweight product analytics — stores locally + optional beacon */
const KEY = "akb-analytics";
const MAX = 500;

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

export function getAnalyticsEvents(limit = 100) {
  return read().slice(-limit);
}

export function getFunnelStats() {
  const events = read();
  const count = (name) => events.filter((e) => e.event === name).length;
  return {
    recipeOpen: count("recipe_open"),
    cookStart: count("cook_start"),
    cookFinish: count("cook_finish"),
    search: count("search"),
    dailyOpen: count("daily_brief_open"),
    pantrySuggest: count("pantry_suggest"),
  };
}

export function getWeeklySummary() {
  const events = read();
  const weekAgo = Date.now() - 7 * 86400000;
  const recent = events.filter((e) => new Date(e.ts).getTime() >= weekAgo);
  const count = (name) => recent.filter((e) => e.event === name).length;
  return {
    recipeOpen: count("recipe_open"),
    cookFinish: count("cook_finish"),
    cookStart: count("cook_start"),
    search: count("search"),
    dailyOpen: count("daily_brief_open"),
    pantrySuggest: count("pantry_suggest"),
    totalEvents: recent.length,
    activeDays: new Set(recent.map((e) => e.ts.slice(0, 10))).size,
  };
}

export function getRecentRecipeIds(limit = 6) {
  const events = read().filter((e) => e.event === "recipe_open" || e.event === "cook_finish");
  const ids = [];
  for (let i = events.length - 1; i >= 0 && ids.length < limit; i--) {
    const id = events[i].props?.id;
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

export function getLastActiveTimestamp() {
  const events = read();
  return events.length ? events[events.length - 1].ts : null;
}
