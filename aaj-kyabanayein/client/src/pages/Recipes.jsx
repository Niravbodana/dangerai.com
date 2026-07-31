import { useEffect, useState } from "react";
import { fetchCategories, fetchRecipes } from "../api";
import { useLanguage } from "../context/LanguageContext";
import RecipeCard from "../components/RecipeCard";

export default function Recipes() {
  const { t } = useLanguage();
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
  }, [diet, cuisine, page, search]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold text-stone-900">📖 {t("recipes")}</h1>
        <p className="mb-6 text-stone-500">{total.toLocaleString()}+ recipes</p>

        {/* Veg / Non-Veg Toggle */}
        <div className="mb-4 flex gap-2">
          {[
            { id: "all", label: "All", icon: "🍽️" },
            { id: "veg", label: t("veg"), icon: "🥬" },
            { id: "non-veg", label: t("nonVeg"), icon: "🍗" },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => { setDiet(opt.id); setPage(1); }}
              className={`flex-1 rounded-xl py-3 text-sm font-semibold transition sm:flex-none sm:px-8 ${
                diet === opt.id
                  ? opt.id === "veg"
                    ? "bg-emerald-500 text-white shadow-md"
                    : opt.id === "non-veg"
                      ? "bg-red-500 text-white shadow-md"
                      : "bg-orange-500 text-white shadow-md"
                  : "bg-white text-stone-600 border border-stone-200"
              }`}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>

        {/* Cuisine Filter */}
        <div className="mb-4 flex flex-wrap gap-2">
          {cuisines.map((c) => (
            <button
              key={c.id}
              onClick={() => { setCuisine(c.id); setPage(1); }}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                cuisine === c.id ? "bg-stone-800 text-white" : "bg-white text-stone-600 border border-stone-200"
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
          className="mb-6 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
        />

        {loading ? (
          <p className="text-stone-400">Loading...</p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-4">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-xl border px-4 py-2 text-sm disabled:opacity-30">←</button>
                <span className="py-2 text-sm text-stone-500">{page} / {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-xl border px-4 py-2 text-sm disabled:opacity-30">→</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
