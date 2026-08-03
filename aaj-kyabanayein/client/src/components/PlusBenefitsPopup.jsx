import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { isPlusOrAbove, PLANS } from "../lib/subscription";

const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const DISMISS_KEY = "akb-plus-popup-dismissed-at";

const BENEFITS = {
  en: {
    title: "Unlock Rasoira Plus",
    subtitle: "Cook smarter — unlimited plans, offline voice, grocery links",
    cta: "See plans",
    later: "Maybe later",
    perks: PLANS.plus.features.slice(0, 5),
  },
  hi: {
    title: "Rasoira Plus unlock karein",
    subtitle: "Zyada plans, offline voice chef, grocery links — sab ek jagah",
    cta: "Plans dekho",
    later: "Baad mein",
    perks: [
      "Unlimited AI daily plans",
      "Offline cook packs",
      "Hands-free voice chef",
      "Grocery partner links",
      "No ads · Priority photos",
    ],
  },
};

const SKIP_PATHS = ["/pricing", "/admin", "/cook"];

export default function PlusBenefitsPopup() {
  const { lang } = useLanguage();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const shouldSkip = SKIP_PATHS.some((p) => location.pathname.startsWith(p));

  const showPopup = useCallback(() => {
    if (shouldSkip || isPlusOrAbove()) return;
    setOpen(true);
  }, [shouldSkip]);

  useEffect(() => {
    if (shouldSkip || isPlusOrAbove()) return undefined;

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    const sinceDismiss = Date.now() - dismissedAt;
    const initialDelay = dismissedAt && sinceDismiss < INTERVAL_MS ? INTERVAL_MS - sinceDismiss : INTERVAL_MS;

    const initialTimer = setTimeout(showPopup, initialDelay);
    const interval = setInterval(showPopup, INTERVAL_MS);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [shouldSkip, showPopup, location.pathname]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setOpen(false);
  };

  if (!open || shouldSkip || isPlusOrAbove()) return null;

  const copy = BENEFITS[lang] || BENEFITS.en;

  return (
    <div className="fixed inset-0 z-[170] flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md animate-modal-in rounded-3xl border border-[var(--accent)]/25 bg-[#1c1814]/98 p-6 shadow-2xl safe-bottom">
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-[var(--accent-soft)]">
          ✨ Rasoira Plus
        </p>
        <h2 className="mt-3 text-center font-display text-xl text-[var(--text-primary)]">{copy.title}</h2>
        <p className="mt-2 text-center text-sm text-[var(--text-secondary)]">{copy.subtitle}</p>
        <ul className="mt-4 space-y-2 text-sm text-[var(--text-primary)]">
          {copy.perks.map((perk) => (
            <li key={perk} className="flex gap-2">
              <span className="text-[var(--accent-green)]">✓</span>
              {perk}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-center text-xs text-[var(--text-secondary)]">
          ₹{PLANS.plus.price}/month · 7-day trial available
        </p>
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={dismiss} className="premium-btn-outline flex-1 py-3 text-sm">
            {copy.later}
          </button>
          <Link to="/pricing" onClick={dismiss} className="premium-btn flex flex-1 items-center justify-center py-3 text-sm">
            {copy.cta}
          </Link>
        </div>
      </div>
    </div>
  );
}
