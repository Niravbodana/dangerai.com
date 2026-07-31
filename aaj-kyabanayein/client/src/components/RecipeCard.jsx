import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { isFavorite, toggleFavorite } from '../lib/guest';

function isVeg(diet) {
  if (Array.isArray(diet)) return diet.includes('veg') && !diet.includes('non-veg');
  return diet === 'veg';
}

export default function RecipeCard({ recipe, onFavoriteChange }) {
  const { t } = useLanguage();
  const fav = isFavorite(recipe.id);
  const veg = isVeg(recipe.diet);

  const handleFav = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(recipe.id);
    onFavoriteChange?.();
  };

  return (
    <Link to={`/recipe/${recipe.id}`} className="premium-card group block overflow-hidden transition hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        <img
          src={recipe.image}
          alt={recipe.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <button
          type="button"
          onClick={handleFav}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-lg shadow"
          aria-label="Favorite"
        >
          {fav ? '❤️' : '🤍'}
        </button>
        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium">
          {veg ? `🥬 ${t('veg')}` : `🍗 ${t('nonVeg')}`}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-stone-900 line-clamp-1">{recipe.nameHi || recipe.name}</h3>
        <p className="mt-1 text-sm text-stone-500 line-clamp-1">{recipe.name}</p>
        <p className="mt-1 text-xs text-stone-400">
          {recipe.cuisine} · {recipe.category} · {recipe.cookTime || recipe.time} {t('min')}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {recipe.tags?.slice(0, 2).map((tag) => (
            <span key={tag} className="rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-700">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
