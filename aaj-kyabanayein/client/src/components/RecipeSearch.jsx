import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchRecipeSuggestions } from "../api";
import { useLanguage } from "../context/LanguageContext";
import RecipeImage from "./RecipeImage";
import { IconArrowRight, IconSearch } from "./Icons";

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function RecipeSearch({ className = "", large = false, autoFocus = false }) {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestType, setSuggestType] = useState("popular");
  const debounced = useDebounce(query);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchRecipeSuggestions(debounced)
      .then((data) => {
        setSuggestions(data.suggestions || []);
        setSuggestType(data.type || (debounced ? "search" : "popular"));
      })
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false));
  }, [debounced, open]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const goSearch = (q) => {
    const term = q || query;
    if (!term.trim()) return;
    setOpen(false);
    navigate(`/recipes?search=${encodeURIComponent(term.trim())}`);
  };

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <div className="relative">
        <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
        <input
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Enter" && goSearch()}
          placeholder="Search biryani, dosa, paneer, pasta..."
          autoFocus={autoFocus}
          className={`glass-input w-full pl-11 pr-28 ${large ? "py-4 text-base" : "py-3"}`}
        />
        <button
          type="button"
          onClick={() => goSearch()}
          className="premium-btn absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-2 text-xs sm:text-sm"
        >
          Search
        </button>
      </div>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#1c1814]/98 shadow-2xl backdrop-blur-xl">
          <p className="border-b border-white/8 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            {suggestType === "popular" ? "Popular recipes" : `Results for "${query}"`}
          </p>
          {loading ? (
            <p className="px-4 py-4 text-sm text-[var(--text-secondary)]">Searching...</p>
          ) : suggestions.length === 0 ? (
            <p className="px-4 py-4 text-sm text-[var(--text-secondary)]">
              {query.trim() ? "No matches — press Enter to search all" : "Type a recipe name to search"}
            </p>
          ) : (
            <ul>
              {suggestions.map((r) => (
                <li key={r.id}>
                  <Link
                    to={`/recipe/${r.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/5"
                  >
                    <RecipeImage
                      src={r.imageUrl || `/api/recipes/image/${r.id}`}
                      recipeId={r.id}
                      alt={r.name}
                      className="h-12 w-12 shrink-0 rounded-lg object-cover bg-[#242018]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                        {lang === "hi" ? (r.nameHi || r.name) : r.name}
                      </p>
                      <p className="text-xs capitalize text-[var(--text-secondary)]">
                        {r.cuisine} · {r.cookTime} min
                      </p>
                    </div>
                    {r.rating?.average > 0 && (
                      <span className="text-xs text-[var(--accent-soft)]">★ {r.rating.average}</span>
                    )}
                    <IconArrowRight className="h-4 w-4 shrink-0 text-[var(--text-secondary)]" />
                  </Link>
                </li>
              ))}
              {query.trim() && (
                <li>
                  <button
                    type="button"
                    onClick={() => goSearch()}
                    className="w-full border-t border-white/10 px-4 py-3 text-left text-sm font-medium text-[var(--accent-soft)] hover:bg-white/5"
                  >
                    See all results for &ldquo;{query}&rdquo;
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
