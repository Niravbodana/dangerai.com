/** Cloud sync — taste, family, pantry, planner settings across devices */
import { getToken } from "../api";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

const LOCAL_KEYS = {
  tasteProfile: "akb-taste-profile",
  familyProfiles: "akb-family-profiles",
  pantry: "akb-pantry-v2",
  plannerSettings: "akb-prefs",
  notifyPrefs: "akb-notify-pref",
};

const SYNC_META_KEY = "akb-sync-meta";

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

function readLocal(key) {
  const storageKey = LOCAL_KEYS[key];
  if (!storageKey) return null;
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "null");
  } catch {
    return null;
  }
}

function writeLocal(key, data) {
  const storageKey = LOCAL_KEYS[key];
  if (!storageKey || data == null) return;
  localStorage.setItem(storageKey, JSON.stringify(data));
}

function getSyncMeta() {
  try {
    return JSON.parse(localStorage.getItem(SYNC_META_KEY) || "{}");
  } catch {
    return {};
  }
}

function setSyncMeta(key, updatedAt) {
  const meta = getSyncMeta();
  meta[key] = updatedAt;
  localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
}

export async function pullCloudSync() {
  const token = getToken();
  if (!token) return { ok: false, reason: "not_logged_in" };

  const res = await fetch(`${API_BASE}/sync`, { headers: authHeaders() });
  if (!res.ok) return { ok: false, reason: "fetch_failed" };
  const body = await res.json();
  const { data = {}, meta = {} } = body;

  for (const [key, value] of Object.entries(data)) {
    if (LOCAL_KEYS[key] && value != null) {
      writeLocal(key, value);
      if (meta[key]) setSyncMeta(key, meta[key]);
    }
  }
  return { ok: true, keys: Object.keys(data) };
}

export async function pushCloudSync(keys = Object.keys(LOCAL_KEYS)) {
  const token = getToken();
  if (!token) return { ok: false, reason: "not_logged_in" };

  const bundles = {};
  for (const key of keys) {
    const data = readLocal(key);
    if (data != null) {
      bundles[key] = { data, updatedAt: getSyncMeta()[key] || new Date().toISOString() };
    }
  }

  const res = await fetch(`${API_BASE}/sync/bulk`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ bundles }),
  });
  if (!res.ok) return { ok: false, reason: "push_failed" };
  const body = await res.json();
  for (const [key, result] of Object.entries(body.results || {})) {
    if (result.ok && result.updatedAt) setSyncMeta(key, result.updatedAt);
  }
  return { ok: true, results: body.results };
}

export async function syncOnLogin() {
  await pushCloudSync();
  return pullCloudSync();
}

export function registerPushSubscription(subscription) {
  const token = getToken();
  if (!token || !subscription) return Promise.resolve(null);
  return fetch(`${API_BASE}/push/subscribe`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ subscription }),
  }).then((r) => (r.ok ? r.json() : null));
}
