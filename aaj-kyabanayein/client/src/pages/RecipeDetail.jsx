import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchRecipe, fetchRecipeRating, rateRecipe } from "../api";
import { useLanguage } from "../context/LanguageContext";
import { getGuestId, isLocalFavorite, shareOnWhatsApp, toggleLocalFavorite } from "../lib/guest";
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
          className={`transition ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} ${
            s <= Math.round(value) ? 'text-amber-500' : 'text-stone-200'
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

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-orange-500" />
      </div>
    );
  }

  if (!recipe) {
    return <div className="flex min-h-[50vh] items-center justify-center text-stone-500">Not found</div>;
  }

  const displayRating = userRating || rating.average;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-stone-500 transition hover:text-stone-900"
        >
          <IconArrowLeft className="w-4 h-4" />
          {t("back")}
        </button>

        <div className="recipe-card overflow-hidden">
          {recipe.image && (
            <div className="relative h-64 overflow-hidden">
              <img src={recipe.image} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900/40 to-transparent" />
            </div>
          )}
          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl font-semibold tracking-tight text-stone-900">{recipe.nameHi}</h1>
                <p className="mt-1 text-stone-400">{recipe.name}</p>
              </div>
              <button
                onClick={handleFavorite}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition ${
                  isFav
                    ? 'border-orange-200 bg-orange-50 text-orange-600'
                    : 'border-stone-200 text-stone-400 hover:border-orange-200 hover:text-orange-500'
                }`}
              >
                <IconHeart filled={isFav} className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-stone-500">
              <span className="flex items-center gap-1.5">
                <IconClock className="w-4 h-4" />
                {recipe.cookTime} {t("min")}
              </span>
              <span>{recipe.calories} cal</span>
              <span className="capitalize">{recipe.cuisine}</span>
              {rating.count > 0 && (
                <span className="flex items-center gap-1 text-amber-600">
                  <IconStar filled className="w-4 h-4" />
                  {rating.average} <span className="text-stone-400">({rating.count})</span>
                </span>
              )}
            </div>

            <div className="mt-6 border-t border-stone-100 pt-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">{t("rate")}</p>
              <StarRating value={displayRating} onRate={handleRate} interactive />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link to={`/cook/${recipe.id}`} className="premium-btn flex-1 py-3.5 text-center text-sm">
                {t("startCooking")}
              </Link>
              <button
                onClick={handleShare}
                className="premium-btn-outline inline-flex flex-1 items-center justify-center gap-2 py-3.5 text-sm"
              >
                <IconShare className="w-4 h-4" />
                {t("share")}
              </button>
            </div>
          </div>
        </div>

        <div className="recipe-card mt-6 p-6 sm:p-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400">{t("ingredients")}</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {recipe.ingredients.map((ing) => (
              <li key={ing.name} className="rounded-xl bg-stone-50 px-4 py-3 text-sm text-stone-700">
                <span className="font-medium text-stone-900">{ing.nameHi}</span>
                <span className="text-stone-400"> — {ing.quantity}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
