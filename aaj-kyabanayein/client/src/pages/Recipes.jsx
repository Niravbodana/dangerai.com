import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchCategories, fetchRecipeSuggestions, fetchRecipes, fetchTrendingRecipes } from "../api";
import { useLanguage } from "../context/LanguageContext";
import RecipeCard from "../components/RecipeCard";
import RecipeGridSkeleton from "../components/RecipeGridSkeleton";
import RecipeSearch from "../components/RecipeSearch";
import RecipeCategoryMenu from "../components/RecipeCategoryMenu";
import RecipeFilterDrawer from "../components/RecipeFilterDrawer";
import DietToggle from "../components/DietToggle";
import { IconArrowLeft, IconArrowRight, IconFilter } from "../components/Icons";
import { getEmptySearchMessage, getSearchTips, QUICK_SEARCH_SUGGESTIONS } from "../lib/searchUtils";
import { loadRecipeFilters, saveRecipeFilters, normalizeCategoryForDiet } from "../lib/recipeFilters";
import useDebounce from "../hooks/useDebounce";
import { getTasteProfile } from "../lib/tasteProfile";
import { getStateById, stateLabel } from "../data/indianStates";
import { isVegDiet, isNonVegDiet } from "../lib/diet";

const STATE_COLLECTION = {
  gujarat: "gujarati-thali",
  punjab: "punjabi-weekend",
  maharashtra: "maharashtrian-favs",
  "west-bengal": "bengali-comfort",
  rajasthan: "rajasthani-plate",
  telangana: "hyderabadi-special",
  kerala: "kerala-home",
  "tamil-nadu": "tamil-tiffin",
};

function recipeIsVeg(r) {
  return isVegDiet(r.diet);
}

function recipeIsNonVeg(r) {
  return isNonVegDiet(r.diet);
}

