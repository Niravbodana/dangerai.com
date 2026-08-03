import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { invalidateSiteConfig } from "../context/SiteConfigContext.jsx";
import { clearProvidersCache } from "../lib/groceryProviders.js";

const API = "/api/admin";
const TOKEN_STORAGE = "rasoira_admin_token";

function adminFetch(path, options = {}) {
  const token = localStorage.getItem(TOKEN_STORAGE) || "";
  return fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options.headers || {}),
    },
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem(TOKEN_STORAGE);
    }
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
  });
}

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "partners", label: "Partners" },
  { id: "social", label: "Social & Links" },
  { id: "payments", label: "Payments" },
  { id: "quality", label: "Quality" },
  { id: "bugfixer", label: "Bug Fixer" },
];

function Field({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div>
      <label className="text-xs font-medium text-[var(--text-secondary)]">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm"
      />
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export default function Admin() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [dashboard, setDashboard] = useState(null);
  const [issues, setIssues] = useState([]);
  const [config, setConfig] = useState(null);
  const [bugReport, setBugReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const [dash, iss, cfg] = await Promise.all([
        adminFetch("/dashboard"),
        adminFetch("/recipes/issues?type=all"),
        adminFetch("/config"),
      ]);
      setDashboard(dash);
      setIssues(iss.recipes || []);
      setConfig(cfg.config);
      setAuthed(true);
    } catch (err) {
      setAuthed(false);
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (localStorage.getItem(TOKEN_STORAGE)) load();
  }, [load]);

  const doLogin = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      localStorage.setItem(TOKEN_STORAGE, data.token);
      setPassword("");
      await load();
    } catch (err) {
      setAuthed(false);
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE);
    setAuthed(false);
    setDashboard(null);
    setConfig(null);
    setMessage("Logged out");
  };

  const runGuardian = async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/guardian/run", { method: "POST", body: JSON.stringify({ fix: true }) });
      setMessage(`Guardian: ${res.report?.photosFixed || 0} photos, ${res.report?.ingredientsFixed || 0} ingredients fixed`);
      await load();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const runBugFixer = async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/bug-guardian/run", { method: "POST", body: JSON.stringify({ fix: true }) });
      setBugReport(res.report);
      const fixes = res.report?.fixes?.length || 0;
      setMessage(`Bug Fixer: ${res.report?.issueCount || 0} issues found, ${fixes} auto-fix runs`);
      await load();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fixRecipe = async (id) => {
    setLoading(true);
    try {
      const res = await adminFetch(`/recipes/${id}/fix`, { method: "POST" });
      if (res.photoFixed) {
        setMessage(`Photo fixed: ${id}`);
      } else if (res.semantic?.ok) {
        setMessage(`Ingredients OK for ${id}, but photo fix failed${res.photoError ? `: ${res.photoError}` : ""}`);
      } else {
        setMessage(`Fix incomplete for ${id}${res.photoError ? ` — ${res.photoError}` : ""}`);
      }
      await load();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/config", { method: "PUT", body: JSON.stringify(config) });
      setConfig(res.config);
      invalidateSiteConfig();
      clearProvidersCache();
      setMessage("Config saved — live on site");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updatePartner = (id, patch) => {
    setConfig((c) => ({
      ...c,
      partners: { ...c.partners, [id]: { ...c.partners[id], ...patch } },
    }));
  };

  const updateSocial = (field, value) => {
    setConfig((c) => ({ ...c, social: { ...c.social, [field]: value } }));
  };

  const updateSite = (field, value) => {
    setConfig((c) => ({ ...c, site: { ...c.site, [field]: value } }));
  };

  const updateRazorpay = (field, value) => {
    setConfig((c) => ({
      ...c,
      payments: {
        ...c.payments,
        razorpay: { ...c.payments?.razorpay, [field]: value },
      },
    }));
  };

  const updatePlan = (planId, field, value) => {
    setConfig((c) => ({
      ...c,
      payments: {
        ...c.payments,
        razorpay: {
          ...c.payments?.razorpay,
          plans: {
            ...c.payments?.razorpay?.plans,
            [planId]: { ...c.payments?.razorpay?.plans?.[planId], [field]: value },
          },
        },
      },
    }));
  };

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-[var(--text-primary)]">Rasoira Admin</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Partners, payments, social links, quality & bug fixer — sab yahan se
          </p>
        </div>
        <Link to="/recipes" className="text-sm text-[var(--accent-soft)] hover:underline">
          ← Back to recipes
        </Link>
      </div>

      {!authed ? (
        <form onSubmit={doLogin} className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 max-w-md">
          <h2 className="font-display text-xl text-[var(--text-primary)]">Admin Login</h2>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">Rasoira admin panel — alag login</p>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)]">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)]">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-xl bg-[var(--accent)] py-2.5 text-sm font-medium text-[#14110e] disabled:opacity-50"
          >
            {loading ? "Logging in…" : "Login"}
          </button>
          {message && <p className="mt-3 text-xs text-red-300">{message}</p>}
        </form>
      ) : (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="text-sm text-[var(--text-secondary)]">
            Logged in as <span className="text-[var(--text-primary)]">{username}</span>
          </p>
          <button type="button" onClick={logout} className="text-xs text-[var(--accent-soft)] hover:underline">
            Logout
          </button>
        </div>
      )}

      {message && authed && <p className="mb-4 text-xs text-amber-300">{message}</p>}

      {authed && config && (
        <>
          <div className="mb-6 flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-xl px-4 py-2 text-sm ${tab === t.id ? "bg-[var(--accent)] text-[#14110e]" : "border border-white/15"}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "dashboard" && dashboard && (
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
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={runGuardian} disabled={loading} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-50">
                  Run Quality Guardian
                </button>
                <button type="button" onClick={runBugFixer} disabled={loading} className="rounded-xl bg-violet-600 px-4 py-2 text-sm text-white disabled:opacity-50">
                  Run Bug Fixer
                </button>
                <button type="button" onClick={load} disabled={loading} className="rounded-xl border border-white/15 px-4 py-2 text-sm">
                  Refresh
                </button>
              </div>
            </>
          )}

          {tab === "partners" && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Instamart, Blinkit, Zepto, Zomato — enable/disable aur Coming Soon toggle karein. URL template mein {"{query}"} use karein.
              </p>
              {Object.entries(config.partners || {}).map(([id, p]) => (
                <div key={id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                  <h3 className="font-medium text-[var(--text-primary)]">{p.name || id}</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Name" value={p.name} onChange={(v) => updatePartner(id, { name: v })} />
                    <Field label="Type (grocery/delivery)" value={p.type} onChange={(v) => updatePartner(id, { type: v })} />
                    <Field
                      label="Search URL template"
                      value={p.searchUrlTemplate}
                      onChange={(v) => updatePartner(id, { searchUrlTemplate: v })}
                      placeholder="https://blinkit.com/s/?q={query}"
                    />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Toggle label="Enabled" checked={p.enabled !== false} onChange={(v) => updatePartner(id, { enabled: v })} />
                    <Toggle label="Coming Soon" checked={Boolean(p.comingSoon)} onChange={(v) => updatePartner(id, { comingSoon: v })} />
                  </div>
                </div>
              ))}
              <button type="button" onClick={saveConfig} disabled={loading} className="rounded-xl bg-[var(--accent)] px-6 py-2 text-sm font-medium text-[#14110e]">
                Save Partners
              </button>
            </div>
          )}

          {tab === "social" && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">Instagram, WhatsApp, support email — footer aur site par dikhega.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {["instagram", "youtube", "whatsapp", "twitter", "facebook", "telegram"].map((field) => (
                  <Field
                    key={field}
                    label={field.charAt(0).toUpperCase() + field.slice(1)}
                    value={config.social?.[field]}
                    onChange={(v) => updateSocial(field, v)}
                    placeholder={`https://${field}.com/...`}
                  />
                ))}
              </div>
              <h3 className="pt-4 font-medium text-[var(--text-primary)]">Site links</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Support email" value={config.site?.supportEmail} onChange={(v) => updateSite("supportEmail", v)} />
                <Field label="Support phone" value={config.site?.supportPhone} onChange={(v) => updateSite("supportPhone", v)} />
                <Field label="Website URL" value={config.site?.websiteUrl} onChange={(v) => updateSite("websiteUrl", v)} />
                <Field label="Privacy URL" value={config.site?.privacyUrl} onChange={(v) => updateSite("privacyUrl", v)} />
                <Field label="Terms URL" value={config.site?.termsUrl} onChange={(v) => updateSite("termsUrl", v)} />
              </div>
              <button type="button" onClick={saveConfig} disabled={loading} className="rounded-xl bg-[var(--accent)] px-6 py-2 text-sm font-medium text-[#14110e]">
                Save Social & Links
              </button>
            </div>
          )}

          {tab === "payments" && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Razorpay keys yahan set karein. Key Secret sirf server par rahega — public site par nahi dikhega.
              </p>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                <Toggle
                  label="Razorpay enabled"
                  checked={Boolean(config.payments?.razorpay?.enabled)}
                  onChange={(v) => updateRazorpay("enabled", v)}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Mode (test/live)" value={config.payments?.razorpay?.mode} onChange={(v) => updateRazorpay("mode", v)} />
                  <Field label="Key ID (public)" value={config.payments?.razorpay?.keyId} onChange={(v) => updateRazorpay("keyId", v)} placeholder="rzp_test_..." />
                  <Field
                    label={`Key Secret ${config.payments?.razorpay?.hasKeySecret ? "(saved — enter new to replace)" : ""}`}
                    value={config.payments?.razorpay?.keySecret || ""}
                    onChange={(v) => updateRazorpay("keySecret", v)}
                    type="password"
                    placeholder="Enter Razorpay secret"
                  />
                  <Field
                    label={`Webhook Secret ${config.payments?.razorpay?.hasWebhookSecret ? "(saved)" : ""}`}
                    value={config.payments?.razorpay?.webhookSecret || ""}
                    onChange={(v) => updateRazorpay("webhookSecret", v)}
                    type="password"
                  />
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  Webhook URL: <code className="text-amber-200">/api/payments/webhook</code>
                </p>
              </div>

              {["plus", "family"].map((planId) => {
                const plan = config.payments?.razorpay?.plans?.[planId] || {};
                return (
                  <div key={planId} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                    <h3 className="font-medium capitalize">{planId} plan</h3>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Field label="Name" value={plan.name} onChange={(v) => updatePlan(planId, "name", v)} />
                      <Field label="Display price (₹)" value={plan.displayPrice} onChange={(v) => updatePlan(planId, "displayPrice", Number(v))} type="number" />
                      <Field label="Amount (paise)" value={plan.amount} onChange={(v) => updatePlan(planId, "amount", Number(v))} type="number" />
                    </div>
                  </div>
                );
              })}
              <button type="button" onClick={saveConfig} disabled={loading} className="rounded-xl bg-[var(--accent)] px-6 py-2 text-sm font-medium text-[#14110e]">
                Save Payment Config
              </button>
            </div>
          )}

          {tab === "quality" && (
            <div className="rounded-2xl border border-white/10 overflow-hidden">
              <div className="border-b border-white/10 bg-white/[0.04] px-4 py-3 flex justify-between items-center">
                <span className="text-sm font-medium">Recipes needing attention ({issues.length})</span>
                <button type="button" onClick={runGuardian} disabled={loading} className="rounded-lg bg-emerald-600 px-3 py-1 text-xs text-white">
                  Auto-fix all
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto divide-y divide-white/5">
                {issues.length === 0 ? (
                  <p className="p-6 text-sm text-[var(--text-secondary)]">All recipes look good.</p>
                ) : (
                  issues.map((r) => (
                    <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                      <div>
                        <p className="font-medium">{r.name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {!r.ingredientOk && `Ingredients: ${r.ingredientIssues?.map((i) => i.ingredient).join(", ")}`}
                          {!r.photoOk && ` · Photo: ${r.photoIssue}`}
                        </p>
                      </div>
                      <button type="button" onClick={() => fixRecipe(r.id)} className="rounded-lg bg-white/10 px-3 py-1 text-xs">
                        Fix now
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {tab === "bugfixer" && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Full site scan — backend health, partner links, recipe quality sample, auto-fix photos & ingredients.
              </p>
              <button type="button" onClick={runBugFixer} disabled={loading} className="rounded-xl bg-violet-600 px-6 py-2 text-sm text-white disabled:opacity-50">
                Run Full Bug Fixer
              </button>
              {bugReport && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm space-y-3">
                  <p>
                    Status:{" "}
                    <span className={bugReport.healthy ? "text-emerald-400" : "text-amber-300"}>
                      {bugReport.healthy ? "Healthy" : `${bugReport.issueCount} issues`}
                    </span>
                  </p>
                  <ul className="space-y-1 text-xs text-[var(--text-secondary)]">
                    {(bugReport.issues || []).map((issue, i) => (
                      <li key={i}>
                        [{issue.severity}] {issue.message}
                      </li>
                    ))}
                  </ul>
                  {bugReport.fixes?.length > 0 && (
                    <p className="text-xs text-emerald-400">
                      Auto-fixes: {JSON.stringify(bugReport.fixes)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
