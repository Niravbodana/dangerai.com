import { useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchRecipeSuggestions } from "../api";
import { useLanguage } from "../context/LanguageContext";
import RecipeImage from "./RecipeImage";
import { IconArrowRight, IconSearch } from "./Icons";
import { addRecentSearch, clearRecentSearches, getRecentSearches } from "../lib/recentSearches";
import { track } from "../lib/analytics";
import useDebounce from "../hooks/useDebounce";

export default function RecipeSearch({ className = "", large = false }) {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [querySuggestions, setQuerySuggestions] = useState([]);
  const [trendingSearches, setTrendingSearches] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestType, setSuggestType] = useState("popular");
  const [matchType, setMatchType] = useState("recipe");
  const [recent, setRecent] = useState(getRecentSearches);
  const debounced = useDebounce(query, 220);
  const wrapRef = useRef(null);
  const listId = useId();
  const inputId = useId();

  useEffect(() => {
    if (!open) return;

    if (!debounced.trim()) {
      setLoading(true);
      fetchRecipeSuggestions("")
        .then((data) => {
          setSuggestions(data.suggestions || []);
          setTrendingSearches(data.trendingSearches || []);
          setQuerySuggestions(data.querySuggestions || []);
          setSuggestType("popular");
        })
        .catch(() => {
          setSuggestions([]);
          setTrendingSearches([]);
        })
        .finally(() => setLoading(false));
      return;
    }

    setLoading(true);
    fetchRecipeSuggestions(debounced)
      .then((data) => {
        setSuggestions(data.suggestions || []);
        setQuerySuggestions(data.querySuggestions || []);
        setSuggestType(data.type || "search");
        setMatchType(data.matchType || "recipe");
      })
      .catch(() => {
        setSuggestions([]);
        setQuerySuggestions([]);
      })
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
    addRecentSearch(term.trim());
    setRecent(getRecentSearches());
    track("search", { q: term.trim() });
    setOpen(false);
    navigate(`/recipes?search=${encodeURIComponent(term.trim())}`);
  };

  const showPanel = open && (
    query.trim()
    || recent.length > 0
    || trendingSearches.length > 0
    || suggestions.length > 0
    || querySuggestions.length > 0
  );

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <div className="relative">
        <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" aria-hidden />
        <label htmlFor={inputId} className="sr-only">
          Search recipes
        </label>
        <input
          id={inputId}
          type="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          value={query}
          onChange={(e) => {
            const v = e.target.value;
            setQuery(v);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Enter" && goSearch()}
          placeholder="Search biryani, dosa, paneer, pasta..."
          className={`glass-input w-full pl-11 pr-28 ${large ? "py-4 text-base" : "py-3"}`}
        />
        <button
          type="button"
          onClick={() => goSearch()}
          aria-label="Search recipes"
          className="premium-btn absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-2 text-xs sm:text-sm"
        >
          Search
        </button>
      </div>

      {showPanel && (
        <div id={listId} role="listbox" className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#1c1814]/98 shadow-2xl backdrop-blur-xl">
          {!query.trim() && recent.length > 0 && (
            <>
              <div className="flex items-center justify-between border-b border-white/8 px-4 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Recent searches
                </p>
                <button
                  type="button"
                  onClick={() => { clearRecentSearches(); setRecent([]); }}
                  className="text-[10px] text-[var(--text-secondary)] hover:text-[var(--accent-soft)]"
                >
                  Clear
                </button>
              </div>
              <ul>
                {recent.map((r) => (
                  <li key={r}>
                    <button
                      type="button"
                      onClick={() => goSearch(r)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[var(--text-primary)] hover:bg-white/5"
                    >
                      <IconSearch className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                      {r}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {!query.trim() && trendingSearches.length > 0 && (
            <>
              <p className="border-b border-white/8 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Trending searches
              </p>
              <div className="flex flex-wrap gap-2 px-4 py-3">
                {trendingSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => goSearch(term)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[var(--text-primary)] hover:bg-white/10"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </>
          )}

          {!query.trim() && suggestions.length > 0 && (
            <>
              <p className="border-b border-white/8 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Popular recipes
              </p>
              {loading ? (
                <p className="px-4 py-4 text-sm text-[var(--text-secondary)]">Loading...</p>
              ) : (
                <ul>
                  {suggestions.map((r) => (
                    <li key={r.id}>
                      <Link
                        to={`/recipe/${r.id}`}
                        onClick={() => {
                          addRecentSearch(r.name);
                          setOpen(false);
                          track("search_suggestion_click", { id: r.id });
                        }}
                        className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/5"
                      >
                        <RecipeImage
                          src={r.imageUrl || `/api/recipes/image/${r.id}`}
                          recipeId={r.id}
                          version={r.imageVersion || 0}
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
                        <IconArrowRight className="h-4 w-4 shrink-0 text-[var(--text-secondary)]" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {query.trim() && (
            <>
              {querySuggestions.length > 0 && (
                <div className="border-b border-white/8 px-4 py-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Suggestions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {querySuggestions.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => goSearch(term)}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[var(--text-primary)] hover:bg-white/10"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="border-b border-white/8 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                {matchType === "ingredient" ? `Recipes with "${query}"` : `Results for "${query}"`}
              </p>
              {loading ? (
                <p className="px-4 py-4 text-sm text-[var(--text-secondary)]">Searching...</p>
              ) : suggestions.length === 0 ? (
                <div className="px-4 py-4 text-sm text-[var(--text-secondary)]">
                  <p>No quick matches — press Enter to search all recipes.</p>
                  <p className="mt-1 text-xs">Try a shorter word or check spelling.</p>
                </div>
              ) : (
                <ul>
                  {suggestions.map((r) => (
                    <li key={r.id}>
                      <Link
                        to={`/recipe/${r.id}`}
                        onClick={() => {
                          addRecentSearch(query.trim() || r.name);
                          setOpen(false);
                          track("search_suggestion_click", { id: r.id });
                        }}
                        className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/5"
                      >
                        <RecipeImage
                          src={r.imageUrl || `/api/recipes/image/${r.id}`}
                          recipeId={r.id}
                          version={r.imageVersion || 0}
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
                  <li>
                    <button
                      type="button"
                      onClick={() => goSearch()}
                      className="w-full border-t border-white/10 px-4 py-3 text-left text-sm font-medium text-[var(--accent-soft)] hover:bg-white/5"
                    >
                      See all results for &ldquo;{query}&rdquo;
                    </button>
                  </li>
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
