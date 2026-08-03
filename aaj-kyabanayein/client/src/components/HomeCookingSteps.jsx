const STEPS = [
  {
    n: "01",
    title: "Ghar ka pantry batao",
    desc: "Jo ingredients fridge ya kitchen mein hain, add karo. Smart matching turant recipes dikhayega — kya pada hai, wahi se magic.",
    img: "/home/section-pantry-planning.png",
  },
  {
    n: "02",
    title: "Recipe choose karo",
    desc: "1000+ verified options — breakfast se dinner tak. Premium photos, ratings, reviews — jo dil kare woh banao.",
    img: "/home/gallery-thali.png",
  },
  {
    n: "03",
    title: "Step-by-step pakao",
    desc: "Phone haath mein, ek ek step follow karo. Timer, tips, voice guide — jaise chef saath ho, par ghar ki warmth ke saath.",
    img: "/home/section-cooking-steps.png",
  },
];

export default function HomeCookingSteps() {
  return (
    <section className="home-section border-t border-white/[0.06]">
      <div className="mx-auto max-w-6xl px-4">
        <p className="home-eyebrow">Kaise kaam karta hai</p>
        <h2 className="mt-2 font-display text-3xl text-[var(--text-primary)] sm:text-4xl">
          Pantry se plate tak — 3 easy steps
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">
          Simple, beautiful, stress-free — bilkul waise jaise aap ghar mein khana banati hain, par ab har step clear hai.
        </p>
        <div className="mt-12 space-y-16 sm:space-y-20">
          {STEPS.map((step, i) => (
            <div
              key={step.n}
              className={`home-step-row ${i % 2 === 1 ? "home-step-row--reverse" : ""}`}
            >
              <div className="home-step-row__img-wrap">
                <img
                  src={step.img}
                  alt={step.title}
                  className="home-step-row__img"
                  loading="lazy"
                />
                <span className="home-step-row__num">{step.n}</span>
              </div>
              <div className="home-step-row__text">
                <h3 className="font-display text-2xl text-[var(--text-primary)] sm:text-3xl">
                  {step.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-[var(--text-secondary)]">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
