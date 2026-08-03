export default function HomeProudMoment() {
  return (
    <section className="home-proud">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-2">
        <div className="home-proud__image-wrap">
          <img
            src="/home/section-family-meal.png"
            alt="Family enjoying home cooked meal together"
            className="home-proud__img"
            loading="lazy"
          />
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
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/20 text-xs text-[var(--accent-soft)]">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
