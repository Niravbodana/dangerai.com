import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { IconBook, IconChef, IconHeart, IconHome, IconPantry } from "./Icons";

const links = [
  { to: "/", Icon: IconHome, labelKey: "home" },
  { to: "/today", Icon: IconChef, labelKey: "today" },
  { to: "/recipes", Icon: IconBook, labelKey: "recipes" },
  { to: "/pantry", Icon: IconPantry, labelKey: "pantry" },
  { to: "/favorites", Icon: IconHeart, labelKey: "saved" },
];

export default function MobileNav() {
  const location = useLocation();
  const { t } = useLanguage();

  if (location.pathname.startsWith("/cook/") || location.pathname.startsWith("/recipe/")) {
    return null;
  }

  return (
    <nav className="mobile-nav fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#14110e]/95 backdrop-blur-xl md:hidden" aria-label="Mobile navigation">
      <div className="flex justify-around px-1 py-1.5">
        {links.map(({ to, Icon, labelKey }) => {
          const active = to === "/"
            ? location.pathname === "/"
            : location.pathname === to || location.pathname.startsWith(`${to}/`);
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[3rem] min-w-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-semibold transition ${
                active
                  ? "bg-amber-500/15 text-[var(--accent-soft)]"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "text-[var(--accent-soft)]" : ""}`} />
              <span className="max-w-[4.5rem] truncate">{t(labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
