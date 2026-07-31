import { useEffect, useState } from "react";
import { fetchRecipes } from "../api";
import Navbar from "../components/Navbar";

const MEAL_LABEL = { breakfast: "Nashta", lunch: "Dopahar", dinner: "Raat", snack: "Snack" };

export default function Recipes() {
  const [recipes, setRecipes] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecipes()
      .then((data) => setRecipes(data.recipes))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    filter === "all" ? recipes : recipes.filter((r) => r.mealType === filter);

  return (
    <div className="min-h-screen bg-[#fffbf7]">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">📖 Saari Recipes</h1>
        <p className="mb-6 text-gray-600">{recipes.length} recipes available</p>

        <div className="mb-6 flex flex-wrap gap-2">
          {["all", "breakfast", "lunch", "dinner", "snack"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
                filter === type
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-orange-50"
              }`}
            >
              {type === "all" ? "Sab" : MEAL_LABEL[type]}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((recipe) => (
              <div
                key={recipe.id}
                className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm"
              >
                <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-600">
                  {MEAL_LABEL[recipe.mealType]}
                </span>
                <h3 className="mt-2 text-lg font-bold text-gray-900">{recipe.nameHi}</h3>
                <p className="text-sm text-gray-500">{recipe.name}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs text-green-600">⏱ {recipe.cookTime} min</span>
                  <span className="text-xs text-blue-600">🔥 {recipe.calories} cal</span>
                  <span className="text-xs text-gray-500 capitalize">{recipe.budget}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {recipe.diet.map((d) => (
                    <span key={d} className="rounded bg-gray-50 px-1.5 py-0.5 text-xs text-gray-500">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
