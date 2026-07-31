import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import BlinkingSlogan from "../components/BlinkingSlogan";

const HERO_IMG = "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200&h=600&fit=crop";

export default function Home() {
  const { t } = useLanguage();

  const features = [
    { to: "/pantry", emoji: "🏠", title: "Ghar Me Kya Pada?", desc: "Pantry se recipe suggest" },
    { to: "/planner", emoji: "🍳", title: "Weekly Meal Plan", desc: "7 din ka poora plan" },
    { to: "/healthy-week", emoji: "💚", title: "Healthy Week", desc: "Sehat ke liye best" },
    { to: "/recipes", emoji: "📖", title: "1 Lakh+ Recipes", desc: "Indian, Italian, Korean" },
    { to: "/favorites", emoji: "❤️", title: "Favorites", desc: "Pasand ki recipes save" },
  ];

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="Cooking" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/70" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <div className="max-w-xl">
            <span className="mb-4 inline-block rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-800">
              🎉 {t("free")}
            </span>
            <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl">
              {t("appName")}
            </h1>
            <BlinkingSlogan />
            <p className="mb-8 text-lg text-stone-600">{t("heroDesc")}</p>
            <div className="flex flex-wrap gap-3">
              <Link to="/recipes" className="premium-btn px-8 py-3 text-base">
                {t("browseRecipes")} →
              </Link>
              <Link
                to="/pantry"
                className="rounded-full border border-stone-200 bg-white px-8 py-3 text-base font-semibold text-stone-700 shadow-sm hover:bg-stone-50"
              >
                {t("tryPantry")}
              </Link>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap gap-8">
            {[
              { n: "1 Lakh+", l: t("recipesCount") },
              { n: "Step-by-step", l: t("cookingMode") },
              { n: "7 Din", l: t("weekPlan") },
              { n: "₹0", l: t("completelyFree") },
            ].map((s) => (
              <div key={s.l}>
                <div className="text-2xl font-bold text-orange-600">{s.n}</div>
                <div className="text-xs text-stone-500">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Link key={f.to} to={f.to} className="premium-card p-6 transition hover:shadow-lg">
              <span className="text-3xl">{f.emoji}</span>
              <h3 className="mt-3 font-bold text-stone-900">{f.title}</h3>
              <p className="mt-1 text-sm text-stone-500">{f.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
