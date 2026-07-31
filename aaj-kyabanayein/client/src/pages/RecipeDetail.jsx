import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchRecipe } from "../api";
import Navbar from "../components/Navbar";

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecipe(id)
      .then((data) => setRecipe(data.recipe))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fffbf7]">
        <p className="text-gray-500">Recipe load ho rahi hai...</p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#fffbf7]">
        <p className="text-gray-500">Recipe nahi mili</p>
        <button onClick={() => navigate("/recipes")} className="mt-4 text-orange-600">
          ← Wapas jao
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffbf7]">
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 py-8">
        <button onClick={() => navigate(-1)} className="mb-4 text-sm text-orange-600 hover:underline">
          ← Wapas
        </button>

        <div className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm">
          {recipe.image && (
            <img src={recipe.image} alt={recipe.nameHi} className="h-56 w-full object-cover" />
          )}
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900">{recipe.nameHi}</h1>
            <p className="text-gray-500">{recipe.name}</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <span className="text-sm text-green-600">⏱ {recipe.cookTime} min</span>
              <span className="text-sm text-blue-600">🔥 {recipe.calories} cal</span>
              <span className="text-sm text-gray-500 capitalize">{recipe.cuisine || "indian"}</span>
              <span className="text-sm text-purple-600">{recipe.totalSteps} steps</span>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-gray-900">📋 Zaroori Samaan</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {recipe.ingredients.map((ing) => (
              <li key={ing.name} className="flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2 text-sm">
                <span className="text-orange-500">✓</span>
                <span className="font-medium text-gray-800">{ing.nameHi}</span>
                <span className="text-gray-500">— {ing.quantity}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={() => navigate(`/cook/${recipe.id}`)}
          className="mt-6 w-full rounded-2xl bg-orange-500 py-4 text-lg font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600"
        >
          🔥 Start Cooking — Step by Step
        </button>
      </div>
    </div>
  );
}
