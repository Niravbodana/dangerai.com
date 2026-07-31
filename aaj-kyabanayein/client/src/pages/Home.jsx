import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-green-50 px-4 py-20">
        <div className="mx-auto max-w-6xl text-center">
          <span className="mb-4 inline-block rounded-full bg-orange-100 px-4 py-1.5 text-sm font-medium text-orange-700">
            🍽️ Roz ki tension khatam
          </span>
          <h1 className="mb-6 text-4xl font-extrabold leading-tight text-gray-900 sm:text-6xl">
            Aaj Kya <span className="text-orange-500">Banayein?</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600">
            Har din sochna padta hai — nashta kya, lunch kya, dinner kya?
            Hum aapke liye poora meal plan banate hain. Budget, diet aur family
            size ke hisaab se.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/planner"
              className="rounded-full bg-orange-500 px-8 py-3 text-lg font-semibold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600"
            >
              Aaj ka plan dekho →
            </Link>
            <Link
              to="/pricing"
              className="rounded-full border-2 border-orange-200 px-8 py-3 text-lg font-semibold text-orange-600 transition hover:bg-orange-50"
            >
              ₹99/month se shuru
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-3">
          {[
            {
              emoji: "🌅",
              title: "Roz ka plan",
              desc: "Nashta, lunch, dinner — sab ek jagah. Sochna band, pakana shuru.",
            },
            {
              emoji: "🛒",
              title: "Bazaar list",
              desc: "Kya kya lena hai — auto list ban jati hai. Bazaar me time bachega.",
            },
            {
              emoji: "💰",
              title: "Budget friendly",
              desc: "Sasta, medium ya premium — aapke budget ke hisaab se recipes.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-orange-100 bg-white p-6 text-center shadow-sm"
            >
              <span className="text-4xl">{f.emoji}</span>
              <h3 className="mt-4 text-lg font-bold text-gray-900">{f.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-orange-500 px-4 py-16 text-center text-white">
        <h2 className="mb-4 text-3xl font-bold">Aaj hi try karo — Free!</h2>
        <p className="mb-6 text-orange-100">Pehle din ka plan bilkul free. Pasand aaye toh Pro le lo.</p>
        <Link
          to="/planner"
          className="inline-block rounded-full bg-white px-8 py-3 font-semibold text-orange-600 transition hover:bg-orange-50"
        >
          Free Meal Plan →
        </Link>
      </section>
    </div>
  );
}
