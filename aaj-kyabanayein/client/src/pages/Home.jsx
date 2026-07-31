import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import BlinkingSlogan from "../components/BlinkingSlogan";
import HotMakings from "../components/HotMakings";
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
          <img src={HERO_IMG} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#faf8f5]/97 via-[#faf8f5]/88 to-[#faf8f5]/75" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <div className="max-w-xl">
            <span className="premium-pill mb-5">{t("free")}</span>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
              {t("appName")}
            </h1>
            <BlinkingSlogan />
            <p className="mb-8 text-base leading-relaxed text-stone-500">{t("heroDesc")}</p>
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

          <div className="mt-14 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { n: "1 Lakh+", l: t("recipesCount") },
              { n: "Step-by-step", l: t("cookingMode") },
              { n: "7 Din", l: t("weekPlan") },
              { n: "Free", l: t("completelyFree") },
            ].map((s) => (
              <div key={s.l} className="border-l-2 border-orange-200 pl-4">
                <div className="font-display text-xl font-semibold text-stone-900">{s.n}</div>
                <div className="mt-0.5 text-xs uppercase tracking-wider text-stone-400">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HotMakings />

      <section className="section-padding">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">{t("explore")}</p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-stone-900">{t("everythingYouNeed")}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => {
              const Icon = FEATURE_ICONS[f.icon];
              return (
                <Link key={f.to} to={f.to} className="feature-card group">
                  <div className="feature-card-icon">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="mt-4 font-semibold text-stone-900">{t(f.titleKey)}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-stone-500">{t(f.descKey)}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
