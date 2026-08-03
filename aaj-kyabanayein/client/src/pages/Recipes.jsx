import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchCategories, fetchRecipeSuggestions, fetchRecipes, fetchTrendingRecipes } from "../api";
import { useLanguage } from "../context/LanguageContext";
import RecipeCard from "../components/RecipeCard";
import RecipeGridSkeleton from "../components/RecipeGridSkeleton";
import RecipeSearch from "../components/RecipeSearch";
import { VegSymbol, NonVegSymbol } from "../components/DietSymbols";
import { IconArrowLeft, IconArrowRight, IconFilter } from "../components/Icons";
import { getEmptySearchMessage, getSearchTips, QUICK_SEARCH_SUGGESTIONS } from "../lib/searchUtils";
import { loadRecipeFilters, saveRecipeFilters } from "../lib/recipeFilters";
import useDebounce from "../hooks/useDebounce";
import { getTasteProfile } from "../lib/tasteProfile";
import { getStateById, stateLabel } from "../data/indianStates";

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

export default function Recipes() {
  const { t, lang } = useLanguage();
  const homeState = getTasteProfile().homeState;
  const stateInfo = getStateById(homeState);
  const [searchParams, setSearchParams] = useSearchParams();
  const sortTrending = searchParams.get("sort") === "trending";

  const [recipes, setRecipes] = useState([]);
  const [cuisines, setCuisines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const saved = loadRecipeFilters();
  const [diet, setDiet] = useState(saved.diet || "all");
  const [cuisine, setCuisine] = useState(searchParams.get("cuisine") || saved.cuisine || "all");
  const [category, setCategory] = useState(saved.category || "all");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const debouncedSearch = useDebounce(search, 400);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [trendingSearches, setTrendingSearches] = useState([]);

  useEffect(() => {
    fetchCategories().then((data) => {
      setCuisines(data.cuisines || []);
      setCategories(data.categories || []);
      setTotal(data.totalRecipes || 0);
    });
    fetchRecipeSuggestions("").then((data) => {
      setTrendingSearches(data.trendingSearches || []);
    }).catch(() => {});
  }, []);

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
          if (diet === "veg") list = list.filter((r) => r.diet?.includes("veg") && !r.diet?.includes("non-veg"));
          else if (diet === "non-veg") list = list.filter((r) => r.diet?.includes("non-veg"));
          if (cuisine !== "all") list = list.filter((r) => r.cuisine === cuisine);
          if (debouncedSearch) {
            const q = debouncedSearch.toLowerCase();
            list = list.filter((r) => r.name.toLowerCase().includes(q) || r.nameHi?.toLowerCase().includes(q));
          }
          setRecipes(list);
          setTotal(list.length);
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

    fetchRecipes(params)
      .then((data) => {
        setRecipes(data.recipes);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      })
      .finally(() => setLoading(false));
  }, [diet, cuisine, category, page, debouncedSearch, sortTrending]);

  const setSort = (trending) => {
    setSearchParams(trending ? { sort: "trending" } : {});
    setPage(1);
  };

  const activeFilters = [diet !== "all", cuisine !== "all", category !== "all"].filter(Boolean).length;

  const clearFilters = () => {
    setDiet("all");
    setCuisine("all");
    setCategory("all");
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
            {total.toLocaleString()} hand-picked recipes with real ingredients
          </p>
        </div>

        <div className="mx-auto mt-6 max-w-2xl">
          <RecipeSearch />
        </div>

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

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
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
          <div className="mx-auto mt-4 max-w-3xl space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { id: "all", label: "All" },
                { id: "veg", label: t("veg"), icon: <VegSymbol className="h-3 w-3" /> },
                { id: "non-veg", label: t("nonVeg"), icon: <NonVegSymbol className="h-3 w-3" /> },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => { setDiet(opt.id); setPage(1); }}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    diet === opt.id ? "bg-white/15 text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:bg-white/8"
                  }`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
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
                    {c.label}
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
                    {c.label}
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
