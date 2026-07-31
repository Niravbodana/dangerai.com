import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchRecipeSuggestions } from "../api";
import { IconArrowRight } from "./Icons";

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function RecipeSearch({ className = "", large = false }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounce(query);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!debounced.trim()) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    fetchRecipeSuggestions(debounced)
      .then((data) => setSuggestions(data.suggestions || []))
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false));
  }, [debounced]);

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
        <input
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Enter" && goSearch()}
          placeholder="Search any recipe — biryani, dosa, paneer..."
          className={`glass-input w-full pr-28 ${large ? "py-4 text-base" : "py-3"}`}
        />
        <button
          type="button"
          onClick={() => goSearch()}
          className="premium-btn absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-2 text-xs sm:text-sm"
        >
          Search
        </button>
      </div>

      {open && query.trim() && (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#1c1814]/95 shadow-2xl backdrop-blur-xl">
          {loading ? (
            <p className="px-4 py-3 text-sm text-[var(--text-secondary)]">Searching...</p>
          ) : suggestions.length === 0 ? (
            <p className="px-4 py-3 text-sm text-[var(--text-secondary)]">No matches — press Enter to search all</p>
          ) : (
            <ul>
              {suggestions.map((r) => (
                <li key={r.id}>
                  <Link
                    to={`/recipe/${r.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/5"
                  >
                    <img src={r.image} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">{r.name}</p>
                      <p className="text-xs capitalize text-[var(--text-secondary)]">{r.cuisine} · {r.cookTime} min</p>
                    </div>
                    {r.rating?.average > 0 && (
                      <span className="text-xs text-[var(--accent-soft)]">★ {r.rating.average}</span>
                    )}
                    <IconArrowRight className="h-4 w-4 shrink-0 text-[var(--text-secondary)]" />
                  </Link>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => goSearch()}
                  className="w-full border-t border-white/10 px-4 py-3 text-left text-sm font-medium text-[var(--accent-soft)] hover:bg-white/5"
                >
                  See all results for "{query}"
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
