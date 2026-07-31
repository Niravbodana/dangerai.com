import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { fetchRecipe, submitReview } from "../api";
import { getGuestId } from "../lib/guest";
import BrandLogo from "../components/BrandLogo";
import ReviewForm from "../components/ReviewForm";
import LoadingSpinner from "../components/LoadingSpinner";

export default function RecipeReview() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const fromCooking = searchParams.get("from") === "cook";
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetchRecipe(id)
      .then((data) => setRecipe(data.recipe))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (score, comment) => {
    setSubmitting(true);
    try {
      await submitReview(id, score, comment, getGuestId());
      setDone(true);
    } finally {
      setSubmitting(false);
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
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-[var(--text-secondary)]">Recipe not found</p>
        <Link to="/recipes" className="text-sm text-[var(--accent-soft)]">Browse recipes</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-lg px-4 py-12">
        <BrandLogo light className="mb-8 h-9 w-auto" />

        {done ? (
          <div className="glass-strong rounded-3xl p-8 text-center">
            <p className="text-4xl">☺️</p>
            <h1 className="mt-4 font-display text-2xl text-[var(--text-primary)]">Thank you!</h1>
            <p className="mt-2 text-[var(--text-secondary)]">Your review helps other home cooks discover great recipes.</p>
            <div className="mt-8 flex flex-col gap-3">
              <Link to={`/recipe/${id}`} className="premium-btn py-3 text-sm">View Recipe</Link>
              <Link to="/recipes" className="premium-btn-outline py-3 text-sm">Browse More Recipes</Link>
            </div>
          </div>
        ) : (
          <div className="glass-strong rounded-3xl p-8">
            {fromCooking && (
              <p className="mb-2 text-sm text-[var(--accent-soft)]">Cooking complete!</p>
            )}
            <h1 className="font-display text-2xl text-[var(--text-primary)]">
              How was {recipe.name}?
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
              If you enjoyed cooking with me, please leave a review ☺️
            </p>

            <div className="mt-6 flex items-center gap-4 rounded-2xl bg-white/5 p-4">
              <img src={recipe.image} alt="" className="h-16 w-16 rounded-xl object-cover" />
              <div>
                <p className="font-semibold text-[var(--text-primary)]">{recipe.name}</p>
                <p className="text-xs capitalize text-[var(--text-secondary)]">{recipe.cuisine}</p>
              </div>
            </div>

            <div className="mt-8">
              <ReviewForm onSubmit={handleSubmit} loading={submitting} />
            </div>

            <button
              type="button"
              onClick={() => navigate(fromCooking ? "/recipes" : `/recipe/${id}`)}
              className="mt-4 w-full text-center text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
