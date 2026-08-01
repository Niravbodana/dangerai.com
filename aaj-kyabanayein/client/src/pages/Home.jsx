import { Link } from "react-router-dom";
import { useAuthModal } from "../context/AuthModalContext";
import BrandLogo from "../components/BrandLogo";
import RecipeSearch from "../components/RecipeSearch";
import HotMakings from "../components/HotMakings";
import CuisineExplorer from "../components/CuisineExplorer";
import DailyHealthyPlan from "../components/DailyHealthyPlan";
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
  { to: "/pantry", icon: IconPantry, title: "Ghar mein kya pada?", desc: "Ingredients batao — turant matching recipes mil jayengi." },
  { to: "/planner", icon: IconCalendar, title: "7 Din ka Meal Plan", desc: "Poora hafta plan ho jayega — veg, non-veg, healthy sab options." },
  { to: "/healthy-week", icon: IconChef, title: "Aaj ka Healthy Plan", desc: "Breakfast, lunch, snack, dinner — aaj ke liye balanced meals." },
  { to: "/recipes", icon: IconBook, title: "770+ Real Recipes", desc: "Indian, Chinese, Italian — asli ingredients, asli recipes." },
  { to: "/favorites", icon: IconHeart, title: "Apni Favourites", desc: "Jo pasand aaye save karo — kabhi bhi wapas banao." },
];

