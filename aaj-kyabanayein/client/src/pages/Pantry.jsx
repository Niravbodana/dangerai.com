import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPantryItems, suggestFromPantry } from "../api";
import { useLanguage } from "../context/LanguageContext";
import RecipeCard from "../components/RecipeCard";
import {
  buildGroceryWhatsAppText,
  clearPantry,
  getExpired,
  getExpiringSoon,
  getLocalPantryAnalytics,
  getLowStock,
  getPantryPayload,
  loadPantry,
  openWhatsAppShare,
  removePantryItem,
  upsertPantryItem,
} from "../lib/pantryStore";
import { fetchRestockSuggestions, isProviderComingSoon } from "../lib/groceryProviders";
import { track } from "../lib/analytics";

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-[var(--text-primary)] text-[var(--cream-light)]"
          : "glass text-[var(--text-secondary)] hover:bg-white/50"
      }`}
    >
      {children}
    </button>
  );
}

export default function Pantry() {
  const { t } = useLanguage();
  const [catalog, setCatalog] = useState([]);
  const [items, setItems] = useState(loadPantry);
  const [diet, setDiet] = useState("veg");
  const [mealType, setMealType] = useState("");
  const [pantryOnly, setPantryOnly] = useState(false);
  const [budgetMode, setBudgetMode] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [grocery, setGrocery] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [qtyDraft, setQtyDraft] = useState({});
  const [expiryDraft, setExpiryDraft] = useState({});

  const [restock, setRestock] = useState([]);
  const [groceryMsg, setGroceryMsg] = useState("");

  const showComingSoon = (name) => {
    setGroceryMsg(`${name} — Coming Soon! Abhi WhatsApp list use karein.`);
    setTimeout(() => setGroceryMsg(""), 4000);
  };

  useEffect(() => {
    fetchPantryItems().then((data) => setCatalog(data.items || []));
    fetchRestockSuggestions(loadPantry()).then(setRestock);
  }, []);

  useEffect(() => {
    fetchRestockSuggestions(items).then(setRestock);
  }, [items]);

  const refresh = () => setItems(loadPantry());

  const addOrUpdate = (item) => {
    const quantity = qtyDraft[item.key] || "1";
    const expiry = expiryDraft[item.key] || "";
    upsertPantryItem({
      key: item.key,
      label: item.label,
      labelHi: item.labelHi,
      quantity,
      expiry,
    });
    refresh();
  };

  const isSelected = (key) => items.some((i) => i.key === key);

  const handleSuggest = async () => {
    const payload = getPantryPayload();
    if (payload.ingredients.length === 0) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await suggestFromPantry({
        ingredients: payload.ingredients,
        expiringKeys: payload.expiringKeys,
        diet,
        mealType: mealType || undefined,
        pantryOnly,
        budget: budgetMode ? "low" : undefined,
        limit: 24,
        includeAnalytics: true,
        includeGrocery: true,
      });
      setSuggestions(data.suggestions || []);
      setAnalytics(data.analytics || null);
      setGrocery(data.grocery || []);
      track("pantry_suggest", {
        count: payload.ingredients.length,
        results: data.suggestions?.length || 0,
        pantryOnly,
        budget: budgetMode,
      });
    } catch {
      setSuggestions([]);
      setAnalytics(null);
      setGrocery([]);
    } finally {
      setLoading(false);
    }
  };

  const expiring = getExpiringSoon(3);
  const expired = getExpired();
  const lowStock = getLowStock(1);
  const localStats = getLocalPantryAnalytics();

  const shareGrocery = () => {
    const text = buildGroceryWhatsAppText(
      items.map((i) => ({ nameHi: i.labelHi, name: i.label, quantity: `${i.quantity}${i.unit ? ` ${i.unit}` : ""}` }))
    );
    openWhatsAppShare(text);
    track("grocery_whatsapp");
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="font-display text-3xl text-[var(--text-primary)]">{t("tryPantry")}</h1>
        <p className="mb-2 text-[var(--text-secondary)]">
          Quantity + expiry ke saath smart pantry — jo pada hai usi se recipes.
        </p>
        {groceryMsg && (
          <p className="mb-3 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-2 text-sm text-[var(--accent-soft)]">
            {groceryMsg}
          </p>
        )}

        {restock.length > 0 && (
          <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <p className="text-sm font-medium text-[var(--text-primary)]">Auto-restock suggestions</p>
            <ul className="mt-2 space-y-2 text-sm">
              {restock.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span>{s.nameHi || s.name} — {s.reason === "missing" ? "missing" : "low stock"}</span>
                  <div className="flex gap-1">
                    {s.providers?.slice(0, 3).map((p) => (
                      p.comingSoon || isProviderComingSoon(p.id) ? (
                        <span
                          key={p.id}
                          className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-[var(--text-secondary)]"
                          title="Coming soon"
                        >
                          {p.name} · Soon
                        </span>
                      ) : (
                        <a
                          key={p.id}
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-[var(--accent-soft)]"
                        >
                          {p.name}
                        </a>
                      )
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(expiring.length > 0 || expired.length > 0 || lowStock.length > 0) && (
          <div className="mb-4 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--accent-soft)]">
            {expired.length > 0 && <p>⚠️ {expired.length} item(s) expired — use or remove.</p>}
            {expiring.length > 0 && <p>⏰ {expiring.length} item(s) expiring in 3 days.</p>}
            {lowStock.length > 0 && <p>📉 {lowStock.length} item(s) low stock — restock soon.</p>}
          </div>
        )}

        {items.length > 0 && (
          <p className="mb-4 text-xs text-[var(--text-secondary)]">
            Pantry: {localStats.totalItems} items · {localStats.withExpiry} with expiry · {localStats.lowStock} low stock
          </p>
        )}

        <div className="glass-strong mb-6 rounded-2xl p-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Diet</h3>
          <div className="mb-5 flex gap-2">
            <Chip active={diet === "veg"} onClick={() => setDiet("veg")}>{t("veg")}</Chip>
            <Chip active={diet === "non-veg"} onClick={() => setDiet("non-veg")}>{t("nonVeg")}</Chip>
          </div>

          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Meal</h3>
          <div className="mb-5 flex flex-wrap gap-2">
            {["", "breakfast", "lunch", "dinner", "snack"].map((type) => (
              <Chip key={type || "all"} active={mealType === type} onClick={() => setMealType(type)}>
                {type || t("allCuisines")}
              </Chip>
            ))}
          </div>

          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Smart filters</h3>
          <div className="mb-5 flex flex-wrap gap-2">
            <Chip active={pantryOnly} onClick={() => setPantryOnly((v) => !v)}>Pantry only</Chip>
            <Chip active={budgetMode} onClick={() => setBudgetMode((v) => !v)}>Budget meals</Chip>
          </div>

          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Your pantry ({items.length})
          </h3>
          {items.length > 0 && (
            <ul className="mb-5 space-y-2">
              {items.map((i) => (
                <li key={i.key} className="ingredient-note items-center">
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-[var(--text-primary)]">{i.labelHi} ({i.label})</span>
                    <span className="ingredient-note__qty">
                      Qty: {i.quantity}{i.expiry ? ` · Expiry: ${i.expiry}` : ""}
                    </span>
                  </div>
                  <button type="button" onClick={() => { removePantryItem(i.key); refresh(); }} className="text-xs text-red-300">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Add items</h3>
          <div className="space-y-3">
            {catalog.map((item) => (
              <div key={item.key} className="flex flex-wrap items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] p-3">
                <span className="min-w-[7rem] text-sm text-[var(--text-primary)]">
                  {item.labelHi} <span className="text-[var(--text-secondary)]">({item.label})</span>
                </span>
                <input
                  type="text"
                  placeholder="Qty"
                  value={qtyDraft[item.key] || ""}
                  onChange={(e) => setQtyDraft((p) => ({ ...p, [item.key]: e.target.value }))}
                  className="glass-input w-20 py-1.5 text-xs"
                />
                <input
                  type="date"
                  value={expiryDraft[item.key] || ""}
                  onChange={(e) => setExpiryDraft((p) => ({ ...p, [item.key]: e.target.value }))}
                  className="glass-input py-1.5 text-xs"
                />
                <button
                  type="button"
                  onClick={() => addOrUpdate(item)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    isSelected(item.key) ? "bg-[var(--accent)] text-[#14110e]" : "border border-white/15 text-[var(--text-secondary)]"
                  }`}
                >
                  {isSelected(item.key) ? "Update" : "Add"}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={handleSuggest}
              disabled={loading || items.length === 0}
              className="premium-btn px-6 py-3 text-sm disabled:opacity-40"
            >
              {loading ? "Finding..." : "Find recipes"}
            </button>
            <button type="button" onClick={shareGrocery} disabled={items.length === 0} className="premium-btn-outline px-4 py-3 text-sm disabled:opacity-40">
              WhatsApp list
            </button>
            <button
              type="button"
              onClick={() => { showComingSoon("Instamart"); track("instamart_coming_soon"); }}
              disabled={items.length === 0}
              className="premium-btn-outline px-4 py-3 text-sm disabled:opacity-40"
            >
              Instamart · Soon
            </button>
            <button type="button" onClick={() => { clearPantry(); refresh(); }} className="px-3 py-3 text-xs text-[var(--text-secondary)]">
              Clear all
            </button>
          </div>
        </div>

        {searched && (
          <div>
            {analytics && (
              <div className="mb-6 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-[var(--text-secondary)]">
                <span className="font-medium text-[var(--text-primary)]">Pantry analytics: </span>
                {analytics.possibleRecipes} recipes possible · avg {analytics.avgMatchPercent}% match
                {analytics.topMissing?.length > 0 && (
                  <span> · Top missing: {analytics.topMissing.map((m) => m.ingredient).join(", ")}</span>
                )}
              </div>
            )}

            <h2 className="font-display text-xl text-[var(--text-primary)]">
              {suggestions.length} matching recipes
              {pantryOnly && " (pantry only)"}
              {budgetMode && " (budget)"}
            </h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {suggestions.map((recipe) => (
                <div key={recipe.id}>
                  <RecipeCard recipe={recipe} />
                  {recipe.matchPercent != null && (
                    <p className="mt-1 text-center text-xs text-[var(--accent-soft)]">
                      {recipe.matchPercent}% pantry match
                      {recipe.usesExpiring && " · uses expiring item"}
                    </p>
                  )}
                  {recipe.substitutions?.length > 0 && (
                    <p className="mt-1 text-center text-[10px] text-[var(--text-secondary)]">
                      Swap: {recipe.substitutions.map((s) => `${s.missing}→${s.substitute}`).join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
            {suggestions.length === 0 && (
              <p className="mt-6 text-center text-[var(--text-secondary)]">
                No matches — {pantryOnly ? "try turning off Pantry only" : <><Link to="/today" className="text-[var(--accent-soft)]">try Aaj Kya Banaye</Link></>}
              </p>
            )}

            {grocery.length > 0 && (
              <div className="mt-10 rounded-2xl border border-white/8 bg-white/[0.03] p-5">
                <h3 className="font-display text-lg text-[var(--text-primary)]">Smart grocery picks</h3>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">Buy these to unlock more recipes from your pantry</p>
                <ul className="mt-4 space-y-2">
                  {grocery.map((g) => (
                    <li key={g.ingredient} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="text-[var(--text-primary)] capitalize">{g.ingredient}</span>
                      <span className="text-xs text-[var(--text-secondary)]">
                        unlocks {g.recipesUnlocked} recipe{g.recipesUnlocked > 1 ? "s" : ""}
                        {g.substitute && ` · or use ${g.substitute}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => showComingSoon("Instamart")}
                        className="text-xs text-[var(--text-secondary)]"
                      >
                        Buy · Soon
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
