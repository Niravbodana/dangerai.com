import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchRecipe } from "../api";
import { COOK_LANGS, getCookUI, getIngredientLabel, getRecipeName, resolveCookingStep } from "../i18n/cookingLang";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function CookingMode() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [timerLeft, setTimerLeft] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});
  const [cookLang, setCookLang] = useState(() => localStorage.getItem("akb-cook-lang") || "en");

  useEffect(() => {
    localStorage.setItem("akb-cook-lang", cookLang);
  }, [cookLang]);

  useEffect(() => {
    fetchRecipe(id).then((data) => setRecipe(data.recipe));
    document.body.classList.add("cooking-active");
    return () => document.body.classList.remove("cooking-active");
  }, [id]);

  const flow = recipe?.cookingFlow || [];
  const currentStep = flow[stepIndex];
  const progress = flow.length ? ((stepIndex + 1) / flow.length) * 100 : 0;
  const isDone = currentStep?.type === "done";
  const ui = getCookUI(cookLang);
  const stepText = currentStep ? resolveCookingStep(currentStep, cookLang, recipe) : null;

  useEffect(() => {
    if (!timerRunning || timerLeft <= 0) return;
    const interval = setInterval(() => {
      setTimerLeft((t) => {
        if (t <= 1) { setTimerRunning(false); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timerLeft]);

  const startTimer = useCallback(() => {
    if (currentStep?.duration > 0) {
      setTimerLeft(currentStep.duration * 60);
      setTimerRunning(true);
    }
  }, [currentStep]);

  const goNext = () => {
    setTimerRunning(false);
    setTimerLeft(0);
    if (stepIndex < flow.length - 1) {
      setStepIndex(stepIndex + 1);
    }
  };

  const goPrev = () => {
    setTimerRunning(false);
    setTimerLeft(0);
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  const LangPicker = () => (
    <div className="mb-6">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{ui.chooseLang}</p>
      <div className="flex flex-wrap gap-2">
        {COOK_LANGS.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => setCookLang(l.id)}
            className={`tap-smooth rounded-full px-3 py-2 text-xs font-medium transition ${
              cookLang === l.id
                ? "bg-[var(--accent)] text-[#14110e]"
                : "border border-white/10 bg-white/5 text-[var(--text-secondary)]"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>
    </div>
  );

  if (!recipe) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[var(--accent)]" />
      </div>
    );
  }

  if (!started) {
    return (
      <div className="cooking-shell min-h-screen pb-28">
        <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
          <img src={recipe.image} alt="" className="mx-auto mb-5 h-48 w-full max-w-sm rounded-2xl object-cover shadow-lg sm:h-56" />
          <h1 className="text-center font-display text-2xl text-[var(--text-primary)] sm:text-3xl">{getRecipeName(recipe, cookLang)}</h1>
          <p className="mt-2 text-center text-sm text-[var(--text-secondary)]">{flow.length} {ui.steps} · {recipe.cookTime} {ui.min}</p>

          <div className="glass-strong mt-6 rounded-2xl p-5 sm:p-6">
            <LangPicker />
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{ui.ingredients}</h2>
            <ul className="max-h-64 space-y-2 overflow-y-auto">
              {recipe.ingredients.map((ing) => (
                <li key={ing.name}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2.5 active:bg-white/5">
                    <input
                      type="checkbox"
                      checked={checkedItems[ing.name] || false}
                      onChange={() => setCheckedItems((prev) => ({ ...prev, [ing.name]: !prev[ing.name] }))}
                      className="h-5 w-5 shrink-0 rounded accent-[var(--accent)]"
                    />
                    <span className="text-sm text-[var(--text-primary)]">{getIngredientLabel(ing, cookLang)}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <button onClick={() => setStarted(true)} className="premium-btn tap-smooth mt-6 w-full py-4 text-base">
            {ui.startCooking}
          </button>
        </div>
      </div>
    );
  }

  if (!currentStep || !stepText) return null;

  return (
    <div className="cooking-shell flex min-h-screen flex-col">
      <div className="sticky top-0 z-50 border-b border-white/10 bg-[#14110e]/95 px-4 py-3 backdrop-blur-xl safe-top">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2">
          <button type="button" onClick={() => navigate(`/recipe/${id}`)} className="tap-smooth text-sm text-[var(--text-secondary)]">
            {ui.close}
          </button>
          <div className="flex flex-wrap justify-center gap-1">
            {COOK_LANGS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setCookLang(l.id)}
                className={`tap-smooth rounded-full px-2 py-1 text-[10px] font-medium ${
                  cookLang === l.id ? "bg-[var(--accent)] text-[#14110e]" : "text-[var(--text-secondary)]"
                }`}
              >
                {l.id === "hinglish" ? "Hi-En" : l.id.toUpperCase()}
              </button>
            ))}
          </div>
          <span className="text-xs font-medium text-[var(--text-primary)] sm:text-sm">
            {stepIndex + 1}/{flow.length}
          </span>
        </div>
        <div className="mx-auto mt-2 h-1.5 max-w-2xl overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-soft)] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 pb-32">
        <div className="glass-strong rounded-2xl p-6 text-center sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-soft)] text-xl font-semibold text-[#14110e]">
            {isDone ? "☺️" : stepIndex + 1}
          </div>
          <h2 className="mt-4 font-display text-xl leading-snug text-[var(--text-primary)] sm:text-2xl">{stepText.title}</h2>
          {stepText.description && (
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">{stepText.description}</p>
          )}

          {currentStep.duration > 0 && (
            <div className="mt-6">
              {timerRunning || timerLeft > 0 ? (
                <div className="font-display text-5xl text-[var(--accent-soft)]">{formatTime(timerLeft)}</div>
              ) : (
                <button type="button" onClick={startTimer} className="premium-btn tap-smooth px-8 py-3 text-sm">
                  {ui.timer} ({currentStep.duration} {ui.min})
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="cooking-actions safe-bottom fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#14110e]/95 px-4 py-3 backdrop-blur-xl md:static md:border-0 md:bg-transparent md:pb-8">
        <div className="mx-auto flex max-w-2xl gap-3">
          <button type="button" onClick={goPrev} disabled={stepIndex === 0} className="premium-btn-outline tap-smooth min-h-[48px] flex-1 py-3 text-sm disabled:opacity-30">
            {ui.back}
          </button>
          {isDone ? (
            <button
              type="button"
              onClick={() => navigate(`/recipe/${id}/review?from=cook`)}
              className="premium-btn tap-smooth min-h-[48px] flex-1 py-3 text-sm"
            >
              {ui.review}
            </button>
          ) : (
            <button type="button" onClick={goNext} className="premium-btn tap-smooth min-h-[48px] flex-1 py-3 text-sm">
              {ui.next}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
