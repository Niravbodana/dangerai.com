import { useEffect, useState } from "react";
import { fetchRecipeCategories, fetchRecipes } from "../api";
import Navbar from "../components/Navbar";
import RecipeCard from "../components/RecipeCard";

const CATEGORY_ICONS = {
  "veg-breakfast": "🌅",
  "nonveg-breakfast": "🍳",
  "veg-lunch": "🥗",
  "nonveg-lunch": "🍗",
  "veg-dinner": "🌙",
  "nonveg-dinner": "🥩",
  healthy: "💚",
  snack: "🥜",
};

export default function Recipes() {
  const [recipes, setRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [counts, setCounts] = useState({});
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecipeCategories().then((data) => {
      setCategories(data.categories);
      setCounts(data.counts);
      setTotal(data.totalRecipes);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: 24 };
    if (filter !== "all") params.category = filter;
    if (search) params.search = search;

    fetchRecipes(params)
      .then((data) => {
        setRecipes(data.recipes);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      })
      .finally(() => setLoading(false));
  }, [filter, page, search]);

  return (
    <div className="min-h-screen bg-[#fffbf7]">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">📖 Saari Recipes</h1>
        <p className="mb-4 text-gray-600">{total.toLocaleString()}+ Indian recipes with step-by-step cooking</p>

        <div className="mb-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
            🇮🇳 Indian
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-400">
            🇮🇹 Italian — Coming Soon
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-400">
            🇰🇷 Korean — Coming Soon
          </span>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search — dal, paneer, biryani..."
          className="mb-6 w-full rounded-xl border border-orange-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />

        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => {
              setFilter("all");
              setPage(1);
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              filter === "all" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            Sab ({total})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setFilter(cat.id);
                setPage(1);
              }}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                filter === cat.id ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {CATEGORY_ICONS[cat.id]} {cat.labelHi} ({counts[cat.id] || 0})
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-xl border border-orange-200 px-4 py-2 text-sm disabled:opacity-40"
                >
                  ← Pehle
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-xl border border-orange-200 px-4 py-2 text-sm disabled:opacity-40"
                >
                  Agle →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
