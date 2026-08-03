import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchRecipe, fetchTrendingRecipes } from "../api";
import { useLanguage } from "../context/LanguageContext";
import {
  getRecentRecipeIds,
  isEligibleForCookAgain,
  sanitizeRecentRecipes,
} from "../lib/recentRecipes";
import RecipeImage from "./RecipeImage";

export default function RecentCooksStrip() {
  const { t, lang } = useLanguage();
  const [items, setItems] = useState([]);

  useEffect(() => {
    sanitizeRecentRecipes();
    const ids = getRecentRecipeIds(12);

    async function load() {
      const fromRecent = ids.length
        ? await Promise.all(
            ids.map((id) =>
              fetchRecipe(id)
                .then((d) => d?.recipe)
                .catch(() => null)
            )
          )
        : [];

      let recipes = fromRecent.filter((r) => r && isEligibleForCookAgain(r));

      if (recipes.length < 4) {
        try {
          const trending = await fetchTrendingRecipes(8);
          const extra = (trending.recipes || []).filter(isEligibleForCookAgain);
          const seen = new Set(recipes.map((r) => r.id));
          for (const r of extra) {
            if (!seen.has(r.id)) {
              recipes.push(r);
              seen.add(r.id);
            }
            if (recipes.length >= 6) break;
          }
        } catch {
          /* ignore */
        }
      }

      setItems(recipes.slice(0, 6));
    }

    load();
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
                    src=""
                    alt={name}
                    recipeId={recipe.id}
                    eager={false}
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
