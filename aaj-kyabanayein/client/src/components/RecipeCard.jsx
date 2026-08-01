import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { isFavorite, toggleFavorite } from '../lib/guest';
import RecipeImage from './RecipeImage';
import { VegSymbol, NonVegSymbol } from './DietSymbols';
import { IconClock, IconFlame, IconHeart, IconStar } from './Icons';

function isVeg(diet) {
  if (Array.isArray(diet)) return diet.includes('veg') && !diet.includes('non-veg');
  return diet === 'veg';
}

export default function RecipeCard({ recipe, onFavoriteChange, trending = false, rank }) {
  const { t, lang } = useLanguage();
  const [fav, setFav] = useState(isFavorite(recipe.id));
  const veg = isVeg(recipe.diet);
  const rating = recipe.rating || recipe.trendingRating;
  const displayName = lang === 'hi' ? (recipe.nameHi || recipe.name) : recipe.name;
  const imageUrl = recipe.thumbUrl || recipe.imageUrl || `/api/recipes/image/${recipe.id}`;
  const useRemote = /^https?:\/\//i.test(imageUrl);

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
      <div className="relative aspect-[4/3] overflow-hidden bg-[#1a1612]">
        <RecipeImage
          src={imageUrl}
          alt={displayName}
          recipeId={useRemote ? "" : recipe.id}
          version={recipe._imageVersion || 0}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14110e]/90 via-[#14110e]/20 to-transparent" />

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
            fav ? 'bg-[var(--accent)] text-[#14110e]' : 'bg-black/50 text-white hover:bg-black/70'
          }`}
          aria-label={fav ? t('removeFavorite') : t('addFavorite')}
        >
          <IconHeart filled={fav} className="w-4 h-4" />
        </button>

        <span className={`absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
          veg
            ? 'border border-[#22c55e]/40 bg-[#22c55e]/20 text-[#4ade80]'
            : 'border border-[#ef4444]/40 bg-[#ef4444]/20 text-[#f87171]'
        }`}>
          {veg ? <VegSymbol className="h-3 w-3" /> : <NonVegSymbol className="h-3 w-3" />}
          {veg ? t('veg') : t('nonVeg')}
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-[var(--text-primary)] line-clamp-1 tracking-tight">{displayName}</h3>
        <p className="mt-0.5 text-xs capitalize text-[var(--text-secondary)]">{recipe.cuisine}</p>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
            <IconClock className="w-3.5 h-3.5" />
            {recipe.cookTime || recipe.time} {t('min')}
          </span>
          {recipe.calories > 0 && (
            <span className="text-xs text-[var(--text-secondary)]">{recipe.calories} cal</span>
          )}
        </div>

        {rating?.count > 0 && (
          <div className="mt-2.5 flex items-center gap-1.5 border-t border-white/8 pt-2.5">
            <IconStar filled className="h-3.5 w-3.5 text-[var(--accent-soft)]" />
            <span className="text-xs text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--accent-soft)]">{rating.average}</span>
              {' · '}{rating.count.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
