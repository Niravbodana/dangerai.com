import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import RecipeImage from "./RecipeImage";

/** Verified trending Indian recipes — high-quality photos only (no recent history junk) */
export default function RecentCooksStrip() {
  const { t, lang } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/recipes/featured-strip?limit=6")
      .then((r) => r.json())
      .then((data) => {
        setItems(data.recipes || []);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="border-t border-white/[0.06] py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="h-7 w-40 animate-pulse rounded bg-white/10" />
          <div className="mt-4 flex gap-3 overflow-x-auto">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-36 w-[9.5rem] shrink-0 animate-pulse rounded-2xl bg-white/10" />
            ))}
          </div>
        </div>
      </section>
    );
  }

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
                    eager
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
