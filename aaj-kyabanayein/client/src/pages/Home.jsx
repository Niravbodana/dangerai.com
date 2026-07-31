import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import BlinkingSlogan from "../components/BlinkingSlogan";
import BrandLogo from "../components/BrandLogo";
import HotMakings from "../components/HotMakings";
import CuisineExplorer from "../components/CuisineExplorer";
import { IconArrowRight, IconBook, IconCalendar, IconChef, IconHeart, IconPantry } from "../components/Icons";

const HERO_IMG = "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200&h=600&fit=crop";

const FEATURE_ICONS = {
  pantry: IconPantry,
  planner: IconCalendar,
  healthy: IconChef,
  recipes: IconBook,
  favorites: IconHeart,
};

export default function Home() {
  const { t } = useLanguage();

  const features = [
    { to: "/pantry", icon: "pantry", titleKey: "featPantry", descKey: "featPantryDesc" },
    { to: "/planner", icon: "planner", titleKey: "featPlanner", descKey: "featPlannerDesc" },
    { to: "/healthy-week", icon: "healthy", titleKey: "featHealthy", descKey: "featHealthyDesc" },
    { to: "/recipes", icon: "recipes", titleKey: "featRecipes", descKey: "featRecipesDesc" },
    { to: "/favorites", icon: "favorites", titleKey: "featFavorites", descKey: "featFavoritesDesc" },
  ];

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="" className="h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#faf7f0]/95 via-[#f5f0e6]/90 to-[#ebe4d6]/85" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <div className="max-w-xl glass-strong rounded-3xl p-8 sm:p-10">
            <span className="premium-pill mb-5">{t("free")}</span>
            <BrandLogo className="h-11 w-auto sm:h-14" />
            <BlinkingSlogan />
            <p className="mb-8 text-base leading-relaxed text-[var(--text-secondary)]">{t("heroDesc")}</p>
            <div className="flex flex-wrap gap-3">
              <Link to="/recipes" className="premium-btn inline-flex items-center gap-2 px-8 py-3 text-sm">
                {t("browseRecipes")}
                <IconArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/pantry" className="premium-btn-outline px-8 py-3 text-sm">
                {t("tryPantry")}
              </Link>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { n: "5.7 Lakh+", l: t("recipesCount") },
              { n: "11", l: t("cuisines") },
              { n: "7 Din", l: t("weekPlan") },
              { n: "Free", l: t("completelyFree") },
            ].map((s) => (
              <div key={s.l} className="glass rounded-2xl px-4 py-3">
                <div className="font-display text-lg text-[var(--text-primary)]">{s.n}</div>
                <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--text-secondary)]">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HotMakings />
      <CuisineExplorer />

      <section className="section-padding">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">{t("explore")}</p>
          <h2 className="mt-1 font-display text-2xl text-[var(--text-primary)]">{t("everythingYouNeed")}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => {
              const Icon = FEATURE_ICONS[f.icon];
              return (
                <Link key={f.to} to={f.to} className="feature-card group">
                  <div className="feature-card-icon">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="mt-4 font-semibold text-[var(--text-primary)]">{t(f.titleKey)}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">{t(f.descKey)}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
