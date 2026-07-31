import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchRecipe, fetchRecipeRating, rateRecipe } from "../api";
import { useLanguage } from "../context/LanguageContext";
import { getGuestId, isLocalFavorite, shareOnWhatsApp, toggleLocalFavorite } from "../lib/guest";

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [recipe, setRecipe] = useState(null);
  const [rating, setRating] = useState({ average: 0, count: 0 });
  const [isFav, setIsFav] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchRecipe(id), fetchRecipeRating(id)])
      .then(([recipeData, ratingData]) => {
        setRecipe(recipeData.recipe);
        setRating(ratingData);
        setIsFav(isLocalFavorite(id));
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleRate = async (score) => {
    setUserRating(score);
    const data = await rateRecipe(id, score, getGuestId());
    setRating(data);
  };

  const handleFavorite = () => {
    const added = toggleLocalFavorite(id);
    setIsFav(added);
  };

  const handleShare = () => {
    if (recipe) shareOnWhatsApp(recipe);
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center"><p>Loading...</p></div>;
  if (!recipe) return <div className="flex min-h-screen items-center justify-center"><p>Not found</p></div>;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <button onClick={() => navigate(-1)} className="mb-4 text-sm text-orange-600">← Back</button>

        <div className="premium-card overflow-hidden">
          {recipe.image && <img src={recipe.image} alt="" className="h-56 w-full object-cover" />}
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-stone-900">{recipe.nameHi}</h1>
                <p className="text-stone-500">{recipe.name}</p>
              </div>
              <button onClick={handleFavorite} className="text-2xl">{isFav ? "❤️" : "🤍"}</button>
            </div>

            <div className="mt-3 flex flex-wrap gap-3 text-sm text-stone-500">
              <span>⏱ {recipe.cookTime} min</span>
              <span>🔥 {recipe.calories} cal</span>
              <span className="capitalize">{recipe.cuisine}</span>
              <span>⭐ {rating.average || "—"} ({rating.count})</span>
            </div>

            {/* Rating */}
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-stone-700">{t("rate")}:</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => handleRate(s)} className={`text-2xl ${s <= (userRating || rating.average) ? "opacity-100" : "opacity-30"}`}>
                    ⭐
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Link to={`/cook/${recipe.id}`} className="premium-btn flex-1 py-3 text-center">
                {t("startCooking")} →
              </Link>
              <button onClick={handleShare} className="rounded-full border border-green-300 bg-green-50 px-6 py-3 text-sm font-semibold text-green-700">
                WhatsApp {t("share")}
              </button>
            </div>
          </div>
        </div>

        <div className="premium-card mt-6 p-6">
          <h2 className="mb-4 font-bold">📋 Ingredients</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {recipe.ingredients.map((ing) => (
              <li key={ing.name} className="rounded-lg bg-orange-50 px-3 py-2 text-sm">
                {ing.nameHi} — {ing.quantity}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
