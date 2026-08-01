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
