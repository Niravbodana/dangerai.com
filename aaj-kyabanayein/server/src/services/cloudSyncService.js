import { getDb } from "../db/connection.js";

export const SYNC_KEYS = ["tasteProfile", "familyProfiles", "pantry", "plannerSettings", "groceryChecked", "notifyPrefs"];

export function getUserSync(userId) {
  const rows = getDb()
    .prepare("SELECT sync_key, data_json, updated_at FROM user_sync WHERE user_id = ?")
    .all(userId);
  const data = {};
  const meta = {};
  for (const row of rows) {
    try {
      data[row.sync_key] = JSON.parse(row.data_json);
      meta[row.sync_key] = row.updated_at;
    } catch {
      /* skip corrupt */
    }
  }
  return { data, meta, serverTime: new Date().toISOString() };
}

export function putUserSync(userId, syncKey, payload, { clientUpdatedAt } = {}) {
  if (!SYNC_KEYS.includes(syncKey)) {
    return { ok: false, error: "invalid_sync_key" };
  }
  const existing = getDb()
    .prepare("SELECT updated_at, data_json FROM user_sync WHERE user_id = ? AND sync_key = ?")
    .get(userId, syncKey);

  if (existing?.updated_at && clientUpdatedAt && clientUpdatedAt < existing.updated_at) {
    return {
      ok: false,
      conflict: true,
      serverData: JSON.parse(existing.data_json),
      serverUpdatedAt: existing.updated_at,
    };
  }

  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO user_sync (user_id, sync_key, data_json, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, sync_key) DO UPDATE SET data_json = excluded.data_json, updated_at = excluded.updated_at`
    )
    .run(userId, syncKey, JSON.stringify(payload), now);
  return { ok: true, updatedAt: now };
}

export function bulkPutUserSync(userId, bundles = {}) {
  const results = {};
  for (const [key, value] of Object.entries(bundles)) {
    results[key] = putUserSync(userId, key, value.data, { clientUpdatedAt: value.updatedAt });
  }
  return results;
}
