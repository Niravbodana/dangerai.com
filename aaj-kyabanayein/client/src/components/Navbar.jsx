import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

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
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🍳</span>
          <div>
            <span className="text-lg font-bold text-orange-600">{t("appName")}</span>
            <p className="text-xs text-stone-400">{t("free")}</p>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {NAV.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="hidden rounded-full px-3 py-1.5 text-sm text-stone-600 hover:bg-orange-50 hover:text-orange-600 sm:block"
            >
              {t(link.key)}
            </Link>
          ))}

          <button
            onClick={toggle}
            className="rounded-full border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50"
          >
            {lang === "hi" ? "EN" : "हिं"}
          </button>

          {user ? (
            <>
              <span className="hidden text-sm text-stone-500 md:block">{user.name}</span>
              <button
                onClick={() => { logout(); navigate("/"); }}
                className="rounded-full border border-stone-200 px-3 py-1.5 text-sm text-stone-600"
              >
                {t("logout")}
              </button>
            </>
          ) : (
            <Link to="/login" className="premium-btn px-4 py-1.5 text-sm">
              {t("login")}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
