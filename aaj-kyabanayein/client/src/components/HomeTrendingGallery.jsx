import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchTrendingRecipes } from "../api";
import RecipeImage from "./RecipeImage";

export default function HomeTrendingGallery() {
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    fetchTrendingRecipes(6)
      .then((data) => setRecipes(data.recipes || []))
      .catch(() => {});
  }, []);

  if (!recipes.length) return null;

  return (
    <section className="home-section border-t border-white/[0.06]">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl text-[var(--text-primary)] sm:text-3xl">Ghar ka swad</h2>
          <Link to="/recipes?sort=trending" className="text-sm text-[var(--accent-soft)] hover:underline">
            Sab dekho →
          </Link>
        </div>
        <div className="home-gallery-scroll mt-6">
          <div className="home-gallery-track">
            {recipes.map((recipe) => (
              <Link key={recipe.id} to={`/recipe/${recipe.id}`} className="home-gallery-card group">
                <RecipeImage
                  recipeId={recipe.id}
                  src={recipe.imageUrl || recipe.thumbUrl}
                  alt={recipe.name}
                  className="h-full w-full object-cover"
                />
                <div className="home-gallery-card__overlay">
                  <span className="home-gallery-card__tag">{recipe.cuisine || "Indian"}</span>
                  <p className="font-semibold text-white">{recipe.nameHi || recipe.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
