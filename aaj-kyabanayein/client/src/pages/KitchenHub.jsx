import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  createHelper,
  deleteHelper,
  fetchHelpers,
  generateHelperLink,
  importRecipeUrl,
  fetchImportedRecipes,
  syncOnLogin,
} from "../api";

export default function KitchenHub() {
  const { user } = useAuth();
  const [helpers, setHelpers] = useState([]);
  const [importUrl, setImportUrl] = useState("");
  const [imported, setImported] = useState([]);
  const [helperName, setHelperName] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [msg, setMsg] = useState("");
  const [syncing, setSyncing] = useState(false);

  const refresh = async () => {
    if (!user) return;
    try {
      const [h, imp] = await Promise.all([fetchHelpers(), fetchImportedRecipes()]);
      setHelpers(h.helpers || []);
      setImported(imp.recipes || []);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    refresh();
  }, [user]);

  const addHelper = async () => {
    if (!helperName.trim()) return;
    await createHelper({ name: helperName.trim(), language: "hi" });
    setHelperName("");
    refresh();
  };

  const shareHelper = async (id) => {
    const res = await generateHelperLink(id);
    setShareUrl(res.shareUrl);
    if (navigator.clipboard) navigator.clipboard.writeText(res.shareUrl);
    setMsg("Helper link copied! Didi ko WhatsApp pe bhejein.");
  };

  const doImport = async () => {
    if (!importUrl.trim()) return;
    await importRecipeUrl(importUrl.trim());
    setImportUrl("");
    setMsg("Recipe link saved!");
    refresh();
  };

  const doSync = async () => {
    setSyncing(true);
    try {
      const res = await syncOnLogin();
      setMsg(res.ok ? `Synced: ${(res.keys || []).join(", ") || "pushed"}` : "Login required for sync");
    } finally {
      setSyncing(false);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-2xl">Kitchen Hub</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Maid mode, recipe import & cloud sync ke liye login karein.</p>
        <Link to="/?auth=login" className="premium-btn mt-4 inline-block px-4 py-2 text-sm">Login</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-3xl text-[var(--text-primary)]">Kitchen Hub</h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Maid instructions, recipe import, multi-device sync — Namak-style features, Rasoira quality.
      </p>

      {msg && <p className="mt-4 text-sm text-[var(--accent-soft)]">{msg}</p>}

      <section className="recipe-card mt-8 p-5">
        <h2 className="font-display text-lg">☁️ Cloud Sync</h2>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">Taste profile, family, pantry — phone aur laptop pe same.</p>
        <button type="button" onClick={doSync} disabled={syncing} className="premium-btn mt-3 px-4 py-2 text-sm">
          {syncing ? "Syncing..." : "Sync now"}
        </button>
      </section>

      <section className="recipe-card mt-6 p-5">
        <h2 className="font-display text-lg">👩‍🍳 Maid / Helper Mode</h2>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">Didi ko daily cooking instructions — Hindi mein, link se.</p>
        <div className="mt-3 flex gap-2">
          <input
            value={helperName}
            onChange={(e) => setHelperName(e.target.value)}
            placeholder="Helper name (e.g. Didi)"
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
          />
          <button type="button" onClick={addHelper} className="premium-btn px-4 py-2 text-sm">Add</button>
        </div>
        <ul className="mt-4 space-y-2">
          {helpers.map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm">
              <span>{h.name} · {h.language}</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => shareHelper(h.id)} className="text-[var(--accent-soft)] text-xs">Share link</button>
                <button type="button" onClick={() => deleteHelper(h.id).then(refresh)} className="text-red-400 text-xs">Remove</button>
              </div>
            </li>
          ))}
        </ul>
        {shareUrl && (
          <p className="mt-2 break-all text-xs text-[var(--text-secondary)]">{shareUrl}</p>
        )}
      </section>

      <section className="recipe-card mt-6 p-5">
        <h2 className="font-display text-lg">🔗 Recipe Import</h2>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">YouTube, Hebbars, blog — link paste karein (AMIYAA style).</p>
        <div className="mt-3 flex gap-2">
          <input
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            placeholder="https://youtube.com/..."
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
          />
          <button type="button" onClick={doImport} className="premium-btn px-4 py-2 text-sm">Save</button>
        </div>
        <ul className="mt-4 space-y-2">
          {imported.map((r) => (
            <li key={r.id} className="text-sm">
              <a href={r.sourceUrl} target="_blank" rel="noreferrer" className="text-[var(--accent-soft)] hover:underline">
                {r.name}
              </a>
              <span className="ml-2 text-xs text-[var(--text-secondary)]">({r.sourceType})</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
