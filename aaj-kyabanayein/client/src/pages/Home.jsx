import { Link } from "react-router-dom";
import { useAuthModal } from "../context/AuthModalContext";
import BrandLogo from "../components/BrandLogo";
import RecipeSearch from "../components/RecipeSearch";
import HotMakings from "../components/HotMakings";
import CuisineExplorer from "../components/CuisineExplorer";
import DailyHealthyPlan from "../components/DailyHealthyPlan";
import VideoShorts from "../components/VideoShorts";
import { getStreak } from "../lib/streak";
import { IconArrowRight, IconBook, IconCalendar, IconChef, IconHeart, IconPantry, IconStar } from "../components/Icons";

const GALLERY = [
  { name: "Ghar ka Thali", img: "/home/gallery-thali.png", tag: "Comfort food" },
  { name: "Masala Dosa", img: "/home/gallery-dosa.png", tag: "South Indian" },
  { name: "Veg Biryani", img: "/home/gallery-biryani.png", tag: "Special" },
  { name: "Paneer Butter Masala", img: "/home/gallery-paneer.png", tag: "Restaurant style" },
  { name: "Poha & Chai", img: "/home/gallery-poha.png", tag: "Breakfast" },
  { name: "Chole Bhature", img: "/home/gallery-chole.png", tag: "Weekend treat" },
];

const FEATURES = [
  { to: "/today", icon: IconChef, title: "Aaj Kya Banaye?", desc: "Roz 4 meals — breakfast se dinner." },
  { to: "/pantry", icon: IconPantry, title: "Ghar mein kya pada?", desc: "Jo ingredients hain, usi se recipe." },
  { to: "/recipes", icon: IconBook, title: "Sab Recipes", desc: "Search karo, photo dekho, pakao." },
  { to: "/collections", icon: IconCalendar, title: "Collections", desc: "Sunday lunch, sweets, budget meals." },
  { to: "/favorites", icon: IconHeart, title: "Favourites", desc: "Pasand save karo, streak banao." },
];

function Stars({ n }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <IconStar key={s} filled={s <= n} className={`h-3.5 w-3.5 ${s <= n ? "text-[var(--accent-soft)]" : "text-white/20"}`} />
      ))}
    </div>
  );
}

export default function Home() {
  const { openLogin, openSignup } = useAuthModal();
  const streak = getStreak();

  return (
    <div className="home-page min-h-screen">
      {/* Hero: brand + line + search + CTA + small cooking woman */}
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

          {/* Small cooking woman — restored */}
          <div className="home-hero__visual relative mx-auto w-full max-w-[280px] sm:max-w-[320px] lg:max-w-none">
            <div className="home-hero__glow" />
            <img
              src="/home/hero-homemaker.png"
              alt="Indian homemaker cooking with Rasoira"
              className="home-hero__img relative z-[1] mx-auto max-h-[340px] w-auto rounded-2xl object-cover shadow-2xl sm:max-h-[400px]"
            />
            <div className="home-float-card home-float-card--stats !left-2 !bottom-4 sm:!left-0">
              <p className="font-display text-xl text-[var(--accent-soft)] sm:text-2xl">840+</p>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Recipes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Simple 3 steps — easy to understand */}
      <section className="border-t border-white/[0.06] py-10 sm:py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center font-display text-2xl text-[var(--text-primary)] sm:text-3xl">Bas 3 simple steps</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { n: "1", title: "Search / Aaj Kya Banaye", desc: "Dish naam likho ya aaj ka plan kholo" },
              { n: "2", title: "Ingredients check", desc: "Poori list notes jaisi — quantity ke saath" },
              { n: "3", title: "Cook with voice", desc: "Start Cooking → 🔊 suno → Next dabao" },
            ].map((s) => (
              <div key={s.n} className="recipe-card p-5 text-center sm:text-left">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-[#14110e]">{s.n}</span>
                <h3 className="mt-3 font-semibold text-[var(--text-primary)]">{s.title}</h3>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <VideoShorts />

      <section className="border-t border-white/[0.06] py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-2 px-4">
          {[
            { to: "/today", label: "🌅 Aaj Kya Banaye" },
            { to: "/pantry", label: "🧺 Pantry" },
            { to: "/collections", label: "📚 Collections" },
            { to: "/taste", label: "🌶️ Taste" },
            { to: "/pricing", label: "⭐ Plus" },
          ].map((l) => (
            <Link key={l.to} to={l.to} className="rounded-full border border-white/12 px-3.5 py-2 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--accent)]/40 hover:text-[var(--accent-soft)]">
              {l.label}
            </Link>
          ))}
        </div>
      </section>

      <HotMakings />

      <section className="home-section border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-4">
          <DailyHealthyPlan />
        </div>
      </section>

      <section className="home-section border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-2xl text-[var(--text-primary)] sm:text-3xl">Ghar ka swad</h2>
        </div>
        <div className="home-gallery-scroll mt-8">
          <div className="home-gallery-track">
            {[...GALLERY, ...GALLERY].map((food, i) => (
              <Link key={`${food.name}-${i}`} to="/recipes" className="home-gallery-card group">
                <img src={food.img} alt={food.name} loading="lazy" />
                <div className="home-gallery-card__overlay">
                  <span className="home-gallery-card__tag">{food.tag}</span>
                  <p className="font-semibold text-white">{food.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CuisineExplorer />

      <section className="home-section border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-2xl text-[var(--text-primary)]">Sab ek jagah</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <Link key={f.to} to={f.to} className="home-feature group">
                  <div className="home-feature__icon"><Icon className="h-5 w-5" /></div>
                  <h3 className="mt-3 font-semibold text-[var(--text-primary)]">{f.title}</h3>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{f.desc}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

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
