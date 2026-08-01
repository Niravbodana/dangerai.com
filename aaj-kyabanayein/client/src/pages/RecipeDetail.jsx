import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchRecipe, fetchRecipeRating, fetchReviews, fetchTrendingRecipes, submitReview, addSavedMeal } from "../api";
import { useLanguage } from "../context/LanguageContext";
import { getGuestId, isFavorite, shareOnWhatsApp, toggleFavorite } from "../lib/guest";
import LoadingSpinner from "../components/LoadingSpinner";
import RecipeCard from "../components/RecipeCard";
import RecipeImage from "../components/RecipeImage";
import { VegSymbol, NonVegSymbol } from "../components/DietSymbols";
import ReviewForm from "../components/ReviewForm";
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
            s <= Math.round(value) ? "text-[var(--accent-soft)]" : "text-white/25"
          }`}
        >
          <IconStar filled={s <= Math.round(value)} className="w-5 h-5" />
        </button>
      ))}
    </div>
  );
}

function MetaChip({ children, accent, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${className} ${
        accent
          ? "bg-[var(--accent-green)]/20 text-[var(--accent-green)]"
          : "border border-white/10 bg-white/5 text-[var(--text-secondary)]"
      }`}
    >
      {children}
    </span>
  );
}

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [recipe, setRecipe] = useState(null);
  const [rating, setRating] = useState({ average: 0, count: 0 });
  const [reviews, setReviews] = useState([]);
  const [isFav, setIsFav] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [planAdded, setPlanAdded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isTrending, setIsTrending] = useState(false);
  const [similar, setSimilar] = useState([]);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetchRecipe(id),
      fetchRecipeRating(id),
      fetchReviews(id),
      fetchTrendingRecipes(12),
    ])
      .then(([recipeData, ratingData, reviewsData, trendingData]) => {
        setRecipe(recipeData.recipe);
        setRating(ratingData);
        setReviews(reviewsData.reviews || []);
        setIsFav(isFavorite(id));
        const trending = trendingData.recipes || [];
        setIsTrending(trending.some((tr) => tr.id === id));
        const cuisine = recipeData.recipe?.cuisine;
        setSimilar(trending.filter((tr) => tr.id !== id && tr.cuisine === cuisine).slice(0, 4));
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleReview = async (score, comment) => {
    setSubmitting(true);
    try {
      const data = await submitReview(id, score, comment, getGuestId());
      setRating(data);
      setUserRating(score);
      const reviewsData = await fetchReviews(id);
      setReviews(reviewsData.reviews || []);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFav = async () => {
    const nowFav = await toggleFavorite(id);
    setIsFav(nowFav);
    const ratingData = await fetchRecipeRating(id);
    setRating(ratingData);
  };

  const handleAddToPlan = async () => {
    try {
      await addSavedMeal({ recipeId: id, mealType: recipe.mealType || "lunch", guestId: getGuestId() });
      setPlanAdded(true);
    } catch {
      /* ignore */
    }
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
        <Link to="/recipes" className="text-sm text-[var(--accent-soft)] hover:underline">{t("browseRecipes")}</Link>
      </div>
    );
  }

  const displayRating = userRating || rating.average;
  const isVeg = recipe.diet?.includes("veg") && !recipe.diet?.includes("non-veg");
  const displayName = lang === "hi" ? (recipe.nameHi || recipe.name) : recipe.name;
  const steps = lang === "hi"
    ? (recipe.stepsHi?.length ? recipe.stepsHi : recipe.steps)
    : (recipe.steps?.length ? recipe.steps : recipe.stepsHi);

  return (
    <div className="recipe-detail-page min-h-screen pb-28">
      <div className="relative mx-auto max-w-3xl">
        {/* Hero */}
        <div className="relative h-72 overflow-hidden sm:h-80">
          <RecipeImage
            src={`/api/recipes/image/${recipe.id}`}
            alt={displayName}
            recipeId={recipe.id}
            eager
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#14110e] via-[#14110e]/40 to-transparent" />

          <button
            onClick={() => navigate(-1)}
            className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur-md transition hover:bg-black/60"
            aria-label={t("back")}
          >
            <IconArrowLeft className="h-5 w-5" />
          </button>

          <button
            onClick={handleFav}
            className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-md transition ${
              isFav
                ? "border-[var(--accent)]/40 bg-[var(--accent)]/20 text-[var(--accent-soft)]"
                : "border-white/15 bg-black/40 text-white hover:bg-black/60"
            }`}
            aria-label={isFav ? t("removeFavorite") : t("addFavorite")}
          >
            <IconHeart filled={isFav} className="h-5 w-5" />
          </button>

          {isTrending && (
            <span className="trending-badge absolute bottom-4 left-4">{t("hotMakings")}</span>
          )}
        </div>

        {/* Content */}
        <div className="relative -mt-8 px-4">
          <div className="recipe-card overflow-hidden">
            <div className="p-6 sm:p-8">
              <h1 className="font-display text-3xl tracking-tight text-[var(--text-primary)]">{displayName}</h1>
              <p className="mt-1 capitalize text-sm text-[var(--text-secondary)]">
                {lang === "hi" ? `${recipe.cuisine} व्यंजन` : `${recipe.cuisine} cuisine`}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <MetaChip accent={isVeg}>
                <span className="flex items-center gap-1.5">
                  {isVeg ? <VegSymbol className="h-3.5 w-3.5 text-[#4ade80]" /> : <NonVegSymbol className="h-3.5 w-3.5 text-[#f87171]" />}
                  {isVeg ? t("veg") : t("nonVeg")}
                </span>
              </MetaChip>
                <MetaChip>
                  <IconClock className="h-3.5 w-3.5" />
                  {recipe.cookTime} {t("min")}
                </MetaChip>
                <MetaChip>{recipe.calories} cal</MetaChip>
                {recipe.budget && (
                  <MetaChip className="capitalize">{recipe.budget} budget</MetaChip>
                )}
                {rating.count > 0 && (
                  <MetaChip>
                    <IconStar filled className="h-3.5 w-3.5 text-[var(--accent-soft)]" />
                    {rating.average} ({rating.count})
                  </MetaChip>
                )}
              </div>

              {recipe.tags?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {recipe.tags.slice(0, 5).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/8 bg-white/5 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--text-secondary)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Ingredients */}
          <div className="recipe-card mt-4 p-6 sm:p-8">
            <h2 className="detail-section-title">{t("ingredients")}</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {recipe.ingredients.length} {lang === "hi" ? "चीज़ें चाहिए" : "items needed"}
            </p>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {recipe.ingredients.map((ing) => (
                <li key={ing.name} className="ingredient-row">
                  <span className="ingredient-dot" />
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-[var(--text-primary)]">
                      {lang === "hi" ? (ing.nameHi || ing.name) : ing.name}
                    </span>
                    <span className="text-[var(--text-secondary)]"> — {ing.quantity}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Steps */}
          {steps?.length > 0 && (
            <div className="recipe-card mt-4 p-6 sm:p-8">
              <h2 className="detail-section-title">{t("steps")}</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {steps.length} {lang === "hi" ? "कदम" : "steps to follow"}
              </p>
              <ol className="mt-5 space-y-4">
                {steps.map((step, i) => (
                  <li key={i} className="step-row">
                    <span className="step-number">{i + 1}</span>
                    <p className="text-sm leading-relaxed text-[var(--text-primary)]">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Reviews */}
          <div className="recipe-card mt-4 p-6 sm:p-8">
            <h2 className="detail-section-title">Reviews & Ratings</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Favoriting counts as a 5-star rating too.
            </p>
            <div className="mt-4 flex items-center gap-4">
              <StarRating value={displayRating} />
              <span className="text-sm text-[var(--text-secondary)]">
                {rating.count > 0 ? `${rating.average} / 5 · ${rating.count} ratings` : "Be the first to review"}
              </span>
            </div>
            <div className="mt-6">
              <ReviewForm onSubmit={handleReview} loading={submitting} submitLabel="Submit Review" />
            </div>
            {reviews.length > 0 && (
              <div className="mt-8 space-y-4 border-t border-white/10 pt-6">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Recent reviews</h3>
                {reviews.map((r, i) => (
                  <div key={i} className="rounded-xl bg-white/5 p-4">
                  <div className="flex items-center gap-2">
                    <StarRating value={r.score} />
                    <span className="text-xs font-medium text-[var(--text-primary)]">
                      {r.userName || "Home cook"}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                    {r.comment && (
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">{r.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {similar.length > 0 && (
            <div className="mt-8 pb-4">
              <h2 className="font-display text-xl text-[var(--text-primary)]">{t("similarRecipes")}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {similar.map((r) => (
                  <RecipeCard key={r.id} recipe={r} trending lazyImage={false} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky bottom CTA */}
      <div className="recipe-detail-cta safe-bottom">
        <div className="mx-auto flex max-w-3xl gap-3 px-4">
          <button
            type="button"
            onClick={handleAddToPlan}
            disabled={planAdded}
            className="premium-btn-outline tap-smooth shrink-0 px-4 py-4 text-sm"
          >
            {planAdded ? t("addedToPlan") : t("addToPlan")}
          </button>
          <button
            type="button"
            onClick={() => shareOnWhatsApp(recipe)}
            className="premium-btn-outline tap-smooth flex h-14 w-14 shrink-0 items-center justify-center"
            aria-label={t("share")}
          >
            <IconShare className="h-5 w-5" />
          </button>
          <Link
            to={`/cook/${recipe.id}`}
            className="premium-btn tap-smooth flex flex-1 items-center justify-center gap-2 py-4 text-base font-semibold"
          >
            {t("startCooking")}
          </Link>
        </div>
      </div>
    </div>
  );
}
