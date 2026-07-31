import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">404</p>
      <h1 className="mt-2 font-display text-3xl text-[var(--text-primary)]">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-[var(--text-secondary)]">
        Yeh page exist nahi karta. Recipes browse karo ya ghar wapas jao.
      </p>
      <Link to="/" className="premium-btn mt-8 px-8 py-3 text-sm">
        {t("home")}
      </Link>
    </div>
  );
}
