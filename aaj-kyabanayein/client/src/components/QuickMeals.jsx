import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchRecipes } from "../api";
import RecipeImage from "./RecipeImage";
import { IconArrowRight, IconClock } from "./Icons";

export default function QuickMeals() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchRecipes({ limit: 8, maxCookTime: 20 })
        .then((data) => setRecipes((data.recipes || []).slice(0, 8)))
        .catch(() => setRecipes([]))
        .finally(() => setLoading(false));
    }, 400);
    return () => window.clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <section className="border-t border-white/[0.06] py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="h-8 w-56 animate-pulse rounded bg-white/10" />
          <div className="mt-6 flex gap-4 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-44 w-44 shrink-0 animate-pulse rounded-2xl bg-white/10" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!recipes.length) return null;

  return (
    <section className="border-t border-white/[0.06] py-12 sm:py-14">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
              Jaldi banaye
            </p>
            <h2 className="mt-1 font-display text-2xl text-[var(--text-primary)] sm:text-3xl">
              20 minute ke andar
            </h2>
            <p className="mt-2 max-w-md text-sm text-[var(--text-secondary)]">
              Busy evening? Yeh quick picks photos ke saath ready hain.
            </p>
          </div>
          <Link
            to="/collections/15-min"
            className="hidden items-center gap-1.5 text-sm font-medium text-[var(--accent-soft)] sm:inline-flex"
          >
            Sab dekho
            <IconArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="quick-scroll mt-8">
        <div className="quick-track">
          {recipes.map((recipe) => {
            const imageUrl = recipe.thumbUrl || recipe.imageUrl || `/api/recipes/image/${recipe.id}`;
            const useRemote = /^https?:\/\//i.test(imageUrl);
            return (
              <Link key={recipe.id} to={`/recipe/${recipe.id}`} className="quick-card group">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#1a1612]">
                  <RecipeImage
                    src={imageUrl}
                    alt={recipe.name}
                    recipeId={useRemote ? "" : recipe.id}
                    version={recipe._imageVersion || 0}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#14110e] via-[#14110e]/25 to-transparent" />
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-lg bg-black/55 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-md">
                    <IconClock className="h-3 w-3" />
                    {recipe.cookTime || 20} min
                  </span>
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="font-semibold leading-snug text-white line-clamp-2">{recipe.name}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
