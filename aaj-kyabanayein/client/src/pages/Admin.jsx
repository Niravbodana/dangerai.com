import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API = "/api/admin";
const KEY_STORAGE = "rasoira_admin_key";

function adminFetch(path, options = {}) {
  const key = localStorage.getItem(KEY_STORAGE) || "";
  return fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": key,
      ...(options.headers || {}),
    },
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
  });
}

export default function Admin() {
  const [key, setKey] = useState(localStorage.getItem(KEY_STORAGE) || "");
  const [authed, setAuthed] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const dash = await adminFetch("/dashboard");
      const iss = await adminFetch("/recipes/issues?type=all");
      setDashboard(dash);
      setIssues(iss.recipes || []);
      setAuthed(true);
    } catch (err) {
      setAuthed(false);
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (key) load();
  }, [key, load]);

  const saveKey = () => {
    localStorage.setItem(KEY_STORAGE, key.trim());
    load();
  };

  const runGuardian = async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/guardian/run", { method: "POST", body: JSON.stringify({ fix: true }) });
      setMessage(`Guardian done: ${res.report?.photosFixed || 0} photos fixed, ${res.report?.ingredientsFixed || 0} ingredients fixed`);
      await load();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fixRecipe = async (id) => {
    try {
      await adminFetch(`/recipes/${id}/fix`, { method: "POST" });
      setMessage(`Fixed ${id}`);
      await load();
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-[var(--text-primary)]">Rasoira Admin</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Quality control — ingredients, photos, auto-fix</p>
        </div>
        <Link to="/recipes" className="text-sm text-[var(--accent-soft)] hover:underline">
          ← Back to recipes
        </Link>
      </div>

      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <label className="text-xs font-medium text-[var(--text-secondary)]">Admin key (X-Admin-Key)</label>
        <div className="mt-2 flex gap-2">
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="ADMIN_SECRET from server .env"
            className="flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm"
          />
          <button type="button" onClick={saveKey} className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#14110e]">
            Connect
          </button>
        </div>
        {message && <p className="mt-2 text-xs text-amber-300">{message}</p>}
      </div>

      {authed && dashboard && (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-4">
            {[
              ["Total recipes", dashboard.totalRecipes],
              ["Ingredient issues", dashboard.ingredientIssues],
              ["Photo issues", dashboard.photoIssues],
              ["DB recipes", dashboard.dbRecipes],
            ].map(([label, val]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs text-[var(--text-secondary)]">{label}</p>
                <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{val}</p>
              </div>
            ))}
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={runGuardian}
              disabled={loading}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Run Quality Guardian (auto-fix)
            </button>
            <button type="button" onClick={load} disabled={loading} className="rounded-xl border border-white/15 px-4 py-2 text-sm">
              Refresh
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <div className="border-b border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium">
              Recipes needing attention ({issues.length})
            </div>
            <div className="max-h-[60vh] overflow-y-auto divide-y divide-white/5">
              {issues.length === 0 ? (
                <p className="p-6 text-sm text-[var(--text-secondary)]">All recipes look good.</p>
              ) : (
                issues.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{r.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {!r.ingredientOk && `Ingredients: ${r.ingredientIssues?.map((i) => i.ingredient).join(", ")}`}
                        {!r.photoOk && ` · Photo: ${r.photoIssue}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => fixRecipe(r.id)}
                      className="rounded-lg bg-white/10 px-3 py-1 text-xs hover:bg-white/15"
                    >
                      Fix now
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
