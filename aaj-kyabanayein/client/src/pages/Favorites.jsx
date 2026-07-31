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

  const load = () => {
    const ids = getLocalFavorites();
    if (ids.length === 0) {
      setRecipes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all(ids.map((id) => fetchRecipe(id).then((d) => d.recipe).catch(() => null)))
      .then((results) => setRecipes(results.filter(Boolean)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-stone-900">{t("favorites")}</h1>
        <p className="mt-1 text-sm text-stone-500">{t("featFavoritesDesc")}</p>

        {loading ? (
          <div className="mt-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-orange-500" />
          </div>
        ) : recipes.length === 0 ? (
          <div className="recipe-card mt-8 p-12 text-center">
            <p className="text-stone-500">{t("noFavorites")}</p>
            <Link to="/recipes" className="mt-4 inline-block text-sm font-medium text-orange-600 hover:text-orange-700">
              {t("browseRecipes")}
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} onFavoriteChange={load} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
