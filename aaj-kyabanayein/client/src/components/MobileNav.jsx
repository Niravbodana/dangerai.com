import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { IconBook, IconChef, IconHeart, IconHome, IconPantry } from "./Icons";

const links = [
  { to: "/", Icon: IconHome, label: "Home", labelHi: "होम" },
  { to: "/today", Icon: IconChef, label: "Today", labelHi: "आज" },
  { to: "/recipes", Icon: IconBook, label: "Recipes", labelHi: "Recipes" },
  { to: "/pantry", Icon: IconPantry, label: "Pantry", labelHi: "Pantry" },
  { to: "/favorites", Icon: IconHeart, label: "Saved", labelHi: "Saved" },
];

export default function MobileNav() {
  const location = useLocation();
  const { lang } = useLanguage();

  return (
    <nav className="mobile-nav fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#14110e]/95 backdrop-blur-xl md:hidden">
      <div className="flex justify-around px-1 py-1.5">
        {links.map(({ to, Icon, label, labelHi }) => {
          const active = to === "/"
            ? location.pathname === "/"
            : location.pathname === to || location.pathname.startsWith(`${to}/`);
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-semibold transition ${
                active
                  ? "bg-amber-500/15 text-[var(--accent-soft)]"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "text-[var(--accent-soft)]" : ""}`} />
              <span>{lang === "hi" ? labelHi : label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
