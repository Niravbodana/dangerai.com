import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchRecipe } from "../api";
import { useLanguage } from "../context/LanguageContext";
import { getRecentRecipeIds } from "../lib/recentRecipes";
import RecipeImage from "./RecipeImage";

export default function RecentCooksStrip() {
  const { t, lang } = useLanguage();
  const [items, setItems] = useState([]);

  useEffect(() => {
    const ids = getRecentRecipeIds(6);
    if (!ids.length) return;
    Promise.all(
      ids.map((id) =>
        fetchRecipe(id)
          .then((d) => d?.recipe)
          .catch(() => null)
      )
    ).then((recipes) => setItems(recipes.filter(Boolean)));
  }, []);

  if (!items.length) return null;

  return (
    <section className="border-t border-white/[0.06] py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl text-[var(--text-primary)] sm:text-2xl">{t("cookAgain")}</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{t("cookAgainDesc")}</p>
          </div>
        </div>
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
          {items.map((recipe) => {
            const name = lang === "hi" ? (recipe.nameHi || recipe.name) : recipe.name;
            return (
              <Link
                key={recipe.id}
                to={`/recipe/${recipe.id}`}
                className="recipe-card tap-smooth flex w-[9.5rem] shrink-0 flex-col overflow-hidden sm:w-[10.5rem]"
              >
                <div className="relative aspect-[4/3] bg-[#1a1612]">
                  <RecipeImage
                    src={recipe.thumbUrl || recipe.imageUrl}
                    alt={name}
                    recipeId={recipe.thumbUrl ? "" : recipe.id}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <p className="line-clamp-2 text-xs font-semibold leading-snug text-[var(--text-primary)]">{name}</p>
                  <p className="mt-1 text-[10px] text-[var(--accent-soft)]">{t("cookAgainCta")} →</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
