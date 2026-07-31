import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import BlinkingSlogan from "../components/BlinkingSlogan";
import BrandLogo from "../components/BrandLogo";
import HotMakings from "../components/HotMakings";
import CuisineExplorer from "../components/CuisineExplorer";
import { IconArrowRight, IconBook, IconCalendar, IconChef, IconHeart, IconPantry } from "../components/Icons";

const FOOD_GALLERY = [
  { name: "Hyderabadi Biryani", img: "https://images.unsplash.com/photo-1563379091339-03246963d96a?w=600&h=450&fit=crop" },
  { name: "Masala Dosa", img: "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=600&h=450&fit=crop" },
  { name: "North Indian Thali", img: "https://images.unsplash.com/photo-1546833998-877b37c2b5cd?w=600&h=450&fit=crop" },
  { name: "Paneer Butter Masala", img: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&h=450&fit=crop" },
  { name: "Dal Tadka", img: "https://images.unsplash.com/photo-1585937421612-70a008296fbe?w=600&h=450&fit=crop" },
  { name: "South Indian Meals", img: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&h=450&fit=crop" },
];

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

  const steps = [
    { n: "01", titleKey: "step1Title", descKey: "step1Desc" },
    { n: "02", titleKey: "step2Title", descKey: "step2Desc" },
    { n: "03", titleKey: "step3Title", descKey: "step3Desc" },
  ];

  const tips = ["tip1", "tip2", "tip3", "tip4"];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="hero-glow" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="premium-pill mb-6">{t("free")}</span>
            <BrandLogo light className="mb-5 h-11 w-auto sm:h-14" />
            <BlinkingSlogan />
            <p className="mb-8 max-w-md text-base leading-relaxed text-[var(--text-secondary)]">{t("heroDesc")}</p>
            <div className="flex flex-wrap gap-3">
              <Link to="/recipes" className="premium-btn inline-flex items-center gap-2 px-8 py-3 text-sm">
                {t("browseRecipes")}
                <IconArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/pantry" className="premium-btn-outline px-8 py-3 text-sm">
                {t("tryPantry")}
              </Link>
            </div>
            <p className="mt-6 text-xs font-medium uppercase tracking-widest text-[var(--text-secondary)]">
              {t("trustedBy")}
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-3xl bg-amber-500/15 blur-3xl" />
            <img
              src="/hero-cooking.png"
              alt="Woman cooking Indian food with recipe app on phone"
              className="relative w-full rounded-3xl border border-white/10 object-cover shadow-2xl shadow-black/50 ring-1 ring-amber-500/20"
            />
            <div className="absolute -bottom-4 -left-4 glass-strong rounded-2xl px-4 py-3 sm:-bottom-6 sm:-left-6">
              <p className="font-display text-2xl text-[var(--accent-soft)]">5.7L+</p>
              <p className="text-xs text-[var(--text-secondary)]">{t("recipesCount")}</p>
            </div>
          </div>
        </div>

        <div className="relative mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 pb-16 sm:grid-cols-4">
          {[
            { n: "5.7 Lakh+", l: t("recipesCount") },
            { n: "11", l: t("cuisines") },
            { n: "7 Days", l: t("sevenDays") },
            { n: "Free", l: t("completelyFree") },
          ].map((s) => (
            <div key={s.l} className="stat-card">
              <div className="font-display text-xl text-[var(--accent-soft)] sm:text-2xl">{s.n}</div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="section-padding border-t border-white/5">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">{t("howItWorks")}</p>
          <h2 className="mt-2 font-display text-3xl text-[var(--text-primary)]">{t("howItWorksDesc")}</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="step-card">
                <div className="step-number">{s.n}</div>
                <h3 className="mt-5 font-semibold text-[var(--text-primary)]">{t(s.titleKey)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{t(s.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HotMakings />

      {/* Indian food gallery */}
      <section className="section-padding border-t border-white/5">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">{t("indianFlavors")}</p>
          <h2 className="mt-2 font-display text-3xl text-[var(--text-primary)]">{t("indianFlavorsDesc")}</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FOOD_GALLERY.map((food) => (
              <Link key={food.name} to="/recipes" className="food-gallery-card group">
                <img src={food.img} alt={food.name} loading="lazy" />
                <div className="overlay">
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{food.name}</p>
                    <p className="mt-1 text-xs text-[var(--accent-soft)] opacity-0 transition group-hover:opacity-100">
                      {t("viewRecipe")} →
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CuisineExplorer />

      {/* Healthy tips */}
      <section className="section-padding border-t border-white/5">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-green)]">{t("healthyTips")}</p>
          <h2 className="mt-2 font-display text-3xl text-[var(--text-primary)]">{t("healthyTipsDesc")}</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {tips.map((tip, i) => (
              <div key={tip} className="tip-card">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-green)]/20 text-sm font-bold text-[var(--accent-green)]">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{t(tip)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section-padding border-t border-white/5">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">{t("explore")}</p>
          <h2 className="mt-2 font-display text-3xl text-[var(--text-primary)]">{t("everythingYouNeed")}</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => {
              const Icon = FEATURE_ICONS[f.icon];
              return (
                <Link key={f.to} to={f.to} className="feature-card group">
                  <div className="feature-card-icon">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold text-[var(--text-primary)]">{t(f.titleKey)}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">{t(f.descKey)}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Login CTA */}
      <section className="section-padding">
        <div className="mx-auto max-w-6xl px-4">
          <div className="cta-section text-center">
            <h2 className="relative font-display text-3xl text-[var(--text-primary)] sm:text-4xl">{t("joinTitle")}</h2>
            <p className="relative mx-auto mt-4 max-w-lg text-[var(--text-secondary)]">{t("joinDesc")}</p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-4">
              <Link to="/signup" className="premium-btn inline-flex items-center gap-2 px-10 py-3.5 text-sm">
                {t("joinFree")}
                <IconArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/login" className="premium-btn-outline px-10 py-3.5 text-sm">
                {t("login")}
              </Link>
            </div>
            <p className="relative mt-4 text-sm text-[var(--text-secondary)]">
              {t("alreadyAccount")}{" "}
              <Link to="/login" className="text-[var(--accent-soft)] hover:underline">
                {t("login")}
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
