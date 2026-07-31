import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Pricing() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-center">
      <h1 className="text-3xl font-bold text-slate-900">{t('pricing')}</h1>
      <div className="card mt-8 p-8">
        <p className="text-5xl font-bold text-[var(--primary)]">₹0</p>
        <p className="mt-2 text-xl font-semibold text-slate-800">{t('freeForever')}</p>
        <p className="mt-4 text-slate-600">{t('freeDesc')}</p>
        <ul className="mt-6 space-y-2 text-left text-slate-700">
          <li>✓ 1,00,000+ recipes</li>
          <li>✓ Veg / Non-Veg filter</li>
          <li>✓ Ratings & Favorites</li>
          <li>✓ WhatsApp Share</li>
          <li>✓ Hindi / English</li>
          <li>✓ 7-day meal plan</li>
          <li>✓ Cooking mode with timers</li>
        </ul>
        <Link to="/recipes" className="btn-primary mt-8 inline-block">
          {t('browseRecipes')}
        </Link>
      </div>
    </div>
  );
}
