import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import BrandLogo from "./BrandLogo";

const NAV = [
  { to: "/recipes", key: "recipes" },
  { to: "/pantry", key: "pantry" },
  { to: "/planner", key: "mealPlan" },
  { to: "/healthy-week", key: "healthy" },
  { to: "/favorites", key: "favorites" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t, toggle, lang } = useLanguage();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#14110e]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex shrink-0 items-center">
          <BrandLogo light />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `nav-pill ${isActive ? "nav-pill--active" : ""}`}
            >
              {t(link.key)}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition hover:border-amber-500/30 hover:text-[var(--text-primary)]"
          >
            {lang === "hi" ? "EN" : "हिं"}
          </button>

          {user ? (
            <>
              <span className="hidden text-sm text-[var(--text-secondary)] md:block">{user.name}</span>
              <button
                onClick={() => { logout(); navigate("/"); }}
                className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm text-[var(--text-secondary)] transition hover:border-white/20 hover:text-[var(--text-primary)]"
              >
                {t("logout")}
              </button>
            </>
          ) : (
            <Link to="/login" className="premium-btn px-5 py-2 text-sm">
              {t("login")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
