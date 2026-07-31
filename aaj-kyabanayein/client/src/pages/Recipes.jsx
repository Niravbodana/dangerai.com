import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchCategories, fetchRecipes, fetchTrendingRecipes } from "../api";
import { useLanguage } from "../context/LanguageContext";
import RecipeCard from "../components/RecipeCard";
import RecipeSearch from "../components/RecipeSearch";
import SegmentedControl from "../components/SegmentedControl";
import { IconArrowLeft, IconArrowRight } from "../components/Icons";

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Recipes() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const sortTrending = searchParams.get("sort") === "trending";

  const [recipes, setRecipes] = useState([]);
  const [cuisines, setCuisines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [diet, setDiet] = useState("all");
  const [cuisine, setCuisine] = useState(searchParams.get("cuisine") || "all");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories().then((data) => {
      setCuisines(data.cuisines || []);
      setCategories(data.categories || []);
    });
  }, []);

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
          if (diet === "veg") {
            list = list.filter((r) => r.diet?.includes("veg") && !r.diet?.includes("non-veg"));
          } else if (diet === "non-veg") {
            list = list.filter((r) => r.diet?.includes("non-veg"));
          }
          if (cuisine !== "all") list = list.filter((r) => r.cuisine === cuisine);
          if (debouncedSearch) {
            const q = debouncedSearch.toLowerCase();
            list = list.filter(
              (r) => r.name.toLowerCase().includes(q) || r.nameHi?.toLowerCase().includes(q)
            );
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
    if (trending) {
      setSearchParams({ sort: "trending" });
    } else {
      setSearchParams({});
    }
    setPage(1);
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="font-display text-3xl text-[var(--text-primary)]">Recipe Catalog</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {sortTrending ? t("hotMakings") : `${total.toLocaleString()}+ recipes with photos & ratings`}
        </p>

        <div className="mt-6">
          <RecipeSearch />
        </div>

        <div className="mt-6">
          <SegmentedControl
            options={[
              { id: "catalog", label: t("allRecipes") },
              { id: "trending", label: t("hotMakings") },
            ]}
            value={sortTrending ? "trending" : "catalog"}
            onChange={(id) => setSort(id === "trending")}
          />
        </div>

        <div className="mt-4">
          <SegmentedControl
            options={[
              { id: "all", label: "All" },
              { id: "veg", label: t("veg") },
              { id: "non-veg", label: t("nonVeg") },
            ]}
            value={diet}
            onChange={(id) => { setDiet(id); setPage(1); }}
            className="segmented-control--diet"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => { setCategory(category === c.id ? "all" : c.id); setPage(1); }}
              className={`rounded-full px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide transition ${
                category === c.id
                  ? "bg-[var(--accent)] text-[#14110e]"
                  : "border border-white/10 bg-white/5 text-[var(--text-secondary)] hover:border-amber-500/30"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {cuisines.map((c) => (
            <button
              key={c.id}
              onClick={() => { setCuisine(c.id); setPage(1); }}
              className={`rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-wide transition ${
                cuisine === c.id
                  ? "bg-[var(--accent)] text-[#14110e]"
                  : "border border-white/10 bg-white/5 text-[var(--text-secondary)] hover:border-amber-500/30"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-white/10" />
            ))}
          </div>
        ) : recipes.length === 0 ? (
          <div className="recipe-card mt-12 p-12 text-center">
            <p className="text-[var(--text-secondary)]">No recipes found. Try a different search.</p>
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
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="premium-btn-outline flex h-10 w-10 items-center justify-center disabled:opacity-30"
                >
                  <IconArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-[var(--text-secondary)]">{page} / {totalPages}</span>
                <button
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
