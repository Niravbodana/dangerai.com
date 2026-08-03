import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { IconArrowLeft, IconArrowRight } from "./Icons";

const BROWSE = [
  { id: "all", icon: "🍽️", labelEn: "All Recipes", labelHi: "सभी रेसिपी", descEn: "Full catalog", descHi: "पूरी कैटलॉग" },
  { id: "trending", icon: "🔥", labelEn: "Hot Makings", labelHi: "हॉट मेकिंग", descEn: "Trending now", descHi: "अभी ट्रेंडिंग" },
];

const MEALS = [
  { id: "veg-breakfast", icon: "🌅", labelEn: "Breakfast", labelHi: "नाश्ता" },
  { id: "veg-lunch", icon: "🍱", labelEn: "Lunch", labelHi: "दोपहर" },
  { id: "veg-dinner", icon: "🌙", labelEn: "Dinner", labelHi: "रात का खाना" },
  { id: "snack", icon: "🍿", labelEn: "Snacks", labelHi: "स्नैक्स" },
  { id: "healthy", icon: "💚", labelEn: "Healthy", labelHi: "स्वस्थ" },
  { id: "quick", icon: "⚡", labelEn: "Quick ≤20m", labelHi: "जल्दी ≤20 मिन" },
];

const CUISINES = [
  { id: "all", labelEn: "All cuisines", labelHi: "सभी व्यंजन", icon: "🌍" },
  { id: "indian", labelEn: "Indian", labelHi: "भारतीय", icon: "🇮🇳" },
  { id: "north-indian", labelEn: "North Indian", labelHi: "उत्तर भारतीय", icon: "🍛" },
  { id: "south-indian", labelEn: "South Indian", labelHi: "दक्षिण भारतीय", icon: "🥘" },
  { id: "gujarati", labelEn: "Gujarati", labelHi: "गुजराती", icon: "🫓" },
  { id: "maharashtrian", labelEn: "Maharashtrian", labelHi: "महाराष्ट्रीय", icon: "🍲" },
  { id: "bengali", labelEn: "Bengali", labelHi: "बंगाली", icon: "🐟" },
  { id: "punjabi", labelEn: "Punjabi", labelHi: "पंजाबी", icon: "🫓" },
  { id: "chinese", labelEn: "Chinese", labelHi: "चाइनीज़", icon: "🥡" },
  { id: "thai", labelEn: "Thai", labelHi: "थाई", icon: "🍜" },
  { id: "mexican", labelEn: "Mexican", labelHi: "मेक्सिकन", icon: "🌮" },
  { id: "mughlai", labelEn: "Mughlai", labelHi: "मुग़लाई", icon: "👑" },
  { id: "afghani", labelEn: "Afghani", labelHi: "अफ़गानी", icon: "🥙" },
  { id: "indonesian", labelEn: "Indonesian", labelHi: "इंडोनेशियाई", icon: "🍚" },
  { id: "turkish", labelEn: "Turkish", labelHi: "तुर्की", icon: "🧆" },
];

const STEPS = [
  { key: "browse", labelEn: "Browse", labelHi: "ब्राउज़" },
  { key: "meal", labelEn: "Meal", labelHi: "भोजन" },
];

function StepCard({ icon, title, desc, active, onClick }) {
  return (
    <button type="button" onClick={onClick} className={`recipe-filter-card ${active ? "recipe-filter-card--active" : ""}`}>
      <span className="recipe-filter-card__icon">{icon}</span>
      <div className="text-left">
        <p className="font-medium text-[var(--text-primary)]">{title}</p>
        {desc && <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{desc}</p>}
      </div>
    </button>
  );
}

