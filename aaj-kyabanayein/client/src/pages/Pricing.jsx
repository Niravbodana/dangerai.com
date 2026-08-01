import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { PLANS, getSubscription, setSubscriptionPlan, isPlusOrAbove } from "../lib/subscription";
import { track } from "../lib/analytics";
import { useState } from "react";

export default function Pricing() {
  const { t } = useLanguage();
  const [sub, setSub] = useState(getSubscription);

  const activate = (planId) => {
    const next = setSubscriptionPlan(planId);
    setSub(next);
    track("subscription_activate", { plan: planId });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="text-center">
        <h1 className="font-display text-3xl text-[var(--text-primary)]">{t("pricing")}</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Core cooking always free. Plus unlocks unlimited daily plans & offline voice chef.
        </p>
        {isPlusOrAbove() && (
          <p className="mt-3 text-sm text-[var(--accent-soft)]">
            Active: {PLANS[sub.plan]?.name}
            {sub.trialEnds ? ` · trial till ${sub.trialEnds.slice(0, 10)}` : ""}
          </p>
        )}
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {Object.values(PLANS).map((plan) => {
          const active = sub.plan === plan.id;
          const popular = plan.id === "plus";
          return (
            <div
              key={plan.id}
              className={`recipe-card relative flex flex-col p-6 ${popular ? "border-[var(--accent)]/40" : ""}`}
            >
              {popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--accent)] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#14110e]">
                  Popular
                </span>
              )}
              <h2 className="font-display text-xl text-[var(--text-primary)]">{plan.name}</h2>
              <p className="text-xs text-[var(--text-secondary)]">{plan.nameHi}</p>
              <p className="mt-4 font-display text-4xl text-[var(--text-primary)]">
                {plan.price === 0 ? "₹0" : `₹${plan.price}`}
                {plan.period && plan.price > 0 && (
                  <span className="text-sm font-sans text-[var(--text-secondary)]">/{plan.period}</span>
                )}
              </p>
              <ul className="mt-5 flex-1 space-y-2 text-left text-sm text-[var(--text-primary)]">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-[var(--accent-green)]">—</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => activate(plan.id)}
                className={`mt-6 w-full py-3 text-sm ${active ? "premium-btn-outline" : "premium-btn"}`}
              >
                {active ? "Current plan" : plan.price === 0 ? "Stay Free" : "Start 7-day trial"}
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-[var(--text-secondary)]">
        Demo billing — trial activates locally. Razorpay live payments can plug in next.
      </p>
      <div className="mt-4 text-center">
        <Link to="/today" className="text-sm text-[var(--accent-soft)]">Back to Aaj Kya Banaye →</Link>
      </div>
    </div>
  );
}
