import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";
import { useLanguage } from "../context/LanguageContext";
import BrandLogo from "./BrandLogo";

const NAV = [
  { to: "/recipes", key: "recipes" },
  { to: "/healthy-week", key: "featHealthy" },
  { to: "/pantry", key: "pantry" },
  { to: "/planner", key: "mealPlan" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { openLogin } = useAuthModal();
  const { t, toggle, lang } = useLanguage();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0c0a08]/75 backdrop-blur-2xl backdrop-saturate-150">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5">
        <Link to="/" className="tap-smooth flex shrink-0 items-center">
          <BrandLogo light />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            className="tap-smooth rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition hover:border-amber-500/30 hover:text-[var(--text-primary)]"
          >
            {lang === "hi" ? "EN" : "हिं"}
          </button>

          {user ? (
            <>
              <span className="hidden text-sm text-[var(--text-secondary)] md:block">{user.name}</span>
              <button
                type="button"
                onClick={() => { logout(); navigate("/"); }}
                className="tap-smooth rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm text-[var(--text-secondary)] transition hover:border-white/20 hover:text-[var(--text-primary)]"
              >
                {t("logout")}
              </button>
            </>
          ) : (
            <button type="button" onClick={openLogin} className="premium-btn tap-smooth px-5 py-2 text-sm">
              {t("login")}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