export default function RecipeFilterDrawer({
  open,
  onClose,
  sortTrending,
  activeCategory,
  activeCuisine,
  maxCookTime,
  onSelect,
  onCuisineSelect,
  activeFilterCount,
  onClear,
}) {
  const { lang } = useLanguage();
  const [step, setStep] = useState(0);

  if (!open) return null;

  const isMealActive = (id) => {
    if (id === "quick") return !!maxCookTime && maxCookTime <= 20;
    if (id === "snack") return activeCategory === "snack";
    if (id === "healthy") return activeCategory === "healthy";
    return !sortTrending && activeCategory === id;
  };

  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => (step === 0 ? onClose() : setStep((s) => s - 1));

  const handleCuisinePick = (cuisineId) => {
    onCuisineSelect(cuisineId);
    if (sortTrending || cuisineId !== "all") {
      onSelect("trending");
    }
  };

  return (
    <div className="fixed inset-0 z-[150] lg:hidden">
      <button type="button" className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} aria-label="Close filters" />
      <div className="recipe-filter-drawer safe-top safe-bottom">
        <div className="recipe-filter-drawer__header">
          <button type="button" onClick={goBack} className="recipe-filter-drawer__back tap-smooth" aria-label="Back">
            <IconArrowLeft className="h-4 w-4" />
          </button>
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent-soft)]">
              {lang === "hi" ? "फ़िल्टर" : "Filters"} · {step + 1}/{STEPS.length}
            </p>
            <p className="font-display text-lg text-[var(--text-primary)]">
              {lang === "hi" ? STEPS[step].labelHi : STEPS[step].labelEn}
            </p>
          </div>
          <button type="button" onClick={onClose} className="recipe-filter-drawer__close tap-smooth" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="recipe-filter-drawer__progress">
          {STEPS.map((s, i) => (
            <span key={s.key} className={`recipe-filter-drawer__dot ${i <= step ? "recipe-filter-drawer__dot--on" : ""}`} />
          ))}
        </div>

        <div className="recipe-filter-drawer__body">
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="recipe-filter-drawer__hint">
                  {lang === "hi" ? "Kya explore karna hai?" : "What would you like to explore?"}
                </p>
                {BROWSE.map((item) => (
                  <StepCard
                    key={item.id}
                    icon={item.icon}
                    title={lang === "hi" ? item.labelHi : item.labelEn}
                    desc={lang === "hi" ? item.descHi : item.descEn}
                    active={item.id === "trending" ? sortTrending : !sortTrending && activeCategory === "all" && !maxCookTime}
                    onClick={() => onSelect(item.id)}
                  />
                ))}
              </div>

              <div>
                <p className="recipe-filter-drawer__hint mb-2">
                  {lang === "hi" ? "🔥 Hot Makings — cuisine chuno" : "🔥 Hot Makings — pick a cuisine"}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {CUISINES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleCuisinePick(c.id)}
                      className={`recipe-filter-chip recipe-filter-chip--cuisine ${activeCuisine === c.id ? "recipe-filter-chip--active" : ""}`}
                    >
                      <span className="mr-1">{c.icon}</span>
                      {lang === "hi" ? c.labelHi : c.labelEn}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-2">
              <p className="recipe-filter-drawer__hint">
                {lang === "hi" ? "Kab ka khana?" : "Which meal time?"}
              </p>
              {MEALS.map((item) => (
                <StepCard
                  key={item.id}
                  icon={item.icon}
                  title={lang === "hi" ? item.labelHi : item.labelEn}
                  active={isMealActive(item.id)}
                  onClick={() => onSelect(item.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="recipe-filter-drawer__footer">
          {activeFilterCount > 0 && (
            <button type="button" onClick={onClear} className="premium-btn-outline w-full py-3 text-sm">
              {lang === "hi" ? "सब साफ़ करें" : "Clear all filters"}
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={goNext} className="premium-btn flex w-full items-center justify-center gap-2 py-3 text-sm">
              {lang === "hi" ? "आगे" : "Next"}
              <IconArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button type="button" onClick={onClose} className="premium-btn w-full py-3 text-sm">
              {lang === "hi" ? "रेसिपी देखें" : "Show recipes"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
