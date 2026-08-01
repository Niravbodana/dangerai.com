import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import {
  FEATURES,
  PLANS,
  getEffectivePlan,
  getSubscription,
  getTrialDaysLeft,
  getUpgradePrompt,
  getUsageSummary,
  isOnTrial,
  isPlusOrAbove,
  setSubscriptionPlan,
  startTrial,
} from "../lib/subscription";
import { track } from "../lib/analytics";
import { useState } from "react";

function UpgradePromptCard({ prompt }) {
  if (!prompt) return null;
  return (
    <div className="recipe-card mt-6 border-[var(--accent)]/30 p-5 text-left">
      <p className="font-display text-lg text-[var(--text-primary)]">{prompt.title}</p>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">{prompt.message}</p>
      <Link to={prompt.upgradeUrl || "/pricing"} className="premium-btn mt-4 inline-block px-5 py-2.5 text-sm">
        {prompt.cta || "Upgrade"}
      </Link>
    </div>
  );
}

export default function Pricing() {
  const { t } = useLanguage();
  const [sub, setSub] = useState(getSubscription);
  const [trialMsg, setTrialMsg] = useState("");
  const effectivePlan = getEffectivePlan();
  const usage = getUsageSummary();
  const trialDays = getTrialDaysLeft();

  const activate = (planId) => {
    if (planId === "free") {
      const next = setSubscriptionPlan("free");
      setSub(next);
      setTrialMsg("");
      track("subscription_activate", { plan: planId });
      return;
    }
    const res = sub.trialStartedAt ? { ok: true, ...setSubscriptionPlan(planId) } : startTrial(planId);
    if (res.ok === false) {
      setTrialMsg(res.message);
      return;
    }
    setSub(getSubscription());
    setTrialMsg("");
    track("subscription_activate", { plan: planId, trial: !sub.trialStartedAt });
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
            Active: {PLANS[effectivePlan]?.name}
            {isOnTrial() && ` · ${trialDays} day${trialDays === 1 ? "" : "s"} left in trial`}
          </p>
        )}
        {trialMsg && <p className="mt-2 text-sm text-red-300">{trialMsg}</p>}
      </div>

      {!isPlusOrAbove() && usage.length > 0 && (
        <div className="recipe-card mt-8 p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Free usage today</h2>
          <ul className="mt-3 space-y-2 text-sm text-[var(--text-primary)]">
            {usage.map((u) => (
              <li key={u.id} className="flex justify-between gap-4">
                <span>{u.label}</span>
                <span className="text-[var(--text-secondary)]">{u.used} / {u.limit} per {u.period}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {Object.values(PLANS).map((plan) => {
          const active = effectivePlan === plan.id;
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
                {active ? "Current plan" : plan.price === 0 ? "Stay Free" : sub.trialStartedAt ? `Get ${plan.name}` : "Start 7-day trial"}
              </button>
            </div>
          );
        })}
      </div>

      <div className="recipe-card mt-10 overflow-x-auto p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Feature flags</h2>
        <table className="mt-4 w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="text-[var(--text-secondary)]">
              <th className="pb-2 font-medium">Feature</th>
              <th className="pb-2 font-medium">Free</th>
              <th className="pb-2 font-medium">Plus</th>
              <th className="pb-2 font-medium">Family</th>
            </tr>
          </thead>
          <tbody className="text-[var(--text-primary)]">
            {Object.values(FEATURES).map((f) => (
              <tr key={f.id} className="border-t border-white/8">
                <td className="py-2">{f.label}</td>
                <td className="py-2">{f.freeLimit ? `${f.freeLimit}/${f.period || "day"}` : f.tier === "free" ? "✓" : "—"}</td>
                <td className="py-2">{f.tier === "plus" || f.tier === "free" ? "✓" : f.plusLimit ? `${f.plusLimit} max` : "—"}</td>
                <td className="py-2">✓</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!isPlusOrAbove() && <UpgradePromptCard prompt={getUpgradePrompt("dailyBrief")} />}

      <p className="mt-8 text-center text-xs text-[var(--text-secondary)]">
        Demo billing — trial activates locally. Razorpay live payments can plug in next.
      </p>
      <div className="mt-4 text-center">
        <Link to="/today" className="text-sm text-[var(--accent-soft)]">Back to Aaj Kya Banaye →</Link>
      </div>
    </div>
  );
}
