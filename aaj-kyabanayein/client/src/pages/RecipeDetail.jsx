import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchRecipe, fetchRecipeLoad, fetchRecipeRating, fetchReviews, fetchTrendingRecipes, submitReview, addSavedMeal, rateRecipe } from "../api";
import { useLanguage } from "../context/LanguageContext";
import { getGuestId, isFavorite, shareOnWhatsApp, toggleFavorite } from "../lib/guest";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";
import { shouldShowFavoriteSignup } from "../lib/accountWall";
import RecipeCard from "../components/RecipeCard";
import RecipeVideoEmbed from "../components/RecipeVideoEmbed";
import RecipeImage from "../components/RecipeImage";
import { VegSymbol, NonVegSymbol } from "../components/DietSymbols";
import ReviewForm from "../components/ReviewForm";
import { IconArrowLeft, IconClock, IconHeart, IconShare, IconStar } from "../components/Icons";
import { track } from "../lib/analytics";
import { canSaveOfflinePack, saveOfflinePack } from "../lib/offlinePacks";
import usePageSeo from "../hooks/usePageSeo";
import { breadcrumbSchema, recipeSchema } from "../lib/seo";
import { getRecipeNutrition } from "../lib/nutrition";
import NutritionSummary from "../components/NutritionSummary";
import { copyIngredients, printRecipe } from "../lib/recipeShare";
import { getRecipeVideoId } from "../lib/recipeVideo";

