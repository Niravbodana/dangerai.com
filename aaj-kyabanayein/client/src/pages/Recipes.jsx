import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchCategories, fetchRecipes, fetchTrendingRecipes } from "../api";
import { useLanguage } from "../context/LanguageContext";
import RecipeCard from "../components/RecipeCard";
import { IconArrowLeft, IconArrowRight } from "../components/Icons";

export default function Recipes() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const sortTrending = searchParams.get("sort") === "trending";

  const [recipes, setRecipes] = useState([]);
  const [cuisines, setCuisines] = useState([]);
  const [total, setTotal] = useState(0);
  const [diet, setDiet] = useState("all");
  const [cuisine, setCuisine] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories().then((data) => setCuisines(data.cuisines || []));
  }, []);

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
          if (search) {
            const q = search.toLowerCase();
            list = list.filter(
              (r) => r.name.toLowerCase().includes(q) || r.nameHi?.includes(search)
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
    if (search) params.search = search;

    fetchRecipes(params)
      .then((data) => {
        setRecipes(data.recipes);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      })
      .finally(() => setLoading(false));
  }, [diet, cuisine, page, search, sortTrending]);

  const setSort = (trending) => {
    if (trending) {
      setSearchParams({ sort: "trending" });
    } else {
      setSearchParams({});
    }
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-stone-900">{t("recipes")}</h1>
        <p className="mt-1 text-sm text-stone-500">
          {sortTrending ? t("hotMakings") : `${total.toLocaleString()}+ ${t("recipesCount").toLowerCase()}`}
        </p>

        <div className="mt-6 flex gap-2">
          <button
            onClick={() => setSort(false)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              !sortTrending ? "bg-stone-900 text-white" : "border border-stone-200 text-stone-600 hover:bg-stone-50"
            }`}
          >
            {t("allRecipes")}
          </button>
          <button
            onClick={() => setSort(true)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              sortTrending ? "bg-orange-600 text-white" : "border border-stone-200 text-stone-600 hover:bg-stone-50"
            }`}
          >
            {t("hotMakings")}
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          {[
            { id: "all", label: t("allCuisines") },
            { id: "veg", label: t("veg") },
            { id: "non-veg", label: t("nonVeg") },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => { setDiet(opt.id); setPage(1); }}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition sm:flex-none sm:px-6 ${
                diet === opt.id
                  ? opt.id === "veg"
                    ? "bg-emerald-700 text-white"
                    : opt.id === "non-veg"
                      ? "bg-stone-800 text-white"
                      : "bg-orange-600 text-white"
                  : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
              }`}
            >
              {opt.label}
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
                  ? "bg-stone-900 text-white"
                  : "border border-stone-200 bg-white text-stone-500 hover:border-stone-300"
              }`}
            >
              {c.labelHi || c.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={t("search")}
          className="mt-6 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
        />

        {loading ? (
          <div className="mt-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-orange-500" />
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
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-stone-200 transition hover:bg-stone-50 disabled:opacity-30"
                >
                  <IconArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-stone-500">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-stone-200 transition hover:bg-stone-50 disabled:opacity-30"
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
