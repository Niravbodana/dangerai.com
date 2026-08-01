import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { IconBook, IconCalendar, IconChef, IconHeart, IconHome } from "./Icons";

const links = [
  { to: "/", Icon: IconHome, key: "home" },
  { to: "/today", Icon: IconChef, key: "today" },
  { to: "/recipes", Icon: IconBook, key: "recipes" },
  { to: "/favorites", Icon: IconHeart, key: "favorites" },
  { to: "/planner", Icon: IconCalendar, key: "planner" },
];

export default function MobileNav() {
  const location = useLocation();
  const { t } = useLanguage();

  return (
    <nav className="mobile-nav fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#14110e]/90 backdrop-blur-xl md:hidden">
      <div className="flex justify-around px-1 py-2">
        {links.map(({ to, Icon, key }) => {
          const active = to === "/"
            ? location.pathname === "/"
            : location.pathname === to || location.pathname.startsWith(`${to}/`);
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wide transition ${
                active
                  ? "bg-amber-500/15 text-[var(--accent-soft)]"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "text-[var(--accent-soft)]" : ""}`} />
              <span className="max-w-[4.5rem] truncate">{t(key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