export default function Recipes() {
  const { t, lang } = useLanguage();
  const homeState = getTasteProfile().homeState;
  const stateInfo = getStateById(homeState);
  const [searchParams, setSearchParams] = useSearchParams();
  const sortTrending = searchParams.get("sort") === "trending";

  const saved = loadRecipeFilters();
  // Default view is vegetarian-first: show only veg dishes until the user
  // explicitly taps "Non-Veg" (or "All"). A previously saved choice always wins.
  const initialDiet = saved.diet || "veg";
  const [recipes, setRecipes] = useState([]);
  const [cuisines, setCuisines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [resultTotal, setResultTotal] = useState(0);
  const [diet, setDiet] = useState(initialDiet);
  const [cuisine, setCuisine] = useState(searchParams.get("cuisine") || saved.cuisine || "all");
  const [category, setCategory] = useState(normalizeCategoryForDiet(saved.category || "all", initialDiet));
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const debouncedSearch = useDebounce(search, 400);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [trendingSearches, setTrendingSearches] = useState([]);
  const [maxCookTime, setMaxCookTime] = useState(null);
  const [apiError, setApiError] = useState(null);

  const loadCatalogMeta = (attempt = 0) => {
    fetchCategories()
      .then((data) => {
        setApiError(null);
        setCuisines(data.cuisines || []);
        setCategories(data.categories || []);
        setCatalogTotal(data.totalRecipes || 0);
      })
      .catch(() => {
        if (attempt < 6) {
          setTimeout(() => loadCatalogMeta(attempt + 1), 1000 * (attempt + 1));
          return;
        }
        setCatalogTotal(0);
        setApiError("API se connect nahi ho paya. Server check karo (port 5000), phir page refresh karo.");
      });
  };

  useEffect(() => {
    // Clear stale filters that hide the full 10k catalog
    try {
      const savedFilters = loadRecipeFilters();
      if (savedFilters?.category && savedFilters.category !== "all") {
        // keep — user choice; only reset broken diet values
      }
    } catch {
      /* ignore */
    }
    loadCatalogMeta();
    fetchRecipeSuggestions("").then((data) => {
      setTrendingSearches(data.trendingSearches || []);
    }).catch(() => {});
  }, []);

  const handleDietChange = (id) => {
    setDiet(id);
    setCategory((c) => normalizeCategoryForDiet(c, id));
    setPage(1);
  };

  useEffect(() => {
    saveRecipeFilters({ diet, cuisine, category });
  }, [diet, cuisine, category]);

  useEffect(() => {
    const urlCuisine = searchParams.get("cuisine");
    if (urlCuisine) setCuisine(urlCuisine);
    const urlSearch = searchParams.get("search");
    if (urlSearch) setSearch(urlSearch);
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);

    if (sortTrending) {
      fetchTrendingRecipes(24)
        .then((data) => {
          let list = data.recipes || [];
          if (diet === "veg") list = list.filter(recipeIsVeg);
          else if (diet === "non-veg") list = list.filter(recipeIsNonVeg);
          if (cuisine !== "all") list = list.filter((r) => r.cuisine === cuisine);
          if (debouncedSearch) {
            const q = debouncedSearch.toLowerCase();
            list = list.filter((r) => r.name.toLowerCase().includes(q) || r.nameHi?.toLowerCase().includes(q));
          }
          setRecipes(list);
          setResultTotal(list.length);
          setTotalPages(1);
        })
        .catch(() => {
          setRecipes([]);
          setResultTotal(0);
          setTotalPages(1);
        })
        .finally(() => setLoading(false));
      return;
    }

    const params = { page, limit: 24 };
    if (diet !== "all") params.diet = diet;
    if (cuisine !== "all") params.cuisine = cuisine;
    if (category !== "all") params.category = category;
    if (debouncedSearch) params.search = debouncedSearch;
    if (maxCookTime) params.maxCookTime = maxCookTime;

    let cancelled = false;
    const loadRecipes = (attempt = 0) => {
      fetchRecipes(params)
        .then((data) => {
          if (cancelled) return;
          setApiError(null);
          setRecipes(data.recipes || []);
          setResultTotal(data.total ?? 0);
          setTotalPages(data.totalPages || 1);
        })
        .catch(() => {
          if (cancelled) return;
          if (attempt < 2) {
            setTimeout(() => {
              if (!cancelled) loadRecipes(attempt + 1);
            }, 800 * (attempt + 1));
            return;
          }
          setRecipes([]);
          setResultTotal(0);
          setTotalPages(1);
          setApiError("Recipes load nahi hui. Terminal: npm run dev:kill && npm run dev");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };
    loadRecipes();
    return () => {
      cancelled = true;
    };
  }, [diet, cuisine, category, page, debouncedSearch, sortTrending, maxCookTime]);

  const setSort = (trending) => {
    setSearchParams(trending ? { sort: "trending" } : {});
    setPage(1);
    if (trending) {
      setCategory("all");
      setMaxCookTime(null);
    }
  };

  const handleMenuSelect = (id) => {
    setPage(1);
    if (id === "trending") {
      setSort(true);
      return;
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("sort");
      return next;
    });
    if (id === "all") {
      setDiet("all");
      setCategory("all");
      setMaxCookTime(null);
      return;
    }
    if (id === "veg" || id === "non-veg") {
      setDiet(id);
      setMaxCookTime(null);
      if (category.startsWith("veg-") && id === "non-veg") {
        setCategory(category.replace("veg-", "nonveg-"));
      } else if (category.startsWith("nonveg-") && id === "veg") {
        setCategory(category.replace("nonveg-", "veg-"));
      } else if (category === "all") {
        setCategory("all");
      }
      return;
    }
    if (id === "quick") {
      setDiet("all");
      setCategory("all");
      setMaxCookTime(20);
      return;
    }
    setDiet("all");
    setMaxCookTime(null);
    setCategory(id);
  };

  const handleCuisineSelect = (id) => {
    setCuisine(id);
    setPage(1);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (id === "all") next.delete("cuisine");
      else next.set("cuisine", id);
      return next;
    });
  };

  const activeFilters = [cuisine !== "all", category !== "all", !!maxCookTime, sortTrending].filter(Boolean).length;

  const clearFilters = () => {
    setDiet("veg");
    setCuisine("all");
    setCategory("all");
    setMaxCookTime(null);
    setSearch("");
    setPage(1);
    setSearchParams({});
  };

  const applyTrendingSearch = (term) => {
    setSearch(term);
    setPage(1);
    setSearchParams({ search: term });
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="text-center">
          <h1 className="font-display text-3xl tracking-tight text-[var(--text-primary)] sm:text-4xl">
            {sortTrending ? t("hotMakings") : t("recipes")}
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {catalogTotal > 0
              ? `${catalogTotal.toLocaleString()} hand-picked recipes with real ingredients`
              : "Loading recipe catalog…"}
            {resultTotal !== catalogTotal && resultTotal > 0 && (
              <span className="text-[var(--accent-soft)]"> · {resultTotal.toLocaleString()} showing</span>
            )}
          </p>
          {apiError && (
            <p className="mt-2 text-sm text-amber-400">{apiError}</p>
          )}
        </div>

        {/* Mobile: sticky bar under logo — filter menu left + veg toggle */}
        <div className="sticky top-[57px] z-40 -mx-4 mt-4 border-b border-white/[0.06] bg-[#0c0a08]/92 px-4 py-3 backdrop-blur-xl lg:hidden">
          <div className="recipes-toolbar mx-auto max-w-2xl">
            <button
              type="button"
              onClick={() => setFilterDrawerOpen(true)}
              className="recipes-toolbar__menu tap-smooth"
            >
              <span className="recipes-toolbar__menu-icon">☰</span>
              <span className="text-left">
                <span className="block text-xs font-semibold text-[var(--text-primary)]">
                  {lang === "hi" ? "फ़िल्टर & मेनू" : "Filters & Menu"}
                </span>
                <span className="block text-[10px] text-[var(--text-secondary)]">
                  {lang === "hi" ? "Step by step" : "Step-by-step"}
                </span>
              </span>
              {activeFilters > 0 && (
                <span className="recipes-toolbar__badge">{activeFilters}</span>
              )}
            </button>
            <DietToggle
              value={diet}
              onChange={handleDietChange}
              lang={lang}
            />
          </div>
        </div>

        <div className="mx-auto mt-5 max-w-2xl">
          <RecipeSearch />
        </div>

        <RecipeFilterDrawer
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          sortTrending={sortTrending}
          activeCategory={category}
          activeCuisine={cuisine}
          maxCookTime={maxCookTime}
          onSelect={handleMenuSelect}
          onCuisineSelect={handleCuisineSelect}
          activeFilterCount={activeFilters}
          onClear={clearFilters}
        />

        {stateInfo && (
          <div className="mx-auto mt-5 max-w-3xl rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-4">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {lang === "hi"
                ? `${stateLabel(stateInfo, "hi")} — aapke state ki recipes`
                : `${stateLabel(stateInfo, "en")} — recipes from your home state`}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(stateInfo.tags || []).slice(0, 4).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => applyTrendingSearch(tag)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:border-[var(--accent)]/40 hover:text-[var(--accent-soft)]"
                >
                  {tag}
                </button>
              ))}
              {STATE_COLLECTION[homeState] && (
                <a
                  href={`/collections/${STATE_COLLECTION[homeState]}`}
                  className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[#14110e]"
                >
                  {lang === "hi" ? "Poori collection dekho" : "View full collection"}
                </a>
              )}
            </div>
          </div>
        )}

        <RecipeCategoryMenu
          activeCategory={category}
          activeCuisine={cuisine}
          activeDiet={diet}
          sortTrending={sortTrending}
          maxCookTime={maxCookTime}
          onSelect={handleMenuSelect}
          onCuisineSelect={handleCuisineSelect}
        />

        <div className="mt-5 hidden flex-wrap items-center justify-center gap-2 lg:flex">
          <button
            type="button"
            onClick={() => setSort(false)}
            className={`rounded-full px-4 py-2 text-xs font-medium transition ${
              !sortTrending ? "bg-[var(--accent)]/20 text-[var(--accent-soft)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {t("allRecipes")}
          </button>
          <button
            type="button"
            onClick={() => setSort(true)}
            className={`rounded-full px-4 py-2 text-xs font-medium transition ${
              sortTrending ? "bg-[var(--accent)]/20 text-[var(--accent-soft)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {t("hotMakings")}
          </button>
          <DietToggle
            value={diet}
            onChange={handleDietChange}
            lang={lang}
          />
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium transition ${
              filtersOpen || activeFilters > 0
                ? "border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent-soft)]"
                : "border-white/12 text-[var(--text-secondary)] hover:border-white/25"
            }`}
          >
            <IconFilter className="h-3.5 w-3.5" />
            {t("filters")}{activeFilters > 0 ? ` (${activeFilters})` : ""}
          </button>
        </div>

        {filtersOpen && (
          <div className="mx-auto mt-4 hidden max-w-3xl space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 lg:block">
            <div className="filter-row">
              <span className="filter-row__label">Meal</span>
              <div className="filter-row__chips">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setCategory(category === c.id ? "all" : c.id); setPage(1); }}
                    className={`filter-chip tap-smooth ${category === c.id ? "filter-chip--active" : ""}`}
                  >
                    {lang === "hi" ? c.labelHi || c.label : c.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-row">
              <span className="filter-row__label">Cuisine</span>
              <div className="filter-row__chips">
                {cuisines.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setCuisine(c.id); setPage(1); }}
                    className={`filter-chip tap-smooth ${cuisine === c.id ? "filter-chip--active" : ""}`}
                  >
                    {lang === "hi" ? c.labelHi || c.label : c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <RecipeGridSkeleton count={6} />
        ) : recipes.length === 0 ? (
          <div className="recipe-card mt-12 p-8 text-center sm:p-12">
            <p className="text-lg text-[var(--text-primary)]">{getEmptySearchMessage(debouncedSearch)}</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Koi recipe nahi mili? Inme se try karo:</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {QUICK_SEARCH_SUGGESTIONS.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => applyTrendingSearch(term)}
                  className="rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-2 text-sm font-medium capitalize text-[var(--accent-soft)] hover:bg-[var(--accent)]/20"
                >
                  {term}
                </button>
              ))}
            </div>
            <ul className="mx-auto mt-4 max-w-md space-y-1 text-left text-sm text-[var(--text-secondary)]">
              {getSearchTips().map((tip) => (
                <li key={tip}>• {tip}</li>
              ))}
            </ul>
            {trendingSearches.length > 0 && (
              <div className="mt-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Trending searches
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {trendingSearches.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => applyTrendingSearch(term)}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[var(--text-primary)] hover:bg-white/10"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {(activeFilters > 0 || debouncedSearch) && (
              <button
                type="button"
                onClick={clearFilters}
                className="premium-btn-outline tap-smooth mt-6 px-5 py-2.5 text-sm"
              >
                Clear search &amp; filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  trending={sortTrending}
                  rank={recipe.trendingRank}
                />
              ))}
            </div>
            {!sortTrending && totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="premium-btn-outline flex h-10 w-10 items-center justify-center disabled:opacity-30"
                >
                  <IconArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-[var(--text-secondary)]">{page} / {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="premium-btn-outline flex h-10 w-10 items-center justify-center disabled:opacity-30"
                >
                  <IconArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