const STEPS = [
  { n: "01", title: "Ghar ka pantry batao", desc: "Jo ingredients fridge ya kitchen mein hain, add karo. Smart matching turant recipes dikhayega.", img: "/home/section-pantry-planning.png" },
  { n: "02", title: "Recipe choose karo", desc: "770+ real recipes — breakfast se dinner tak. Tap karo, ingredients aur photo dekho.", img: "/home/gallery-thali.png" },
  { n: "03", title: "Step-by-step pakao", desc: "Phone haath mein, ek ek step follow karo. Timer, tips — jaise chef saath ho.", img: "/home/section-cooking-steps.png" },
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

  return (
    <div className="home-page min-h-screen">
      {/* ── Hero ── */}
      <section className="home-hero relative overflow-hidden">
        <div className="hero-glow" />
        <div className="hero-grid-pattern" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-2 lg:py-24">
          <div className="home-hero__content">
            <span className="home-badge mb-5">Free for Now · Ghar ka Khana</span>
            <BrandLogo light className="mb-4 h-10 w-auto sm:h-12" />
            <h1 className="font-display text-4xl leading-tight tracking-tight text-[var(--text-primary)] sm:text-5xl lg:text-[3.25rem]">
              Aapki rasoi,<br />
              <span className="home-gradient-text">aapka pride</span>
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-[var(--text-secondary)]">
              Ghar ka khana banana koi chhoti baat nahi — yeh pyaar hai, care hai, tradition hai.
              Rasoira aapke saath hai har meal mein.
            </p>
            <div className="mt-6">
              <RecipeSearch large />
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/recipes" className="premium-btn tap-smooth inline-flex items-center gap-2 px-8 py-3.5 text-sm">
                Recipes Explore Karo
                <IconArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/pantry" className="premium-btn-outline tap-smooth px-8 py-3.5 text-sm">
                Ghar mein kya pada?
              </Link>
            </div>
            <p className="mt-6 flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
              <span className="flex -space-x-1">
                {["🍛", "👩‍🍳", "❤️"].map((e) => (
                  <span key={e} className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs">{e}</span>
                ))}
              </span>
              Bharat bhar ki ghar ki rasoiyanon ka bharosa
            </p>
          </div>

          <div className="home-hero__visual relative">
            <div className="home-hero__glow" />
            <img
              src="/home/hero-homemaker.png"
              alt="Indian homemaker proudly cooking with Rasoira app"
              className="home-hero__img"
            />
            <div className="home-float-card home-float-card--stats">
              <p className="font-display text-2xl text-[var(--accent-soft)]">770+</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Real Recipes</p>
            </div>
            <div className="home-float-card home-float-card--rating">
              <p className="font-display text-lg text-[var(--accent-soft)]">Daily</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Healthy meal plan</p>
            </div>
          </div>
        </div>

        <div className="relative mx-auto grid max-w-6xl grid-cols-2 gap-3 px-4 pb-16 sm:grid-cols-4 sm:gap-4">
          {[
            { n: "770+", l: "Real Recipes" },
            { n: "8+", l: "Cuisines" },
            { n: "7 Din", l: "Meal Plan" },
            { n: "Free", l: "Abhi ke liye" },
          ].map((s) => (
            <div key={s.l} className="home-stat">
              <div className="font-display text-xl text-[var(--accent-soft)] sm:text-2xl">{s.n}</div>
              <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Proud moment ── */}
      <section className="home-proud">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-2">
          <div className="home-proud__image-wrap">
            <img src="/home/section-family-meal.png" alt="Family enjoying home cooked meal" className="home-proud__img" />
            <div className="home-proud__quote">
              <p className="text-sm font-medium italic text-[var(--text-primary)]">
                &ldquo;Jab ghar ka khana khilata hai, tab sabki aankhon mein woh khushi dikhti hai — wahi meri sabse badi jeet hai.&rdquo;
              </p>
              <p className="mt-2 text-xs text-[var(--accent-soft)]">— Har Indian homemaker</p>
            </div>
          </div>
          <div>
            <p className="home-eyebrow">Aapke liye banaya gaya</p>
            <h2 className="mt-2 font-display text-3xl text-[var(--text-primary)] sm:text-4xl">
              Ghar ki maa, beti, bahu —<br />sab ke liye perfect
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--text-secondary)]">
              Chahe subah ka nashta ho, bachhon ka lunchbox, ya raat ka family dinner —
              Rasoira har meal mein aapka saathi hai. Koi chef nahi chahiye, koi tension nahi.
              Bas aapki mehnat, hamari guidance.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Roz naya idea — bore hone ka chance nahi",
                "Step-by-step Hindi/English cooking guide",
                "Budget-friendly recipes — ghar ka khana, restaurant ka swad",
                "Family ki health ka dhyaan — healthy week plans",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/20 text-xs text-[var(--accent-soft)]">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="home-section border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-4">
          <p className="home-eyebrow">Kaise kaam karta hai</p>
          <h2 className="mt-2 font-display text-3xl text-[var(--text-primary)]">Pantry se plate tak — 3 easy steps</h2>
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

      {/* ── Food gallery scroll ── */}
      <section className="home-section border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-4">
          <p className="home-eyebrow">Ghar ka swad</p>
          <h2 className="mt-2 font-display text-3xl text-[var(--text-primary)]">Har region, har mood — ek hi app</h2>
          <p className="mt-2 max-w-xl text-sm text-[var(--text-secondary)]">
            Dosa se lekar biryani, poha se chole bhature — jo mann kare woh banao, photos dekho, ratings padho, pakana shuru karo.
          </p>
        </div>
        <div className="home-gallery-scroll mt-10">
          <div className="home-gallery-track">
            {[...GALLERY, ...GALLERY].map((food, i) => (
              <Link key={`${food.name}-${i}`} to="/recipes" className="home-gallery-card group">
                <img src={food.img} alt={food.name} loading="lazy" />
                <div className="home-gallery-card__overlay">
                  <span className="home-gallery-card__tag">{food.tag}</span>
                  <p className="font-semibold text-white">{food.name}</p>
                  <p className="mt-1 text-xs text-[var(--accent-soft)] opacity-0 transition group-hover:opacity-100">
                    Recipe dekho →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-6xl px-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {GALLERY.map((food) => (
              <Link key={food.name} to="/recipes" className="home-gallery-grid-card group">
                <img src={food.img} alt={food.name} loading="lazy" />
                <div className="home-gallery-grid-card__info">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-soft)]">{food.tag}</span>
                  <p className="mt-0.5 font-semibold text-[var(--text-primary)]">{food.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CuisineExplorer />

      {/* ── Testimonials ── */}
      <section className="home-section border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-4">
          <p className="home-eyebrow">Ghar ki rasoiyanon ki baat</p>
          <h2 className="mt-2 font-display text-3xl text-[var(--text-primary)]">Jo pakati hain, woh kehti hain</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="home-testimonial">
                <Stars n={t.stars} />
                <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/20 text-lg">
                    👩‍🍳
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{t.name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Healthy tips ── */}
      <section className="home-section border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-4">
          <p className="home-eyebrow text-[var(--accent-green)]">Healthy ghar ka khana</p>
          <h2 className="mt-2 font-display text-3xl text-[var(--text-primary)]">Chhoti tips, bada farq</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {[
              { t: "Kam tel use karo — steam, grill ya air-fry try karo.", e: "🥗" },
              { t: "Hafte mein 2 baar brown rice ya millets try karo.", e: "🌾" },
              { t: "Har meal ke saath salad ya raita — balance ke liye.", e: "🥒" },
              { t: "Sunday ko meal plan banao — poora hafta easy!", e: "📅" },
            ].map((tip, i) => (
              <div key={i} className="home-tip">
                <span className="text-2xl">{tip.e}</span>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{tip.t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
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

      {/* ── CTA ── */}
      <section className="home-section pb-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="home-cta">
            <div className="home-cta__glow" />
            <h2 className="relative font-display text-3xl text-[var(--text-primary)] sm:text-4xl">
              Aaj se shuru karo —<br />ghar ka khana, naye andaaz mein
            </h2>
            <p className="relative mx-auto mt-4 max-w-lg text-[var(--text-secondary)]">
              Account banao (abhi free), favourites save karo, meal plan banao.
              Aapki rasoi, aapka pride — Rasoira ke saath.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-4">
              <button type="button" onClick={openSignup} className="premium-btn tap-smooth inline-flex items-center gap-2 px-10 py-3.5 text-sm">
                Join Karo — Free for Now
                <IconArrowRight className="h-4 w-4" />
              </button>
              <button type="button" onClick={openLogin} className="premium-btn-outline tap-smooth px-10 py-3.5 text-sm">
                Login
              </button>
            </div>
            <p className="relative mt-4 text-sm text-[var(--text-secondary)]">
              Pehle se account hai?{" "}
              <button type="button" onClick={openLogin} className="text-[var(--accent-soft)] hover:underline">
                Login karo
              </button>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
