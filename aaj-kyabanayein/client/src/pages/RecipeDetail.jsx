import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchRecipe, fetchRecipeRating, fetchTrendingRecipes, rateRecipe } from "../api";
import { useLanguage } from "../context/LanguageContext";
import { getGuestId, isLocalFavorite, shareOnWhatsApp, toggleLocalFavorite } from "../lib/guest";
import LoadingSpinner from "../components/LoadingSpinner";
import RecipeCard from "../components/RecipeCard";
import { IconArrowLeft, IconClock, IconHeart, IconShare, IconStar } from "../components/Icons";

function StarRating({ value, onRate, interactive = false }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onRate?.(s)}
          className={`transition ${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"} ${
            s <= Math.round(value) ? "text-[var(--accent)]" : "text-white/50"
          }`}
        >
          <IconStar filled={s <= Math.round(value)} className="w-5 h-5" />
        </button>
      ))}
    </div>
  );
}

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [recipe, setRecipe] = useState(null);
  const [rating, setRating] = useState({ average: 0, count: 0 });
  const [isFav, setIsFav] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isTrending, setIsTrending] = useState(false);
  const [similar, setSimilar] = useState([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchRecipe(id),
      fetchRecipeRating(id),
      fetchTrendingRecipes(20),
    ])
      .then(([recipeData, ratingData, trendingData]) => {
        setRecipe(recipeData.recipe);
        setRating(ratingData);
        setIsFav(isLocalFavorite(id));
        const trending = trendingData.recipes || [];
        setIsTrending(trending.some((r) => r.id === id));
        const cuisine = recipeData.recipe?.cuisine;
        setSimilar(
          trending.filter((r) => r.id !== id && r.cuisine === cuisine).slice(0, 4)
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleRate = async (score) => {
    setUserRating(score);
    const data = await rateRecipe(id, score, getGuestId());
    setRating(data);
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-[var(--text-secondary)]">
        <p>Recipe not found</p>
        <Link to="/recipes" className="text-sm text-[var(--accent)] hover:underline">{t("browseRecipes")}</Link>
      </div>
    );
  }

  const displayRating = userRating || rating.average;
  const isVeg = recipe.diet?.includes("veg") && !recipe.diet?.includes("non-veg");

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
        >
          <IconArrowLeft className="w-4 h-4" />
          {t("back")}
        </button>

        <div className="recipe-card overflow-hidden">
          {recipe.image && (
            <div className="relative h-64 overflow-hidden">
              <img src={recipe.image} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              {isTrending && (
                <span className="trending-badge absolute left-4 top-4">{t("hotMakings")}</span>
              )}
            </div>
          )}
          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl text-[var(--text-primary)]">{recipe.nameHi}</h1>
                <p className="mt-1 text-[var(--text-secondary)]">{recipe.name}</p>
              </div>
              <button
                onClick={() => setIsFav(toggleLocalFavorite(id))}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition ${
                  isFav
                    ? "border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "glass text-[var(--text-secondary)] hover:text-[var(--accent)]"
                }`}
              >
                <IconHeart filled={isFav} className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[var(--text-secondary)]">
              <span className="rounded-full bg-white/40 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-primary)]">
                {isVeg ? t("veg") : t("nonVeg")}
              </span>
              <span className="flex items-center gap-1.5">
                <IconClock className="w-4 h-4" />
                {recipe.cookTime} {t("min")}
              </span>
              <span>{recipe.calories} cal</span>
              <span className="capitalize">{recipe.cuisine}</span>
              {rating.count > 0 && (
                <span className="flex items-center gap-1 text-[var(--accent)]">
                  <IconStar filled className="w-4 h-4" />
                  {rating.average} ({rating.count})
                </span>
              )}
            </div>

            <div className="mt-6 border-t border-white/40 pt-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{t("rate")}</p>
              <StarRating value={displayRating} onRate={handleRate} interactive />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link to={`/cook/${recipe.id}`} className="premium-btn flex-1 py-3.5 text-center text-sm">
                {t("startCooking")}
              </Link>
              <button
                onClick={() => shareOnWhatsApp(recipe)}
                className="premium-btn-outline inline-flex flex-1 items-center justify-center gap-2 py-3.5 text-sm"
              >
                <IconShare className="w-4 h-4" />
                {t("share")}
              </button>
            </div>
          </div>
        </div>

        {recipe.stepsHi?.length > 0 && (
          <div className="recipe-card mt-6 p-6 sm:p-8">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{t("steps")}</h2>
            <ol className="mt-4 space-y-3">
              {recipe.stepsHi.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-[var(--text-primary)]">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--text-primary)] text-xs font-semibold text-[var(--cream-light)]">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="recipe-card mt-6 p-6 sm:p-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{t("ingredients")}</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {recipe.ingredients.map((ing) => (
              <li key={ing.name} className="rounded-xl bg-white/40 px-4 py-3 text-sm">
                <span className="font-medium text-[var(--text-primary)]">{ing.nameHi}</span>
                <span className="text-[var(--text-secondary)]"> — {ing.quantity}</span>
              </li>
            ))}
          </ul>
        </div>

        {similar.length > 0 && (
          <div className="mt-10">
            <h2 className="font-display text-xl text-[var(--text-primary)]">{t("similarRecipes")}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {similar.map((r) => (
                <RecipeCard key={r.id} recipe={r} trending />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
