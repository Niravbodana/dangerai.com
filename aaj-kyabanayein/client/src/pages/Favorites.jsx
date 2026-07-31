import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchRecipe } from "../api";
import { useLanguage } from "../context/LanguageContext";
import RecipeCard from "../components/RecipeCard";
import { getLocalFavorites } from "../lib/guest";

export default function Favorites() {
  const { t } = useLanguage();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = getLocalFavorites();
    if (ids.length === 0) {
      setLoading(false);
      return;
    }
    Promise.all(ids.map((id) => fetchRecipe(id).then((d) => d.recipe).catch(() => null)))
      .then((results) => setRecipes(results.filter(Boolean)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold text-stone-900">❤️ {t("favorites")}</h1>

        {loading ? (
          <p className="text-stone-400">Loading...</p>
        ) : recipes.length === 0 ? (
          <div className="premium-card p-12 text-center">
            <p className="text-stone-500">Abhi koi favorite nahi hai</p>
            <Link to="/recipes" className="mt-4 inline-block text-orange-600 hover:underline">
              Recipes browse karo →
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
