import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const FEATURES = [
  {
    to: "/pantry",
    emoji: "🏠",
    title: "Ghar Me Kya Pada?",
    desc: "Jo samaan ghar me hai select karo — hum batayenge kya bana sakte ho",
    color: "border-green-200 bg-green-50 hover:bg-green-100",
  },
  {
    to: "/planner",
    emoji: "🍳",
    title: "Weekly Meal Plan",
    desc: "Pura hafta ka nashta, lunch, dinner — diet aur budget ke hisaab se",
    color: "border-orange-200 bg-orange-50 hover:bg-orange-100",
  },
  {
    to: "/healthy-week",
    emoji: "💚",
    title: "Healthy Week",
    desc: "7 din ka sehat ke liye plan — roz health tips ke saath",
    color: "border-emerald-200 bg-emerald-50 hover:bg-emerald-100",
  },
  {
    to: "/recipes",
    emoji: "📖",
    title: "22,000+ Recipes",
    desc: "Veg/non-veg, photos, step-by-step cooking mode",
    color: "border-blue-200 bg-blue-50 hover:bg-blue-100",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-green-50 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl text-center">
          <span className="mb-4 inline-block rounded-full bg-green-100 px-4 py-1.5 text-sm font-semibold text-green-700">
            🎉 100% FREE — Koi payment nahi, sab kuch khula
          </span>
          <h1 className="mb-6 text-4xl font-extrabold leading-tight text-gray-900 sm:text-6xl">
            Aaj Kya <span className="text-orange-500">Banayein?</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600">
            Har din sochna band karo — hum batayenge kya pakana hai.
            22,000+ recipes, step-by-step cooking, pantry suggestions — sab free.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/pantry"
              className="rounded-full bg-orange-500 px-8 py-3 text-lg font-semibold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600"
            >
              🏠 Ghar me kya pada? →
            </Link>
            <Link
              to="/recipes"
              className="rounded-full border-2 border-orange-200 px-8 py-3 text-lg font-semibold text-orange-600 transition hover:bg-orange-50"
            >
              Recipes dekho
            </Link>
          </div>

          <div className="mx-auto mt-10 flex max-w-lg flex-wrap justify-center gap-6 text-center">
            {[
              { n: "22,000+", l: "Recipes" },
              { n: "Step-by-step", l: "Cooking Mode" },
              { n: "7 Din", l: "Meal Plan" },
              { n: "₹0", l: "Completely Free" },
            ].map((s) => (
              <div key={s.l}>
                <div className="text-2xl font-bold text-orange-600">{s.n}</div>
                <div className="text-xs text-gray-500">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">Kya-kya kar sakte ho?</h2>
        <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <Link
              key={f.to}
              to={f.to}
              className={`rounded-2xl border p-6 transition ${f.color}`}
            >
              <span className="text-3xl">{f.emoji}</span>
              <h3 className="mt-3 text-lg font-bold text-gray-900">{f.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{f.desc}</p>
              <span className="mt-3 inline-block text-sm font-medium text-orange-600">
                Try karo →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-orange-500 px-4 py-16 text-center text-white">
        <h2 className="mb-4 text-3xl font-bold">Login optional hai!</h2>
        <p className="mb-6 text-orange-100">
          Bina login ke bhi sab features use kar sakte ho.
          Login sirf preferences save karne ke liye.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/planner"
            className="inline-block rounded-full bg-white px-8 py-3 font-semibold text-orange-600 transition hover:bg-orange-50"
          >
            Abhi Meal Plan Banao →
          </Link>
          <Link
            to="/signup"
            className="inline-block rounded-full border-2 border-white px-8 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            Account banao (optional)
          </Link>
        </div>
      </section>
    </div>
  );
}
