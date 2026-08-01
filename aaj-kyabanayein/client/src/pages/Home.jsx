import { Link } from "react-router-dom";
import { useAuthModal } from "../context/AuthModalContext";
import BrandLogo from "../components/BrandLogo";
import RecipeSearch from "../components/RecipeSearch";
import HotMakings from "../components/HotMakings";
import CuisineExplorer from "../components/CuisineExplorer";
import DailyHealthyPlan from "../components/DailyHealthyPlan";
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

const TESTIMONIALS = [
  { name: "Sunita M.", city: "Pune", text: "Pehle roz sochti thi aaj kya banau. Ab Rasoira se 2 minute mein plan ho jata hai. Family khush, main bhi proud feel karti hoon.", stars: 5 },
  { name: "Kavita R.", city: "Delhi", text: "Meri saas ne kaha — yeh dal restaurant se better hai! Step-by-step guide se first time perfect bana.", stars: 5 },
  { name: "Priya K.", city: "Ahmedabad", text: "Ghar ka khana, par itna variety! Bachhon ko bore nahi hota. Pantry feature se jo pada hai usi se recipe milti hai.", stars: 5 },
  { name: "Meena D.", city: "Jaipur", text: "Sunday meal plan ek click mein. Pura hafta sorted. Ab kitchen stress-free hai — sach mein!", stars: 4 },
];

const FEATURES = [
  { to: "/today", icon: IconChef, title: "Aaj Kya Banaye", desc: "Roz personalised breakfast, lunch, snack, dinner." },
  { to: "/pantry", icon: IconPantry, title: "Smart Pantry", desc: "Quantity + expiry — jo pada hai usi se recipes." },
  { to: "/collections", icon: IconBook, title: "Collections", desc: "Sunday lunch, Diwali sweets, ₹50 budget aur zyada." },
  { to: "/planner", icon: IconCalendar, title: "7 Din ka Meal Plan", desc: "Poora hafta plan + WhatsApp bazaar list." },
  { to: "/favorites", icon: IconHeart, title: "Favourites & Streak", desc: "Save karo, cook karo, streak banao." },
];

