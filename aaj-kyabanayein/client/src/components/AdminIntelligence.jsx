import { useCallback, useEffect, useState } from "react";

const INTEL_API = "/api/admin/intelligence";

function intelFetch(path, options = {}) {
  const token = localStorage.getItem("rasoira_admin_token") || "";
  return fetch(`${INTEL_API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options.headers || {}),
    },
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
  });
}

export default function AdminIntelligence({ onMessage }) {
  const [dash, setDash] = useState(null);
  const [queue, setQueue] = useState([]);
  const [sources, setSources] = useState([]);
  const [audit, setAudit] = useState([]);
  const [research, setResearch] = useState(null);
  const [researchAudit, setResearchAudit] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [pipeline, setPipeline] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [agentData, setAgentData] = useState(null);
  const [subTab, setSubTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, q, s, a, j, p, ing, ag] = await Promise.all([
        intelFetch("/dashboard"),
        intelFetch("/review-queue?status=pending&limit=30"),
        intelFetch("/sources"),
        intelFetch("/audit-log?limit=30"),
        intelFetch("/jobs"),
        intelFetch("/pipeline/status"),
        intelFetch("/ingredients?limit=20"),
        intelFetch("/enterprise/agents?limit=20"),
      ]);
      setDash(d);
      setQueue(q.items || []);
      setSources(s.sources || []);
      setAudit(a.log || []);
      setJobs(j.jobs || []);
      setPipeline(p);
      setIngredients(ing.items || []);
      setAgentData(ag);
      setResearch(d.research || null);
    } catch (err) {
      onMessage?.(err.message);
    } finally {
      setLoading(false);
    }
  }, [onMessage]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (recipeId) => {
    setLoading(true);
    try {
      await intelFetch(`/review-queue/${recipeId}/approve`, { method: "POST" });
      onMessage?.(`Approved: ${recipeId}`);
      await load();
    } catch (err) {
      onMessage?.(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reject = async (recipeId) => {
    setLoading(true);
    try {
      await intelFetch(`/review-queue/${recipeId}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: "Admin rejected" }),
      });
      onMessage?.(`Rejected: ${recipeId}`);
      await load();
    } catch (err) {
      onMessage?.(err.message);
    } finally {
      setLoading(false);
    }
  };

  const bulkApprove = async () => {
    const ids = queue.map((q) => q.recipe_id);
    if (!ids.length) return;
    setLoading(true);
    try {
      await intelFetch("/review-queue/bulk-approve", {
        method: "POST",
        body: JSON.stringify({ recipeIds: ids }),
      });
      onMessage?.(`Bulk approved ${ids.length} recipes`);
      await load();
    } catch (err) {
      onMessage?.(err.message);
    } finally {
      setLoading(false);
    }
  };

  const runPipeline = async () => {
    setLoading(true);
    try {
      const res = await intelFetch("/pipeline/run-sync", {
        method: "POST",
        body: JSON.stringify({ limit: 20, skipAi: true, skipNutrition: true }),
      });
      onMessage?.(`Pipeline: ${res.report?.imported || 0} imported, ${res.report?.failed || 0} failed`);
      await load();
    } catch (err) {
      onMessage?.(err.message);
    } finally {
      setLoading(false);
    }
  };

  const runEnterprise = async (dryRun = false) => {
    setLoading(true);
    try {
      const res = await intelFetch("/enterprise/run-sync", {
        method: "POST",
        body: JSON.stringify({ limit: 3, dryRun, minQualityScore: 60 }),
      });
      const r = res.report || {};
      onMessage?.(`Enterprise v2: ${r.generated || 0} generated, avg score ${r.avgQualityScore || 0}, ${r.rejected || 0} rejected`);
      await load();
    } catch (err) {
      onMessage?.(err.message);
    } finally {
      setLoading(false);
    }
  };
  const runPhase3Import = async (dryRun = false) => {
    setLoading(true);
    try {
      const res = await intelFetch("/phase3/import-sync", {
        method: "POST",
        body: JSON.stringify({ phase: 1, limit: 3, dryRun, minQualityScore: 70 }),
      });
      const r = res.report || {};
      onMessage?.(`Phase 3: ${r.imported || 0} imported, ${r.rejected || 0} rejected (popular recipes only)`);
      await load();
    } catch (err) {
      onMessage?.(err.message);
    } finally {
      setLoading(false);
    }
  };

  const processOneJob = async () => {
    setLoading(true);
    try {
      const res = await intelFetch("/jobs/process-one", { method: "POST" });
      onMessage?.(res.result?.processed ? `Job processed: ${res.result.jobType}` : "No pending jobs");
      await load();
    } catch (err) {
      onMessage?.(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadResearchAudit = async (recipeId) => {
    try {
      const res = await intelFetch(`/research/audit/${recipeId}`);
      setResearchAudit(res.trail || []);
    } catch (err) {
      onMessage?.(err.message);
    }
  };

  const preview = async (item) => {
    try {
      const res = await intelFetch(`/review-queue/${item.id}`);
      setSelected(res);
    } catch (err) {
      onMessage?.(err.message);
    }
  };

  const subTabs = [
    { id: "overview", label: "Overview" },
    { id: "phase3", label: "Phase 3 Import" },
    { id: "agents", label: "Agents" },
    { id: "research", label: "Research" },
    { id: "review", label: "Review Queue" },
    { id: "quality", label: "Quality" },
    { id: "ingredients", label: "Ingredients" },
    { id: "jobs", label: "Jobs" },
    { id: "pipeline", label: "Pipeline" },
    { id: "sources", label: "Sources" },
    { id: "audit", label: "Audit Log" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {subTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSubTab(t.id)}
            className={`rounded-full px-4 py-1.5 text-sm ${subTab === t.id ? "bg-emerald-600 text-white" : "bg-white/10"}`}
          >
            {t.label}
          </button>
        ))}
        <button
          type="button"
          onClick={runPipeline}
          disabled={loading}
          className="ml-auto rounded-full bg-amber-600 px-4 py-1.5 text-sm text-white disabled:opacity-50"
        >
          Run Pipeline (20)
        </button>
        <button
          type="button"
          onClick={() => runPhase3Import(false)}
          disabled={loading}
          className="rounded-full bg-rose-600 px-4 py-1.5 text-sm text-white disabled:opacity-50"
        >
          Phase 3 Import (3)
        </button>
      </div>

      {subTab === "overview" && dash && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Catalog Recipes" value={dash.search?.catalogRecipes} />
          <StatCard label="Intelligence DB" value={dash.intelligenceRecipes?.total} />
          <StatCard label="Pending Review" value={dash.review?.pending || 0} />
          <StatCard label="Approved" value={dash.intelligenceRecipes?.approved || 0} />
          <StatCard label="Jobs Pending" value={dash.jobs?.pending || 0} />
          <StatCard label="Postgres" value={dash.pipeline?.postgresConfigured ? "Yes" : "SQLite"} />
          <StatCard label="Research Seeds" value={dash.research?.seedsAvailable} />
          <StatCard label="Research Target" value={dash.research?.target?.toLocaleString?.() || "50,000"} />
          <StatCard label="Ingredients DB" value={dash.enterprise?.ingredients?.total} />
          <StatCard label="AI Agents" value={dash.enterprise?.agents?.length || 10} />
          <StatCard label="Phase 3 Curated" value={dash.phase3?.progress?.total} />
          <StatCard label="Phase 3 Imported" value={dash.phase3?.progress?.imported} />
        </div>
      )}

      {subTab === "phase3" && dash?.phase3 && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            India's most complete recipe library — curated popular recipes only. No random generation. Phase 1 imports most-searched dishes first.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Curated Recipes" value={dash.phase3.progress?.total} />
            <StatCard label="Phase 1 Ready" value={dash.phase3.phase1Ready} />
            <StatCard label="Imported" value={dash.phase3.progress?.imported} />
            <StatCard label="Total Target" value={dash.phase3.plan?.totalTarget?.toLocaleString?.()} />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => runPhase3Import(true)} disabled={loading} className="rounded-lg bg-white/10 px-3 py-1.5 text-sm">Dry Run (3)</button>
            <button type="button" onClick={() => runPhase3Import(false)} disabled={loading} className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm text-white">Import Popular (3)</button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase text-[var(--text-secondary)]">
                <tr>
                  <th className="p-2">Cuisine/Category</th>
                  <th className="p-2">Target</th>
                  <th className="p-2">Curated</th>
                  <th className="p-2">Imported</th>
                  <th className="p-2">Gap</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {(dash.phase3.plan?.targets || []).slice(0, 15).map((t) => (
                  <tr key={t.key} className="border-t border-white/5">
                    <td className="p-2 capitalize">{t.key.replace(/-/g, " ")}</td>
                    <td className="p-2">{t.target}</td>
                    <td className="p-2">{t.curatedInManifest}</td>
                    <td className="p-2">{t.imported}</td>
                    <td className="p-2">{t.gap}</td>
                    <td className="p-2 text-xs">{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-xl border border-rose-500/20 bg-rose-950/10 p-3">
            <div className="mb-2 text-sm font-semibold">Phase 1 Top Priority</div>
            <div className="flex flex-wrap gap-2 text-xs">
              {(dash.phase3.plan?.phase1Top20 || []).map((r) => (
                <span key={r.id} className="rounded-full bg-white/10 px-2 py-0.5">{r.name} ({r.cuisine})</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {subTab === "agents" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {(agentData?.agents || dash?.enterprise?.agents || []).map((name) => (
              <div key={name} className="rounded-xl border border-indigo-500/20 bg-indigo-950/10 p-3 text-xs">
                <div className="font-semibold text-indigo-300">{name.replace(/_/g, " ")}</div>
                <div className="mt-1 text-[var(--text-secondary)]">
                  runs: {agentData?.stats?.byAgent?.find((a) => a.agent_name === name)?.runs || 0}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => runEnterprise(true)} disabled={loading} className="rounded-lg bg-white/10 px-3 py-1.5 text-sm">Dry Run</button>
            <button type="button" onClick={() => runEnterprise(false)} disabled={loading} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white">Generate (3)</button>
          </div>
          <div className="max-h-64 space-y-1 overflow-y-auto text-xs font-mono">
            {(agentData?.runs || []).map((r) => (
              <div key={r.id} className="rounded border border-white/5 p-2">
                <span className="text-indigo-300">{r.agent_name}</span> · {r.recipe_id} · conf {Math.round((r.confidence || 0) * 100)}% · {r.status}
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === "research" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Target Recipes" value={research?.target?.toLocaleString?.() || "50,000"} />
            <StatCard label="Seeds Available" value={research?.seedsAvailable} />
            <StatCard label="Cuisines" value={research?.cuisines} />
            <StatCard label="Dish Patterns" value={research?.dishPatterns} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => runResearch(true)} disabled={loading} className="rounded-lg bg-white/10 px-3 py-1.5 text-sm">
              Dry Run (5)
            </button>
            <button type="button" onClick={() => runResearch(false)} disabled={loading} className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm text-white">
              Generate & Queue (5)
            </button>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Research pipeline generates original recipes from factual knowledge only. Every recipe enters the review queue with full audit trail.
          </p>
          {researchAudit.length > 0 && (
            <div className="rounded-xl border border-violet-500/30 bg-violet-950/20 p-3">
              <div className="mb-2 text-sm font-semibold">Recipe Audit Trail</div>
              <div className="max-h-48 space-y-1 overflow-y-auto text-xs font-mono">
                {researchAudit.map((e) => (
                  <div key={e.id} className="rounded border border-white/5 p-2">
                    <span className="text-violet-300">{e.event_type}</span> · {e.nutrition_status} · {e.verification_status} · {e.created_at}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {subTab === "review" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button type="button" onClick={bulkApprove} disabled={!queue.length || loading} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white disabled:opacity-50">
              Bulk Approve ({queue.length})
            </button>
            <button type="button" onClick={load} className="rounded-lg bg-white/10 px-3 py-1.5 text-sm">
              Refresh
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase text-[var(--text-secondary)]">
                <tr>
                  <th className="p-2">Recipe</th>
                  <th className="p-2">Score</th>
                  <th className="p-2">Nutrition</th>
                  <th className="p-2">Dup %</th>
                  <th className="p-2">License</th>
                  <th className="p-2">Image</th>
                  <th className="p-2">Issues</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((item) => (
                  <tr key={item.id} className="border-t border-white/5">
                    <td className="p-2">
                      <button type="button" className="text-left text-emerald-400 underline" onClick={() => preview(item)}>
                        {item.preview?.title || item.recipe_id}
                      </button>
                    </td>
                    <td className="p-2">{item.qualityScore ?? item.preview?.qualityScore ?? "—"}</td>
                    <td className="p-2">{item.nutritionStatus || "—"}</td>
                    <td className="p-2">{Math.round((item.duplicate_score || 0) * 100)}%</td>
                    <td className="p-2">{item.license_status}</td>
                    <td className="p-2">{item.image_license_status}</td>
                    <td className="p-2 text-xs text-amber-300">{(item.qualityIssues || []).length}</td>
                    <td className="p-2 space-x-1">
                      <button type="button" onClick={() => approve(item.recipe_id)} className="rounded bg-emerald-700 px-2 py-0.5 text-xs">Approve</button>
                      <button type="button" onClick={() => reject(item.recipe_id)} className="rounded bg-red-800 px-2 py-0.5 text-xs">Reject</button>
                      <button type="button" onClick={() => loadResearchAudit(item.recipe_id)} className="rounded bg-violet-800 px-2 py-0.5 text-xs">Audit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!queue.length && <p className="p-4 text-sm text-[var(--text-secondary)]">No pending reviews.</p>}
          </div>
        </div>
      )}

      {subTab === "quality" && (
        <div className="space-y-3">
          <p className="text-sm text-[var(--text-secondary)]">Quality score breakdown (0–100): ingredients 15%, nutrition 20%, instructions 15%, SEO 10%, license 15%, image 10%, duplicate 15%.</p>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase text-[var(--text-secondary)]">
                <tr>
                  <th className="p-2">Recipe</th>
                  <th className="p-2">Score</th>
                  <th className="p-2">Grade</th>
                  <th className="p-2">Nutrition</th>
                  <th className="p-2">Verification</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((item) => (
                  <tr key={item.id} className="border-t border-white/5">
                    <td className="p-2">{item.preview?.title || item.recipe_id}</td>
                    <td className="p-2 font-semibold">{item.qualityScore ?? item.preview?.qualityScore ?? "—"}</td>
                    <td className="p-2">{item.preview?.qualityGrade || "—"}</td>
                    <td className="p-2">{item.nutritionStatus}</td>
                    <td className="p-2">{item.verificationStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === "ingredients" && (
        <div className="space-y-3">
          <div className="text-sm text-[var(--text-secondary)]">
            Master ingredient database — {dash?.enterprise?.ingredients?.total || 0} records (target 1M+)
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {ingredients.map((ing) => (
              <div key={ing.id} className="rounded-xl border border-white/10 p-3 text-sm">
                <strong>{ing.englishName}</strong>
                <div className="text-xs text-[var(--text-secondary)]">{ing.hindiName} · {ing.category}</div>
                {ing.allergens?.length > 0 && <div className="text-xs text-amber-300">Allergens: {ing.allergens.join(", ")}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === "jobs" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button type="button" onClick={processOneJob} disabled={loading} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white">Process One Job</button>
            <StatCard label="Pending" value={dash?.jobs?.pending} />
          </div>
          <div className="max-h-64 space-y-1 overflow-y-auto text-xs font-mono">
            {jobs.map((j) => (
              <div key={j.id} className="rounded border border-white/5 p-2">
                {j.job_type} · {j.status} · attempts {j.attempts}
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === "pipeline" && pipeline && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Postgres" value={pipeline.postgresConfigured ? "Yes" : "SQLite"} />
          <StatCard label="Datasets" value={pipeline.registeredDatasets?.length} />
          <button type="button" onClick={runPipeline} disabled={loading} className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm text-white">Run Pipeline (20)</button>
        </div>
      )}

      {subTab === "sources" && (
        <div className="space-y-2">
          {sources.map((s) => (
            <div key={s.id} className="rounded-xl border border-white/10 p-3 text-sm">
              <div className="flex justify-between">
                <strong>{s.source_name}</strong>
                <span className={s.commercial_use_allowed ? "text-emerald-400" : "text-red-400"}>
                  {s.verification_status}
                </span>
              </div>
              <div className="text-xs text-[var(--text-secondary)]">
                {s.license_name} · commercial: {s.commercial_use_allowed ? "yes" : "no"}
              </div>
            </div>
          ))}
        </div>
      )}

      {subTab === "audit" && (
        <div className="max-h-96 space-y-1 overflow-y-auto text-xs font-mono">
          {audit.map((e) => (
            <div key={e.id} className="rounded border border-white/5 p-2">
              <span className="text-emerald-400">{e.action}</span> · {e.entity_type}/{e.entity_id} · {e.created_at}
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-sm">
          <div className="mb-2 flex justify-between">
            <strong>{selected.recipe?.title || selected.item?.recipe_id}</strong>
            <button type="button" onClick={() => setSelected(null)} className="text-xs underline">Close</button>
          </div>
          <p className="text-[var(--text-secondary)]">{selected.recipe?.introduction?.slice(0, 200)}</p>
          <div className="mt-2 grid gap-1 text-xs sm:grid-cols-3">
            <div>Cuisine: {selected.recipe?.cuisine}</div>
            <div>Calories: {selected.recipe?.calories}</div>
            <div>Source: {selected.recipe?.sourceName}</div>
            <div>License: {selected.recipe?.licenseName}</div>
            <div>Steps: {(selected.recipe?.steps || []).length}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="text-2xl font-semibold">{value ?? "—"}</div>
      <div className="text-xs text-[var(--text-secondary)]">{label}</div>
    </div>
  );
}
