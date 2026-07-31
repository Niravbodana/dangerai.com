import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { isFavorite, toggleFavorite } from '../lib/guest';
import { IconClock, IconFlame, IconHeart, IconStar, IconUsers } from './Icons';

function isVeg(diet) {
  if (Array.isArray(diet)) return diet.includes('veg') && !diet.includes('non-veg');
  return diet === 'veg';
}

function formatCooks(count) {
  if (!count) return null;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}

export default function RecipeCard({ recipe, onFavoriteChange, trending = false, rank }) {
  const { t } = useLanguage();
  const fav = isFavorite(recipe.id);
  const veg = isVeg(recipe.diet);
  const rating = recipe.rating || recipe.trendingRating;
  const cooks = rating?.count;

  const handleFav = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(recipe.id);
    onFavoriteChange?.();
  };

  return (
    <Link
      to={`/recipe/${recipe.id}`}
      className={`recipe-card group block overflow-hidden ${trending ? 'recipe-card--trending' : ''}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--cream-deep)]/30">
        <img
          src={recipe.image}
          alt={recipe.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/30 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />

        {trending && (
          <span className="trending-badge absolute left-3 top-3">
            <IconFlame className="w-3 h-3" />
            {rank ? `#${rank}` : t('hot')}
          </span>
        )}

        <button
          type="button"
          onClick={handleFav}
          className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition ${
            fav ? 'bg-[var(--text-primary)] text-[var(--cream-light)]' : 'glass text-[var(--text-secondary)] hover:text-[var(--accent)]'
          }`}
          aria-label={fav ? t('removeFavorite') : t('addFavorite')}
        >
          <IconHeart filled={fav} className="w-4 h-4" />
        </button>

        <span className={`absolute bottom-3 left-3 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md ${
          veg ? 'bg-[var(--accent-green)]/85 text-white' : 'bg-[var(--text-primary)]/80 text-[var(--cream-light)]'
        }`}>
          {veg ? t('veg') : t('nonVeg')}
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-[var(--text-primary)] line-clamp-1 tracking-tight">
          {recipe.nameHi || recipe.name}
        </h3>
        <p className="mt-0.5 text-sm text-[var(--text-secondary)] line-clamp-1">{recipe.name}</p>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
            <span className="flex items-center gap-1">
              <IconClock className="w-3.5 h-3.5" />
              {recipe.cookTime || recipe.time} {t('min')}
            </span>
            {rating?.average > 0 && (
              <span className="flex items-center gap-1 text-[var(--accent)]">
                <IconStar filled className="w-3.5 h-3.5" />
                {rating.average}
              </span>
            )}
          </div>
          {trending && cooks > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-stone-400">
              <IconUsers className="w-3 h-3" />
              {formatCooks(cooks)} {t('cooks')}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
