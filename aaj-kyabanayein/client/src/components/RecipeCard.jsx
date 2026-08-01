import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { isFavorite, toggleFavorite } from '../lib/guest';
import RecipeImage from './RecipeImage';
import { VegSymbol, NonVegSymbol } from './DietSymbols';
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

function StarRow({ average, count }) {
  const rounded = Math.round(average || 0);
  return (
    <div className="flex items-center justify-between gap-2 border-t border-white/8 pt-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <IconStar
            key={s}
            filled={s <= rounded}
            className={`h-3.5 w-3.5 ${s <= rounded ? 'text-[var(--accent-soft)]' : 'text-white/20'}`}
          />
        ))}
      </div>
      <span className="text-xs text-[var(--text-secondary)]">
        {count > 0 ? (
          <><span className="font-semibold text-[var(--accent-soft)]">{average}</span> · {count.toLocaleString()} ratings</>
        ) : (
          'No ratings yet'
        )}
      </span>
    </div>
  );
}

export default function RecipeCard({ recipe, onFavoriteChange, trending = false, rank }) {
  const { t, lang } = useLanguage();
  const [fav, setFav] = useState(isFavorite(recipe.id));
  const veg = isVeg(recipe.diet);
  const rating = recipe.rating || recipe.trendingRating;
  const cooks = rating?.count;

  const handleFav = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const nowFav = await toggleFavorite(recipe.id);
    setFav(nowFav);
    onFavoriteChange?.();
  };

  return (
    <Link
      to={`/recipe/${recipe.id}`}
      className={`recipe-card catalog-card group block overflow-hidden ${trending ? 'recipe-card--trending' : ''}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#242018]">
        <RecipeImage
          src={recipe.image}
          alt={recipe.name}
          recipeId={recipe.id}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14110e]/80 via-transparent to-transparent" />

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
            fav ? 'bg-[var(--accent)] text-[#14110e]' : 'bg-black/40 text-white hover:bg-[var(--accent)]/80'
          }`}
          aria-label={fav ? t('removeFavorite') : t('addFavorite')}
        >
          <IconHeart filled={fav} className="w-4 h-4" />
        </button>

        <span className={`absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
          veg
            ? 'border border-[#22c55e]/40 bg-[#22c55e]/15 text-[#4ade80]'
            : 'border border-[#ef4444]/40 bg-[#ef4444]/15 text-[#f87171]'
        }`}>
          {veg ? <VegSymbol className="h-3 w-3" /> : <NonVegSymbol className="h-3 w-3" />}
          {veg ? t('veg') : t('nonVeg')}
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-[var(--text-primary)] line-clamp-1 tracking-tight">
          {lang === "hi" ? (recipe.nameHi || recipe.name) : recipe.name}
        </h3>
        <p className="mt-0.5 text-xs capitalize text-[var(--text-secondary)]">{recipe.cuisine}</p>

        <div className="mt-2 flex items-center gap-3 text-xs text-[var(--text-secondary)]">
          <span className="flex items-center gap-1">
            <IconClock className="w-3.5 h-3.5" />
            {recipe.cookTime || recipe.time} {t('min')}
          </span>
          {trending && cooks > 0 && (
            <span className="flex items-center gap-1">
              <IconUsers className="w-3 h-3" />
              {formatCooks(cooks)} {t('cooks')}
            </span>
          )}
        </div>

        <StarRow average={rating?.average} count={rating?.count} />
      </div>
    </Link>
  );
}
