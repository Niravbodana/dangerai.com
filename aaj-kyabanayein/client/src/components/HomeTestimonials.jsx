import { IconStar } from "./Icons";

const TESTIMONIALS = [
  {
    name: "Sunita M.",
    city: "Pune",
    text: "Pehle roz sochti thi aaj kya banau. Ab Rasoira se 2 minute mein plan ho jata hai. Family khush, main bhi proud feel karti hoon.",
    stars: 5,
  },
  {
    name: "Kavita R.",
    city: "Delhi",
    text: "Meri saas ne kaha — yeh dal restaurant se better hai! Step-by-step guide se first time perfect bana.",
    stars: 5,
  },
  {
    name: "Priya K.",
    city: "Ahmedabad",
    text: "Ghar ka khana, par itna variety! Bachhon ko bore nahi hota. Pantry feature se jo pada hai usi se recipe milti hai.",
    stars: 5,
  },
  {
    name: "Meena D.",
    city: "Jaipur",
    text: "Sunday meal plan ek click mein. Pura hafta sorted. Ab kitchen stress-free hai — sach mein!",
    stars: 5,
  },
];

function Stars({ n }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <IconStar
          key={s}
          filled={s <= n}
          className={`h-3.5 w-3.5 ${s <= n ? "text-[var(--accent-soft)]" : "text-white/20"}`}
        />
      ))}
    </div>
  );
}

export default function HomeTestimonials() {
  return (
    <section className="home-section border-t border-white/[0.06]">
      <div className="mx-auto max-w-6xl px-4">
        <p className="home-eyebrow">Ghar ki rasoiyanon ki baat</p>
        <h2 className="mt-2 font-display text-3xl text-[var(--text-primary)] sm:text-4xl">
          Jo pakati hain, woh kehti hain
        </h2>
        <p className="mt-3 max-w-xl text-sm text-[var(--text-secondary)]">
          Lakhs of homemakers trust Rasoira — kyunki yeh unki zindagi samajhta hai.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="home-testimonial">
              <Stars n={t.stars} />
              <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
                &ldquo;{t.text}&rdquo;
              </p>
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
  );
}
