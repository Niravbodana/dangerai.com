import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

const LINKS = [
  { to: "/favorites", key: "favorites", icon: "❤️" },
  { to: "/collections", key: "collections", icon: "📚" },
  { to: "/planner", key: "mealPlan", icon: "📅" },
  { to: "/today", key: "today", icon: "☀️" },
  { to: "/streak", key: "streak", icon: "🔥" },
  { to: "/family", key: "family", icon: "👨‍👩‍👧" },
  { to: "/taste", key: "taste", icon: "👅" },
  { to: "/pricing", key: "pricing", icon: "✨" },
];

export default function MobileMenu({ open, onClose }) {
  const { t, lang, toggle } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { openLogin } = useAuthModal();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[160] md:hidden">
      <button type="button" className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-label="Close menu" />
      <div className="absolute right-0 top-0 flex h-full w-[min(100%,20rem)] flex-col border-l border-white/10 bg-[#14110e]/98 safe-top safe-bottom">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <p className="font-display text-lg text-[var(--text-primary)]">{t("menu")}</p>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-[var(--text-secondary)]">
            ✕
          </button>
        </div>
        <div className="flex gap-2 border-b border-white/10 p-4">
          <button type="button" onClick={toggleTheme} className="premium-btn-outline tap-smooth flex-1 py-3 text-sm">
            {theme === "light" ? "🌙 " : "☀️ "}{t("theme")}
          </button>
          <button type="button" onClick={toggle} className="premium-btn-outline tap-smooth flex-1 py-3 text-sm">
            {lang === "hi" ? "EN" : "हिं"}
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          {LINKS.map(({ to, key, icon }) => (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className="tap-smooth flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium text-[var(--text-primary)] hover:bg-white/5"
            >
              <span className="text-lg">{icon}</span>
              {t(key)}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          {user ? (
            <button type="button" onClick={() => { logout(); onClose(); }} className="premium-btn-outline w-full py-3 text-sm">
              {t("logout")} ({user.name})
            </button>
          ) : (
            <button type="button" onClick={() => { openLogin(); onClose(); }} className="premium-btn w-full py-3 text-sm">
              {t("login")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
