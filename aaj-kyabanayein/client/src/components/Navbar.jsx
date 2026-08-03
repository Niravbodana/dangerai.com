import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import BrandLogo from "./BrandLogo";
import MobileMenu from "./MobileMenu";

const NAV = [
  { to: "/today", key: "today" },
  { to: "/recipes", key: "recipes" },
  { to: "/collections", key: "collections" },
  { to: "/pantry", key: "pantry" },
  { to: "/planner", key: "mealPlan" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { openLogin } = useAuthModal();
  const { t, toggle, lang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0c0a08]/75 backdrop-blur-2xl backdrop-saturate-150 safe-top">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-4 sm:py-3.5">
        <Link to="/" className="tap-smooth flex shrink-0 items-center" aria-label="Rasoira home">
          <BrandLogo light decorative />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          {NAV.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `nav-pill tap-smooth ${isActive ? "nav-pill--active" : ""}`}
            >
              {t(link.key)}
            </NavLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            className="tap-smooth hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/12 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition hover:border-amber-500/30 hover:text-[var(--text-primary)] md:inline-flex"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
          <button
            type="button"
            onClick={toggle}
            aria-label={lang === "hi" ? "Switch to English" : "हिंदी में बदलें"}
            className="tap-smooth min-h-[44px] min-w-[44px] rounded-full border border-white/12 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition hover:border-amber-500/30 hover:text-[var(--text-primary)] sm:px-3"
          >
            {lang === "hi" ? "EN" : "हिं"}
          </button>

          {user ? (
            <>
              <span className="hidden text-sm text-[var(--text-secondary)] md:block">{user.name}</span>
              <button
                type="button"
                onClick={() => { logout(); navigate("/"); }}
                className="tap-smooth hidden min-h-[44px] rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm text-[var(--text-secondary)] transition hover:border-white/20 hover:text-[var(--text-primary)] sm:inline-flex"
              >
                {t("logout")}
              </button>
            </>
          ) : (
            <button type="button" onClick={openLogin} className="premium-btn tap-smooth hidden min-h-[44px] px-3 py-2 text-xs sm:inline-flex sm:px-5 sm:text-sm">
              {t("login")}
            </button>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="tap-smooth inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/12 bg-white/5 text-lg text-[var(--text-secondary)] md:hidden"
            aria-label={t("menu")}
          >
            ☰
          </button>
        </div>
      </div>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}
