import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Pricing() {
  const { t } = useLanguage();
  const features = [
    '770+ real recipes with authentic ingredients',
    'Veg / Non-Veg filter',
    'Hot Makings trending',
    'Ratings & Favorites',
    'WhatsApp Share',
    'Hindi / English',
    '7-day meal plan',
    'Cooking mode with timers',
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-center">
      <h1 className="font-display text-3xl text-[var(--text-primary)]">{t('pricing')}</h1>
      <div className="glass-strong mt-8 p-8">
        <p className="font-display text-5xl text-[var(--text-primary)]">₹0</p>
        <p className="mt-2 text-xl font-semibold text-[var(--text-primary)]">{t('freeForNow')}</p>
        <p className="mt-4 text-[var(--text-secondary)]">{t('freeDesc')}</p>
        <ul className="mt-6 space-y-2 text-left text-[var(--text-primary)]">
          {features.map((f) => (
            <li key={f} className="flex gap-2 text-sm">
              <span className="text-[var(--accent-green)]">—</span>
              {f}
            </li>
          ))}
        </ul>
        <Link to="/recipes" className="premium-btn mt-8 inline-block px-8 py-3 text-sm">
          {t('browseRecipes')}
        </Link>
      </div>
    </div>
  );
}