function StarRating({ value, onRate, interactive = false }) {
  return (
    <div className="flex gap-1" role={interactive ? "group" : undefined} aria-label={interactive ? "Rate this recipe" : undefined}>
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onRate?.(s)}
          aria-label={interactive ? `Rate ${s} out of 5 stars` : `${s} stars`}
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
  const { user } = useAuth();
  const { openSignup } = useAuthModal();
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
  const [imageVersion, setImageVersion] = useState(0);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [offlineSaved, setOfflineSaved] = useState(false);
  const [copiedIngredients, setCopiedIngredients] = useState(false);

  const load = () => {
    setLoading(true);
    setLoadingMedia(true);
    setIsFav(isFavorite(id));
    track("recipe_open", { id });

    // FAST: show base recipe immediately
    fetchRecipe(id)
      .then((data) => {
        if (data?.recipe) {
          setRecipe(data.recipe);
          setLoading(false);
        }
      })
      .catch(() => {});

    // Parallel: ratings + reviews + trending (non-blocking for recipe body)
    fetchRecipeRating(id, getGuestId()).then((ratingData) => {
      setRating(ratingData);
      setUserRating(ratingData.userScore || 0);
    }).catch(() => {});

    fetchReviews(id).then((reviewsData) => {
      setReviews(reviewsData.reviews || []);
    }).catch(() => {});

    fetchTrendingRecipes(12).then((trendingData) => {
      const trending = trendingData.recipes || [];
      setIsTrending(trending.some((tr) => tr.id === id));
      setSimilar(trending.filter((tr) => tr.id !== id).slice(0, 4));
    }).catch(() => {});

    // Enrich ingredients + photo in background (Groq pipeline, budgeted)
    fetchRecipeLoad(id)
      .then((loadData) => {
        setRecipe(loadData.recipe);
        setImageVersion(Date.now());
        setLoadingMedia(false);
        const cuisine = loadData.recipe?.cuisine;
        fetchTrendingRecipes(12).then((trendingData) => {
          const trending = trendingData.recipes || [];
          setSimilar(trending.filter((tr) => tr.id !== id && tr.cuisine === cuisine).slice(0, 4));
        }).catch(() => {});
      })
      .catch(() => setLoadingMedia(false))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const pageSeo = useMemo(() => {
    if (!recipe) return null;
    const name = lang === "hi" ? (recipe.nameHi || recipe.name) : recipe.name;
    return {
      seo: {
        title: `${name} Recipe — ${recipe.cookTime || 30} min | Rasoira`,
        description: `How to make ${recipe.name} at home. ${recipe.ingredients?.length || 0} ingredients, step-by-step cooking on Rasoira.`,
        path: `/recipe/${recipe.id}`,
        image: recipe.thumbUrl || `/api/recipes/image/${recipe.id}`,
        type: "article",
      },
      jsonLd: [
        recipeSchema(recipe, rating),
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Recipes", path: "/recipes" },
          { name, path: `/recipe/${recipe.id}` },
        ]),
      ],
    };
  }, [recipe, rating, lang]);

  usePageSeo(pageSeo);

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

  const handleQuickRate = async (score) => {
    setUserRating(score);
    try {
      const data = await rateRecipe(id, score, getGuestId());
      setRating(data);
    } catch {
      /* ignore */
    }
  };

  const handleFav = async () => {
    const nowFav = await toggleFavorite(id, {
      onSignupPrompt: (count) => {
        if (shouldShowFavoriteSignup(!!user, count)) openSignup("favorite");
      },
    });
    setIsFav(nowFav);
    fetchRecipeRating(id, getGuestId()).then(setRating).catch(() => {});
  };

  const handleAddToPlan = async () => {
    try {
      await addSavedMeal({ recipeId: id, mealType: recipe.mealType || "lunch", guestId: getGuestId() });
      setPlanAdded(true);
    } catch {
      /* ignore */
    }
  };

  const handleOfflineSave = () => {
    if (!canSaveOfflinePack()) {
      navigate("/pricing");
      return;
    }
    if (saveOfflinePack(recipe)) {
      setOfflineSaved(true);
      track("offline_pack_save", { id });
    }
  };

  const handleCopyIngredients = async () => {
    try {
      await copyIngredients(recipe, lang);
      setCopiedIngredients(true);
      setTimeout(() => setCopiedIngredients(false), 2500);
    } catch {
      /* clipboard blocked */
    }
  };

  const handlePrint = () => {
    printRecipe(recipe, lang);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="skeleton-shimmer mb-6 h-72 rounded-2xl" />
        <div className="recipe-card space-y-4 p-8">
          <div className="skeleton-shimmer h-8 w-2/3 rounded" />
          <div className="skeleton-shimmer h-4 w-1/3 rounded" />
          <div className="flex gap-2">
            <div className="skeleton-shimmer h-8 w-20 rounded-full" />
            <div className="skeleton-shimmer h-8 w-20 rounded-full" />
          </div>
        </div>
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
            src={recipe.thumbUrl || `/api/recipes/image/${recipe.id}`}
            alt={displayName}
            recipeId={recipe.thumbUrl ? "" : recipe.id}
            eager
            version={imageVersion}
            className="h-full w-full object-cover"
          />
          {loadingMedia && !recipe.thumbUrl && (
            <div className="absolute bottom-4 right-4 rounded-full bg-black/50 px-3 py-1 text-xs text-white/80 backdrop-blur-sm">
              Better photo…
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#14110e] via-[#14110e]/40 to-transparent" />

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur-md transition hover:bg-black/60"
            aria-label={t("back")}
          >
            <IconArrowLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
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

              <div className="mt-5">
                <NutritionSummary nutrition={getRecipeNutrition(recipe)} title="Nutrition (per serving)" compact />
              </div>
            </div>
          </div>

          {/* Ingredients — notes style */}
          <div className="recipe-card mt-4 p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="detail-section-title">{t("ingredients")}</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {lang === "hi"
                    ? `इन ${recipe.ingredients.length} चीज़ों को तैयार रखें — एक-एक करके नोट्स की तरह`
                    : `Gather these ${recipe.ingredients.length} items — step by step like notes`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 no-print">
                <button
                  type="button"
                  onClick={handleCopyIngredients}
                  className="premium-btn-outline tap-smooth px-3 py-2 text-xs"
                >
                  {copiedIngredients ? "Copied!" : "Copy list"}
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="premium-btn-outline tap-smooth px-3 py-2 text-xs"
                >
                  Print
                </button>
              </div>
            </div>
            <ol className="mt-5 space-y-3">
              {recipe.ingredients.map((ing, i) => (
                <li key={`${ing.name}-${i}`} className="ingredient-note">
                  <span className="ingredient-note__num">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-[var(--text-primary)]">
                      {lang === "hi" ? (ing.nameHi || ing.name) : ing.name}
                    </span>
                    <span className="ingredient-note__qty">{ing.quantity}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {getRecipeVideoId(recipe) && <RecipeVideoEmbed recipe={recipe} title={displayName} />}

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
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <StarRating value={displayRating} interactive onRate={handleQuickRate} />
              <span className="text-sm text-[var(--text-secondary)]">
                {userRating
                  ? `You rated ${userRating}★`
                  : rating.count > 0
                    ? `${rating.average} / 5 · ${rating.count} ratings`
                    : "Tap stars to rate"}
              </span>
            </div>
            <div className="mt-6">
              <ReviewForm
                onSubmit={handleReview}
                loading={submitting}
                initialScore={userRating}
                submitLabel="Submit Review"
              />
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
                  <RecipeCard key={r.id} recipe={r} trending />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky bottom CTA */}
      <div className="recipe-detail-cta safe-bottom no-print">
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
            onClick={handleOfflineSave}
            className="premium-btn-outline tap-smooth shrink-0 px-3 py-4 text-xs"
            title="Offline pack (Plus)"
          >
            {offlineSaved ? "Saved" : "Offline"}
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
