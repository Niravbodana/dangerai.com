import { Link } from "react-router-dom";
import { useAuthModal } from "../context/AuthModalContext";
import BrandLogo from "../components/BrandLogo";
import RecipeSearch from "../components/RecipeSearch";
import HotMakings from "../components/HotMakings";
import CuisineExplorer from "../components/CuisineExplorer";
import DailyHealthyPlan from "../components/DailyHealthyPlan";
import MoodTonight from "../components/MoodTonight";
import RecentCooksStrip from "../components/RecentCooksStrip";
import HomeTrendingGallery from "../components/HomeTrendingGallery";
import { getStreak } from "../lib/streak";
import { IconArrowRight } from "../components/Icons";

export default function Home() {
  const { openLogin, openSignup } = useAuthModal();
  const streak = getStreak();

  return (
    <div className="home-page min-h-screen">
      <section className="home-hero relative overflow-hidden">
        <div className="hero-glow" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 sm:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10 lg:py-20">
          <div className="text-center lg:text-left">
            <BrandLogo light className="mx-auto mb-4 h-10 w-auto sm:h-12 lg:mx-0" />
            <h1 className="font-display text-3xl leading-tight tracking-tight text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
              Aapki rasoi,<br />
              <span className="home-gradient-text">aapka pride</span>
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base lg:mx-0">
              Aaj kya banaye? Search karo → ingredients dekho → step-by-step pakao.
            </p>
            <div className="mx-auto mt-6 max-w-xl lg:mx-0">
              <RecipeSearch large />
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link to="/today" className="premium-btn tap-smooth inline-flex items-center gap-2 px-6 py-3 text-sm">
                Aaj Kya Banaye
                <IconArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/recipes" className="premium-btn-outline tap-smooth px-5 py-3 text-sm">
                Recipes dekho
              </Link>
              {streak.current > 0 && (
                <Link to="/streak" className="text-xs text-[var(--accent-soft)]">🔥 {streak.current} din</Link>
              )}
            </div>
          </div>

          <div className="home-hero__visual relative mx-auto w-full max-w-[280px] sm:max-w-[320px] lg:max-w-none">
            <div className="home-hero__glow" />
            <img
              src="/home/hero-homemaker.png"
              alt="Indian homemaker cooking with Rasoira"
              className="home-hero__img relative z-[1] mx-auto max-h-[340px] w-auto rounded-2xl object-cover shadow-2xl sm:max-h-[400px]"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
            <div className="home-float-card home-float-card--stats !left-2 !bottom-4 sm:!left-0">
              <p className="font-display text-xl text-[var(--accent-soft)] sm:text-2xl">920+</p>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Recipes</p>
            </div>
          </div>
        </div>
      </section>

      <MoodTonight />
      <HotMakings />
      <RecentCooksStrip />

      <section className="home-section border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-4">
          <DailyHealthyPlan deferMs={600} />
        </div>
      </section>

      <HomeTrendingGallery />
      <CuisineExplorer />

      <section className="home-section pb-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="home-cta">
            <h2 className="relative font-display text-2xl text-[var(--text-primary)] sm:text-3xl">Aaj se shuru karo</h2>
            <p className="relative mx-auto mt-3 max-w-md text-sm text-[var(--text-secondary)]">
              Free recipes + cooking. Plus se unlimited daily plans.
            </p>
            <div className="relative mt-6 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={openSignup} className="premium-btn px-8 py-3 text-sm">Join free</button>
              <button type="button" onClick={openLogin} className="premium-btn-outline px-8 py-3 text-sm">Login</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
