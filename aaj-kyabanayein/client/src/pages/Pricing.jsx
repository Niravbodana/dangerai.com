import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const FREE_FEATURES = [
  "Pura hafta meal plan (7 din)",
  "22,000+ recipes with photos",
  "Step-by-step cooking mode with timer",
  "Ghar me kya pada — pantry suggestions",
  "Weekly healthy plan",
  "Auto bazaar grocery list",
  "Veg / Non-veg / Jain / Diabetic filters",
  "Login optional — sab bina account ke bhi",
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-[#fffbf7]">
      <Navbar />

      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <span className="mb-4 inline-block rounded-full bg-green-100 px-4 py-1.5 text-sm font-semibold text-green-700">
          🎉 Abhi sab FREE hai
        </span>
        <h1 className="mb-4 text-4xl font-bold text-gray-900">₹0 — Forever Free</h1>
        <p className="mb-8 text-gray-600">
          Abhi koi payment plan nahi hai. Jab visits badhengi tab premium features add karenge.
          Filhaal sab kuch bilkul free — poora app use karo!
        </p>

        <div className="rounded-2xl border-2 border-green-200 bg-white p-8 text-left shadow-sm">
          <h2 className="mb-6 text-center text-xl font-bold text-gray-900">
            Sab kuch included — Free
          </h2>
          <ul className="space-y-3">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm text-gray-700">
                <span className="text-green-500">✓</span>
                {f}
              </li>
            ))}
          </ul>
          <Link
            to="/planner"
            className="mt-8 block w-full rounded-xl bg-orange-500 py-3 text-center font-semibold text-white transition hover:bg-orange-600"
          >
            Abhi shuru karo →
          </Link>
        </div>

        <div className="mt-12 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6">
          <h3 className="font-semibold text-gray-700">Payment Plans — Coming Soon</h3>
          <p className="mt-2 text-sm text-gray-500">
            Jab app grow karega tab optional premium plans add honge.
            Abhi focus hai app ko behtar banane par — aapka feedback zaroori hai!
          </p>
        </div>
      </div>
    </div>
  );
}
