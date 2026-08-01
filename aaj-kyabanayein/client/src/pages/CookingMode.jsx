import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchRecipe } from "../api";
import { useLanguage } from "../context/LanguageContext";
import RecipeImage from "../components/RecipeImage";
import { COOK_LANGS, getCookUI, getIngredientLabel, getRecipeName } from "../i18n/cookingLang";

export default function CookingMode() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const [recipe, setRecipe] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});
  const [cookLang, setCookLang] = useState(() => localStorage.getItem("akb-cook-lang") || lang || "en");

  useEffect(() => {
    localStorage.setItem("akb-cook-lang", cookLang);
  }, [cookLang]);

  useEffect(() => {
    fetchRecipe(id).then((data) => setRecipe(data.recipe));
    document.body.classList.add("cooking-active");
    return () => document.body.classList.remove("cooking-active");
  }, [id]);

  const steps = recipe?.cookingFlow || [];
  const current = steps[stepIndex];
  const isDone = current?.type === "done";
  const isIntro = current?.type === "intro";
  const cookSteps = steps.filter((s) => s.type === "cook");
  const cookStepNumber = isIntro ? 0 : Math.max(0, stepIndex - 1);
  const ui = getCookUI(cookLang);

  const stepText = current
    ? cookLang === "hi" || cookLang === "gu" || cookLang === "mr"
      ? current.titleHi || current.title
      : cookLang === "hinglish"
        ? `${current.title}${current.titleHi ? ` — ${current.titleHi}` : ""}`
        : current.title || current.titleHi
    : "";

  const stepDesc = current
    ? cookLang === "hi" || cookLang === "gu" || cookLang === "mr"
      ? current.descriptionHi || current.description
      : current.description || current.descriptionHi
    : "";

  if (!recipe) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[var(--accent)]" />
      </div>
    );
  }

  if (!started) {
    const allChecked = recipe.ingredients?.every((ing) => checkedItems[ing.name]);
    return (
      <div className="cooking-shell min-h-screen pb-28">
        <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
          <div className="relative mx-auto mb-5 max-w-sm overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10">
            <RecipeImage src={recipe.image} recipeId={recipe.id} alt={recipe.name} className="h-48 w-full object-cover sm:h-56" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#14110e]/70 via-transparent to-transparent" />
          </div>
          <h1 className="text-center font-display text-2xl text-[var(--text-primary)] sm:text-3xl">
            {getRecipeName(recipe, cookLang)}
          </h1>
          <p className="mt-2 text-center text-sm text-[var(--text-secondary)]">
            {cookSteps.length} {ui.steps} · {recipe.ingredients?.length} ingredients
          </p>

          <div className="glass-strong mt-6 rounded-2xl p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap gap-2">
              {COOK_LANGS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setCookLang(l.id)}
                  className={`tap-smooth rounded-full px-3 py-1.5 text-xs font-medium ${
                    cookLang === l.id
                      ? "bg-[var(--accent)] text-[#14110e]"
                      : "border border-white/10 bg-white/5 text-[var(--text-secondary)]"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              {ui.ingredients}
            </h2>
            <ul className="max-h-64 space-y-1 overflow-y-auto">
              {recipe.ingredients?.map((ing) => (
                <li key={ing.name}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-white/5">
                    <input
                      type="checkbox"
                      checked={checkedItems[ing.name] || false}
                      onChange={() => setCheckedItems((p) => ({ ...p, [ing.name]: !p[ing.name] }))}
                      className="cooking-ingredient-check"
                    />
                    <span className="text-sm text-[var(--text-primary)]">{getIngredientLabel(ing, cookLang)}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={() => setStarted(true)}
            className="premium-btn tap-smooth mt-6 w-full py-4 text-base"
          >
            {allChecked ? ui.startCooking : `${ui.startCooking} →`}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cooking-shell flex min-h-screen flex-col">
      <div className="sticky top-0 z-50 border-b border-white/10 bg-[#14110e]/95 px-4 py-3 backdrop-blur-xl safe-top">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <button type="button" onClick={() => navigate(`/recipe/${id}`)} className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-soft)]">
            {ui.close}
          </button>
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {isDone ? "Done" : isIntro ? "Ready" : `Step ${cookStepNumber} / ${cookSteps.length}`}
          </span>
        </div>
        <div className="mx-auto mt-2 h-1.5 max-w-2xl overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-soft)] transition-all duration-500"
            style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 pb-36">
        <div className="cooking-step-card glass-strong rounded-2xl p-6 text-center sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-soft)] text-2xl font-bold text-[#14110e] shadow-lg shadow-[var(--accent)]/20">
            {isDone ? "🍽️" : isIntro ? "📋" : cookStepNumber}
          </div>
          <p className="mt-6 font-display text-xl leading-relaxed text-[var(--text-primary)] sm:text-2xl">
            {stepText}
          </p>
          {stepDesc && stepDesc !== stepText && (
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">{stepDesc}</p>
          )}

          <div className="cooking-step-dots">
            {steps.map((s, i) => (
              <span
                key={s.id ?? i}
                className={`cooking-step-dot ${i === stepIndex ? "cooking-step-dot--active" : ""} ${i < stepIndex ? "cooking-step-dot--done" : ""}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="safe-bottom fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[#14110e]/95 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl gap-3">
          <button
            type="button"
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            disabled={stepIndex === 0}
            className="premium-btn-outline flex-1 py-3.5 text-sm disabled:opacity-30"
          >
            {ui.back}
          </button>
          {isDone ? (
            <button
              type="button"
              onClick={() => navigate(`/recipe/${id}/review?from=cook`)}
              className="premium-btn flex-1 py-3.5 text-sm"
            >
              {ui.review}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStepIndex((i) => Math.min(steps.length - 1, i + 1))}
              className="premium-btn flex-1 py-3.5 text-sm"
            >
              {ui.next}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
