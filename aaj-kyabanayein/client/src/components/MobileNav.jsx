import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const links = [
  { to: '/', icon: '🏠', key: 'home' },
  { to: '/recipes', icon: '📖', key: 'recipes' },
  { to: '/favorites', icon: '❤️', key: 'favorites' },
  { to: '/planner', icon: '📅', key: 'planner' },
  { to: '/pantry', icon: '🥫', key: 'pantry' },
];

export default function MobileNav() {
  const location = useLocation();
  const { t } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-white/95 backdrop-blur md:hidden">
      <div className="flex justify-around py-2">
        {links.map(({ to, icon, key }) => (
          <Link
            key={to}
            to={to}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 text-xs ${
              location.pathname === to ? 'text-[var(--primary)] font-medium' : 'text-slate-500'
            }`}
          >
            <span className="text-lg">{icon}</span>
            {t(key)}
          </Link>
        ))}
      </div>
    </nav>
  );
}
