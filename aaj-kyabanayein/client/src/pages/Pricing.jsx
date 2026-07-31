import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPricing } from "../api";
import Navbar from "../components/Navbar";

export default function Pricing() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPricing()
      .then((data) => setPlans(data.plans))
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#fffbf7]">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900">Simple Pricing</h1>
          <p className="mt-2 text-gray-600">Roz ki tension — sirf ₹99 me khatam</p>
        </div>

        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : (
          <div className="grid gap-8 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl border bg-white p-8 shadow-sm ${
                  plan.popular
                    ? "border-orange-300 ring-2 ring-orange-200"
                    : "border-gray-100"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-500 px-4 py-1 text-xs font-semibold text-white">
                    Sabse popular
                  </span>
                )}
                <h3 className="text-lg font-bold text-gray-900">{plan.nameHi}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-extrabold text-gray-900">
                    {plan.price === 0 ? "Free" : `₹${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-gray-500">/{plan.period}</span>
                  )}
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-green-500">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/planner"
                  className={`mt-8 block w-full rounded-xl py-3 text-center font-semibold transition ${
                    plan.popular
                      ? "bg-orange-500 text-white hover:bg-orange-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {plan.price === 0 ? "Free shuru karo" : "Plan choose karo"}
                </Link>
              </div>
            ))}
          </div>
        )}

        <p className="mt-12 text-center text-sm text-gray-400">
          Payment integration (Razorpay) jaldi add hoga. Abhi demo mode me sab plans try kar sakte ho.
        </p>
      </div>
    </div>
  );
}
