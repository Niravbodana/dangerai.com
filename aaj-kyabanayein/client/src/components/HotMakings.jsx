import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchTrendingRecipes } from '../api';
import { useLanguage } from '../context/LanguageContext';
import RecipeCard from './RecipeCard';
import { IconArrowRight } from './Icons';

export default function HotMakings() {
  const { t } = useLanguage();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingRecipes(8)
      .then((data) => setRecipes(data.recipes || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="section-padding">
        <div className="mx-auto max-w-6xl px-4">
          <div className="h-8 w-48 animate-pulse rounded bg-white/10" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-white/10" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!recipes.length) return null;

  return (
    <section className="section-padding">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
              {t('hotSubtitle')}
            </p>
            <h2 className="mt-1 font-display text-3xl text-[var(--text-primary)]">
              {t('hotMakings')}
            </h2>
            <p className="mt-2 max-w-lg text-sm text-[var(--text-secondary)]">{t('hotDesc')}</p>
          </div>
          <Link
            to="/recipes?sort=trending"
            className="hidden items-center gap-1.5 text-sm font-medium text-stone-600 transition hover:text-orange-600 sm:flex"
          >
            {t('viewAll')}
            <IconArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              trending
              rank={recipe.trendingRank}
            />
          ))}
        </div>

        <Link
          to="/recipes?sort=trending"
          className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-stone-600 sm:hidden"
        >
          {t('viewAll')}
          <IconArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
