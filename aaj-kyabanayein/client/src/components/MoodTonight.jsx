import { Link } from "react-router-dom";

const MOODS = [
  {
    id: "tired",
    title: "Thak gaye ho?",
    desc: "20 minute se kam — jaldi, soft, ghar jaisa",
    to: "/collections/15-min",
    tone: "amber",
  },
  {
    id: "guests",
    title: "Mehmaan aa rahe hain",
    desc: "Party thali, biryani, special dinner energy",
    to: "/collections/sunday-lunch",
    tone: "rose",
  },
  {
    id: "rain",
    title: "Baarish + chai mood",
    desc: "Chaat, pakode, garam comfort bowls",
    to: "/collections/street-chaat",
    tone: "teal",
  },
  {
    id: "light",
    title: "Halka aur healthy",
    desc: "Low oil, high fiber, clean energy",
    to: "/collections/diabetic-friendly",
    tone: "sage",
  },
  {
    id: "sweet",
    title: "Kuch meetha ho jaye",
    desc: "Festival sweets aur dessert classics",
    to: "/collections/diwali-sweets",
    tone: "gold",
  },
  {
    id: "pantry",
    title: "Jo ghar mein hai",
    desc: "Pantry kholo — ingredients se recipe",
    to: "/pantry",
    tone: "clay",
  },
];

export default function MoodTonight() {
  return (
    <section className="border-t border-white/[0.06] py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
            Aaj ka mood
          </p>
          <h2 className="mt-2 font-display text-2xl text-[var(--text-primary)] sm:text-3xl">
            Feeling se recipe
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Search mat socho — mood chuno, plan ready.
          </p>
        </div>

        <div className="mood-grid mt-8">
          {MOODS.map((mood) => (
            <Link
              key={mood.id}
              to={mood.to}
              className={`mood-tile mood-tile--${mood.tone} group`}
            >
              <h3 className="font-display text-lg text-[var(--text-primary)] sm:text-xl">
                {mood.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                {mood.desc}
              </p>
              <span className="mt-4 inline-flex text-xs font-semibold uppercase tracking-wider text-[var(--accent-soft)] transition group-hover:translate-x-1">
                Open →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
