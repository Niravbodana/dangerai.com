import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCategories } from "../api";
import { useLanguage } from "../context/LanguageContext";

export default function CuisineExplorer() {
  const { t, lang } = useLanguage();
  const [cuisines, setCuisines] = useState([]);
  const [counts, setCounts] = useState({});

  useEffect(() => {
    fetchCategories().then((data) => {
      setCuisines((data.cuisines || []).filter((c) => c.id !== "all"));
      setCounts(data.cuisineCounts || {});
    });
  }, []);

  if (!cuisines.length) return null;

  return (
    <section className="section-padding">
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
          {t("browseByCuisine")}
        </p>
        <h2 className="mt-1 font-display text-2xl text-[var(--text-primary)]">{t("cuisineTitle")}</h2>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {cuisines.map((c) => (
            <Link
              key={c.id}
              to={`/recipes?cuisine=${c.id}`}
              className="cuisine-tile group"
            >
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {lang === "hi" ? c.labelHi || c.label : c.label}
              </p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                {(counts[c.id] || 0).toLocaleString()} {t("recipesCount")}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
