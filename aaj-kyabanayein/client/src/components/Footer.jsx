import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import BrandLogo from "./BrandLogo";

export default function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-white/40">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <BrandLogo className="h-8 w-auto sm:h-9" />
            <p className="mt-3 max-w-sm text-sm text-[var(--text-secondary)]">{t("heroDesc")}</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-[var(--text-secondary)]">
            <Link to="/recipes" className="hover:text-[var(--text-primary)]">{t("recipes")}</Link>
            <Link to="/planner" className="hover:text-[var(--text-primary)]">{t("mealPlan")}</Link>
            <Link to="/pantry" className="hover:text-[var(--text-primary)]">{t("pantry")}</Link>
            <Link to="/pricing" className="hover:text-[var(--text-primary)]">{t("pricing")}</Link>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-[var(--text-secondary)]">
          {year} Rasoira — {t("completelyFree")}
        </p>
      </div>
    </footer>
  );
}