const STEPS = [
  { n: "01", title: "Aaj Kya Banaye kholo", desc: "Taste profile ke hisaab se aaj ke 4 meals turant.", img: "/home/section-pantry-planning.png" },
  { n: "02", title: "Recipe choose karo", desc: "791+ real recipes — tap karo, poori ingredients aur matching photo.", img: "/home/gallery-thali.png" },
  { n: "03", title: "Voice ke saath pakao", desc: "Hands-free next, timers, Hindi/English listen — jaise chef saath ho.", img: "/home/section-cooking-steps.png" },
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
      {/* Hero — one composition: brand, headline, one line, search, one CTA, full-bleed image */}
      <section className="home-hero relative min-h-[88vh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/home/hero-homemaker.png"
            alt=""
            className="h-full w-full object-cover object-center opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0c0a08] via-[#0c0a08]/85 to-[#0c0a08]/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a08] via-transparent to-[#0c0a08]/50" />
        </div>

        <div className="relative mx-auto flex min-h-[88vh] max-w-3xl flex-col justify-center px-4 py-20 text-center">
          <BrandLogo light className="mx-auto mb-6 h-12 w-auto sm:h-14" />
          <h1 className="font-display text-4xl leading-tight tracking-tight text-[var(--text-primary)] sm:text-5xl lg:text-6xl">
            Aapki rasoi,<br />
            <span className="home-gradient-text">aapka pride</span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
            791+ real recipes. Aaj kya banaye — pantry se plate tak, Hindi voice ke saath.
          </p>
          <div className="mx-auto mt-8 w-full max-w-xl">
            <RecipeSearch large />
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link to="/today" className="premium-btn tap-smooth inline-flex items-center gap-2 px-8 py-3.5 text-sm">
              Aaj Kya Banaye
              <IconArrowRight className="h-4 w-4" />
            </Link>
            {streak.current > 0 && (
              <Link to="/streak" className="text-sm text-[var(--accent-soft)]">
                🔥 {streak.current} din streak
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.06] py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-3 px-4">
          {[
            { to: "/today", label: "Daily brief" },
            { to: "/collections", label: "Collections" },
            { to: "/pantry", label: "Pantry" },
            { to: "/taste", label: "Taste profile" },
            { to: "/family", label: "Family" },
            { to: "/pricing", label: "Plus" },
          ].map((l) => (
            <Link key={l.to} to={l.to} className="rounded-full border border-white/12 px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--accent)]/40 hover:text-[var(--accent-soft)]">
              {l.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="home-proud">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-2">
          <div className="home-proud__image-wrap">
            <img src="/home/section-family-meal.png" alt="Family enjoying home cooked meal" className="home-proud__img" />
          </div>
          <div>
            <p className="home-eyebrow">India&apos;s home-cooking OS</p>
            <h2 className="mt-2 font-display text-3xl text-[var(--text-primary)] sm:text-4xl">
              Delivery nahi — ghar ki rasoi smart
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--text-secondary)]">
              Personal taste, family diets, smart pantry, voice cook, streaks.
              Har din Aaj Kya Banaye se shuru karo.
            </p>
            <Link to="/today" className="premium-btn mt-6 inline-flex items-center gap-2 px-6 py-3 text-sm">
              Open today&apos;s plan <IconArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="home-section border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-4">
          <p className="home-eyebrow">Kaise kaam karta hai</p>
          <h2 className="mt-2 font-display text-3xl text-[var(--text-primary)]">3 easy steps</h2>
          <div className="mt-12 space-y-16">
            {STEPS.map((s, i) => (
              <div key={s.n} className={`home-step-row ${i % 2 === 1 ? "home-step-row--reverse" : ""}`}>
                <div className="home-step-row__img-wrap">
                  <img src={s.img} alt={s.title} className="home-step-row__img" loading="lazy" />
                  <span className="home-step-row__num">{s.n}</span>
                </div>
                <div className="home-step-row__text">
                  <h3 className="font-display text-2xl text-[var(--text-primary)]">{s.title}</h3>
                  <p className="mt-3 text-base leading-relaxed text-[var(--text-secondary)]">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
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
          <p className="home-eyebrow">Ghar ka swad</p>
          <h2 className="mt-2 font-display text-3xl text-[var(--text-primary)]">Har region, har mood</h2>
        </div>
        <div className="home-gallery-scroll mt-10">
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
          <p className="home-eyebrow">Ghar ki rasoiyanon ki baat</p>
          <h2 className="mt-2 font-display text-3xl text-[var(--text-primary)]">Jo pakati hain, woh kehti hain</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="home-testimonial">
                <Stars n={t.stars} />
                <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-4">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{t.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{t.city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-4">
          <p className="home-eyebrow">Sab kuch ek jagah</p>
          <h2 className="mt-2 font-display text-3xl text-[var(--text-primary)]">Aapki smart rasoi</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <Link key={f.to} to={f.to} className="home-feature group">
                  <div className="home-feature__icon">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold text-[var(--text-primary)]">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">{f.desc}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-soft)] opacity-0 transition group-hover:opacity-100">
                    Explore <IconArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="home-section pb-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="home-cta">
            <div className="home-cta__glow" />
            <h2 className="relative font-display text-3xl text-[var(--text-primary)] sm:text-4xl">
              Aaj se shuru karo
            </h2>
            <p className="relative mx-auto mt-4 max-w-lg text-[var(--text-secondary)]">
              Free core forever. Plus for unlimited daily briefs & offline voice chef.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-4">
              <button type="button" onClick={openSignup} className="premium-btn tap-smooth inline-flex items-center gap-2 px-10 py-3.5 text-sm">
                Join free <IconArrowRight className="h-4 w-4" />
              </button>
              <Link to="/pricing" className="premium-btn-outline tap-smooth px-10 py-3.5 text-sm">
                See Plus
              </Link>
              <button type="button" onClick={openLogin} className="px-4 py-3.5 text-sm text-[var(--text-secondary)]">
                Login
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
