import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { IconBook, IconCalendar, IconHeart, IconHome, IconPantry } from './Icons';

const links = [
  { to: '/', Icon: IconHome, key: 'home' },
  { to: '/recipes', Icon: IconBook, key: 'recipes' },
  { to: '/favorites', Icon: IconHeart, key: 'favorites' },
  { to: '/planner', Icon: IconCalendar, key: 'planner' },
  { to: '/pantry', Icon: IconPantry, key: 'pantry' },
];

export default function MobileNav() {
  const location = useLocation();
  const { t } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200/80 bg-white/90 backdrop-blur-xl md:hidden">
      <div className="flex justify-around py-2">
        {links.map(({ to, Icon, key }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 text-[10px] font-medium uppercase tracking-wide transition ${
                active ? 'text-orange-600' : 'text-stone-400'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-orange-600' : 'text-stone-400'}`} />
              {t(key)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
