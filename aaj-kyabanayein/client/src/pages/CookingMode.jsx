import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchRecipe } from "../api";
import { useLanguage } from "../context/LanguageContext";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function CookingMode() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [recipe, setRecipe] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [timerLeft, setTimerLeft] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});

  useEffect(() => {
    fetchRecipe(id).then((data) => setRecipe(data.recipe));
  }, [id]);

  const flow = recipe?.cookingFlow || [];
  const currentStep = flow[stepIndex];
  const progress = flow.length ? ((stepIndex + 1) / flow.length) * 100 : 0;
  const isDone = currentStep?.type === "done";

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
      const nextIndex = stepIndex + 1;
      setStepIndex(nextIndex);
      if (flow[nextIndex]?.type === "done") {
        navigate(`/recipe/${id}/review?from=cook`);
      }
    }
  };

  const goPrev = () => {
    setTimerRunning(false);
    setTimerLeft(0);
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  if (!recipe) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[var(--accent)]" />
      </div>
    );
  }

  if (!started) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-2xl px-4 py-8 text-center">
          <img src={recipe.image} alt="" className="mx-auto mb-6 h-56 w-full max-w-sm rounded-2xl object-cover shadow-lg" />
          <h1 className="font-display text-3xl text-[var(--text-primary)]">{recipe.name}</h1>
          <p className="mt-2 text-[var(--text-secondary)]">{flow.length} steps · {recipe.cookTime} {t("min")}</p>

          <div className="glass-strong mt-8 rounded-2xl p-6 text-left">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{t("ingredients")}</h2>
            <ul className="space-y-2">
              {recipe.ingredients.map((ing) => (
                <li key={ing.name}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/5">
                    <input
                      type="checkbox"
                      checked={checkedItems[ing.name] || false}
                      onChange={() => setCheckedItems((prev) => ({ ...prev, [ing.name]: !prev[ing.name] }))}
                      className="h-4 w-4 rounded accent-[var(--accent)]"
                    />
                    <span className="text-sm text-[var(--text-primary)]">{ing.name} — {ing.quantity}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <button onClick={() => setStarted(true)} className="premium-btn mt-8 w-full py-4 text-base">
            {t("startCooking")}
          </button>
        </div>
      </div>
    );
  }

  if (!currentStep) return null;

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-50 border-b border-white/10 bg-[#14110e]/90 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <button onClick={() => navigate(`/recipe/${id}`)} className="text-sm text-[var(--text-secondary)]">
            Close
          </button>
          <span className="text-sm font-medium text-[var(--text-primary)]">
            Step {stepIndex + 1} / {flow.length}
          </span>
        </div>
        <div className="mx-auto mt-2 h-1.5 max-w-2xl overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-soft)] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="glass-strong rounded-2xl p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-soft)] text-lg font-semibold text-[#14110e]">
            {isDone ? "☺️" : stepIndex + 1}
          </div>
          <h2 className="mt-4 font-display text-2xl text-[var(--text-primary)]">{currentStep.title}</h2>
          {currentStep.description && (
            <p className="mt-3 text-[var(--text-secondary)]">{currentStep.description}</p>
          )}

          {currentStep.duration > 0 && (
            <div className="mt-6">
              {timerRunning || timerLeft > 0 ? (
                <div className="font-display text-4xl text-[var(--accent-soft)]">{formatTime(timerLeft)}</div>
              ) : (
                <button onClick={startTimer} className="premium-btn px-6 py-2 text-sm">
                  Timer ({currentStep.duration} {t("min")})
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 flex gap-3">
          <button onClick={goPrev} disabled={stepIndex === 0} className="premium-btn-outline flex-1 py-3 text-sm disabled:opacity-30">
            Back
          </button>
          {isDone ? (
            <button
              onClick={() => navigate(`/recipe/${id}/review?from=cook`)}
              className="premium-btn flex-1 py-3 text-sm"
            >
              Leave a Review ☺️
            </button>
          ) : (
            <button onClick={goNext} className="premium-btn flex-1 py-3 text-sm">
              Next Step
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
