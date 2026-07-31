import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { IconChef } from "./Icons";

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
    <header className="sticky top-0 z-50 glass border-b border-white/50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl glass-strong text-[var(--accent)]">
            <IconChef className="w-5 h-5" />
          </div>
          <div>
            <span className="font-display text-base text-[var(--text-primary)]">{t("appName")}</span>
            <p className="text-[10px] font-medium uppercase tracking-widest text-[var(--text-secondary)]">{t("free")}</p>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {NAV.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="hidden rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] transition hover:bg-white/40 hover:text-[var(--text-primary)] sm:block"
            >
              {t(link.key)}
            </Link>
          ))}

          <button
            onClick={toggle}
            className="rounded-lg border border-white/60 bg-white/30 px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] backdrop-blur-sm transition hover:bg-white/50"
          >
            {lang === "hi" ? "EN" : "हिं"}
          </button>

          {user ? (
            <>
              <span className="hidden text-sm text-[var(--text-secondary)] md:block">{user.name}</span>
              <button
                onClick={() => { logout(); navigate("/"); }}
                className="rounded-lg border border-white/60 bg-white/30 px-3 py-1.5 text-sm text-[var(--text-secondary)] backdrop-blur-sm transition hover:bg-white/50"
              >
                {t("logout")}
              </button>
            </>
          ) : (
            <Link to="/login" className="premium-btn px-4 py-2 text-sm">
              {t("login")}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
