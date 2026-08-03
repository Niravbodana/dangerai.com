import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

const KEY = "akb-coach-done";

const STEPS = {
  en: [
    {
      icon: "🔍",
      title: "Search or use Pantry",
      body: "Tell us what's at home — get matching recipes in seconds.",
      cta: "Next",
    },
    {
      icon: "☀️",
      title: "Aaj Kya Banaye?",
      body: "4 meals picked for your taste, region, and pantry — every day.",
      cta: "Next",
    },
    {
      icon: "🍳",
      title: "Cook step-by-step",
      body: "Big steps, voice 🔊, swipe next on phone — finish and save streak!",
      cta: "Start cooking",
    },
  ],
  hi: [
    {
      icon: "🔍",
      title: "Search ya Pantry use karo",
      body: "Ghar me kya pada hai batao — turant recipe milegi.",
      cta: "Aage",
    },
    {
      icon: "☀️",
      title: "Aaj Kya Banaye?",
      body: "Roz 4 meals — aapke taste, state aur pantry ke hisaab se.",
      cta: "Aage",
    },
    {
      icon: "🍳",
      title: "Step-by-step pakao",
      body: "Bade steps, voice 🔊, phone pe swipe — streak banao!",
      cta: "Shuru karo",
    },
  ],
};

export default function FirstVisitCoach() {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(() => !localStorage.getItem(KEY));
  const [step, setStep] = useState(0);

  if (!open) return null;

  const steps = STEPS[lang] || STEPS.en;
  const current = steps[step];
  const isLast = step >= steps.length - 1;

  const finish = () => {
    localStorage.setItem(KEY, "1");
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[180] flex items-end justify-center bg-black/55 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md animate-modal-in rounded-3xl border border-white/15 bg-[#1c1814]/98 p-6 shadow-2xl safe-bottom">
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-[var(--accent-soft)]">
          {lang === "hi" ? "Rasoira mein swagat" : "Welcome to Rasoira"}
        </p>
        <p className="mt-4 text-center text-4xl">{current.icon}</p>
        <h2 className="mt-3 text-center font-display text-xl text-[var(--text-primary)]">{current.title}</h2>
        <p className="mt-2 text-center text-sm leading-relaxed text-[var(--text-secondary)]">{current.body}</p>
        <div className="mt-6 flex justify-center gap-1.5">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-[var(--accent)]" : "w-1.5 bg-white/20"}`}
            />
          ))}
        </div>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={finish} className="premium-btn-outline flex-1 py-3 text-sm">
            {lang === "hi" ? "Skip" : "Skip"}
          </button>
          {isLast ? (
            <Link to="/today" onClick={finish} className="premium-btn flex flex-1 items-center justify-center py-3 text-sm">
              {current.cta}
            </Link>
          ) : (
            <button type="button" onClick={() => setStep((s) => s + 1)} className="premium-btn flex-1 py-3 text-sm">
              {current.cta}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
