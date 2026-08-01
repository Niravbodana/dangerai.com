import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchRecipeLoad } from "../api";
import { useLanguage } from "../context/LanguageContext";
import { useSpeech } from "../hooks/useSpeech";
import { useVoiceCommands } from "../hooks/useVoiceCommands";
import { useWakeLock } from "../hooks/useWakeLock";
import { useStepTimers } from "../hooks/useStepTimers";
import RecipeImage from "../components/RecipeImage";
import EmptyState from "../components/EmptyState";
import LoadingSpinner from "../components/LoadingSpinner";
import { COOK_LANGS, getCookUI, getIngredientLabel, getRecipeName } from "../i18n/cookingLang";
import { track } from "../lib/analytics";
import { clearCookSession, loadCookSession, saveCookSession } from "../lib/cookSession";
import { getOfflinePack } from "../lib/offlinePacks";
import { recordCookFinish, recordVoiceUse } from "../lib/streak";
import { shouldShowAccountWall } from "../lib/accountWall";
import { getStreak } from "../lib/streak";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";

function VoiceButton({ text, lang, label, onSpeak }) {
  const { speak, stop, speaking, supported } = useSpeech(lang);
  if (!supported) return null;
  return (
    <button
      type="button"
      onClick={() => {
        if (speaking) stop();
        else {
          speak(text);
          onSpeak?.();
        }
      }}
      className={`tap-smooth flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition ${
        speaking
          ? "bg-[var(--accent)] text-[#14110e]"
          : "border border-white/15 bg-white/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      }`}
      aria-label={label}
    >
      {speaking ? "⏹ Stop" : "🔊 Listen"}
    </button>
  );
}

function StepTimer({ timerKey, minutes, timers, ensureTimer, toggleTimer, resetTimer }) {
  const total = Math.max(1, Math.round(minutes || 0)) * 60;

  useEffect(() => {
    if (minutes) ensureTimer(String(timerKey), total);
  }, [timerKey, minutes, total, ensureTimer]);

  const timer = timers[String(timerKey)];
  if (!minutes || !timer) return null;

  const mm = String(Math.floor(timer.left / 60)).padStart(2, "0");
  const ss = String(timer.left % 60).padStart(2, "0");

  return (
    <div className="mt-4 flex items-center justify-center gap-3">
      <span className="font-display text-2xl tabular-nums text-[var(--accent-soft)]">{mm}:{ss}</span>
      <button
        type="button"
        onClick={() => toggleTimer(String(timerKey))}
        className="rounded-full border border-white/15 px-3 py-1 text-xs text-[var(--text-secondary)]"
      >
        {timer.running ? "Pause" : timer.left === 0 ? "Reset" : "Timer"}
      </button>
      {timer.left === 0 && (
        <button type="button" onClick={() => resetTimer(String(timerKey))} className="text-xs text-[var(--accent-soft)]">
          Restart
        </button>
      )}
    </div>
  );
}

function ActiveTimers({ timers, toggleTimer }) {
  const active = Object.entries(timers).filter(([, t]) => t.running || (t.left < t.total && t.left > 0));
  if (!active.length) return null;
  return (
    <div className="mx-auto mt-2 flex max-w-2xl flex-wrap justify-center gap-2 px-4">
      {active.map(([key, t]) => (
        <button
          key={key}
          type="button"
          onClick={() => toggleTimer(key)}
          className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-[var(--text-secondary)]"
        >
          Step {key}: {String(Math.floor(t.left / 60)).padStart(2, "0")}:{String(t.left % 60).padStart(2, "0")}
        </button>
      ))}
    </div>
  );
}

function estimateStepMinutes(text = "") {
  const m = String(text).match(/(\d+)\s*(min|minute|minutes|मिनट)/i);
  return m ? Number(m[1]) : 0;
}

export default function CookingMode() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { user } = useAuth();
  const { openSignup } = useAuthModal();
  const [recipe, setRecipe] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});
  const [handsFree, setHandsFree] = useState(false);
  const [cookLang, setCookLang] = useState(() => localStorage.getItem("akb-cook-lang") || lang || "en");
  const { speak, stop, speaking, supported } = useSpeech(cookLang === "hinglish" ? "hi" : cookLang);
  const { timers, setTimers, ensureTimer, toggleTimer, resetTimer } = useStepTimers();
  const savedSession = useMemo(() => loadCookSession(id), [id]);
  const stepTextRef = useRef("");

  useWakeLock(started);

  useEffect(() => {
    localStorage.setItem("akb-cook-lang", cookLang);
  }, [cookLang]);

  useEffect(() => {
    let cancelled = false;
    setRecipe(null);
    setLoadError(false);
    setOfflineMode(false);

    fetchRecipeLoad(id)
      .then((data) => {
        if (!cancelled) setRecipe(data.recipe);
      })
      .catch(() => {
        const offline = getOfflinePack(id);
        if (offline && !cancelled) {
          setRecipe(offline);
          setOfflineMode(true);
        } else if (!cancelled) {
          setLoadError(true);
        }
      });

    document.body.classList.add("cooking-active");
    return () => {
      cancelled = true;
      document.body.classList.remove("cooking-active");
      stop();
    };
  }, [id, stop]);

  useEffect(() => {
    if (!started || !recipe) return;
    saveCookSession(id, { stepIndex, started, checkedItems, handsFree, timers });
  }, [id, started, recipe, stepIndex, checkedItems, handsFree, timers]);

  const instructionSteps = recipe?.stepsHi?.length && (cookLang === "hi" || cookLang === "gu" || cookLang === "mr")
    ? recipe.stepsHi
    : recipe?.steps || [];
  const steps = recipe?.cookingFlow?.length ? recipe.cookingFlow : instructionSteps.map((text, i) => ({
    id: i + 1,
    type: i === instructionSteps.length - 1 ? "done" : "cook",
    title: text,
    titleHi: recipe?.stepsHi?.[i] || text,
  }));
  const current = steps[Math.min(stepIndex, steps.length - 1)];
  const isDone = current?.type === "done" || stepIndex >= steps.length - 1;
  const ui = getCookUI(cookLang);

  const stepText = current
    ? cookLang === "hi" || cookLang === "gu" || cookLang === "mr"
      ? current.titleHi || current.title
      : cookLang === "hinglish"
        ? `${current.title}${current.titleHi ? ` — ${current.titleHi}` : ""}`
        : current.title || current.titleHi
    : "";

  const voiceLang = cookLang === "en" ? "en" : "hi";
  const stepMinutes = estimateStepMinutes(stepText);
  const stepCountRef = useRef(0);
  stepCountRef.current = steps.length;

  useEffect(() => {
    stepTextRef.current = stepText;
  }, [stepText]);

  const goNext = useCallback(() => {
    stop();
    setStepIndex((i) => Math.min(stepCountRef.current - 1, i + 1));
  }, [stop]);

  const goPrevious = useCallback(() => {
    stop();
    setStepIndex((i) => Math.max(0, i - 1));
  }, [stop]);

  const repeatStep = useCallback(() => {
    if (stepTextRef.current) {
      speak(stepTextRef.current);
      recordVoiceUse();
    }
  }, [speak]);

  useVoiceCommands({
    enabled: handsFree && started,
    lang: voiceLang,
    onNext: goNext,
    onPrevious: goPrevious,
    onRepeat: repeatStep,
  });

  const startCooking = useCallback((resume = false) => {
    if (resume && savedSession) {
      setStepIndex(savedSession.stepIndex ?? 0);
      setCheckedItems(savedSession.checkedItems ?? {});
      setHandsFree(savedSession.handsFree ?? false);
      if (savedSession.timers) setTimers(savedSession.timers);
    } else {
      track("cook_start", { id });
    }
    setStarted(true);
  }, [id, savedSession, setTimers]);

  const finishCook = () => {
    clearCookSession(id);
    recordCookFinish(id);
    track("cook_finish", { id });
    const streak = getStreak();
    if (shouldShowAccountWall(!!user, streak.totalCooks)) {
      openSignup("cook");
    }
    navigate(`/recipe/${id}/review?from=cook`);
  };

  useEffect(() => {
    if (!started) return undefined;
    const onKeyDown = (e) => {
      if (e.target.matches("input, textarea, select, button")) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (isDone) finishCook();
        else goNext();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        goPrevious();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        if (isDone) finishCook();
        else goNext();
      } else if (e.key === "r" || e.key === "R") {
        repeatStep();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [started, isDone, goNext, goPrevious, repeatStep, id, navigate, openSignup, user]);

  if (loadError) {
    return (
      <EmptyState
        icon="🍳"
        title="Recipe unavailable"
        message="Could not load this recipe. Check your connection or save it offline with Rasoira Plus."
        action={
          <button type="button" onClick={() => navigate(`/recipe/${id}`)} className="premium-btn px-6 py-2.5 text-sm">
            Back to recipe
          </button>
        }
      />
    );
  }

  if (!recipe) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!started) {
    return (
      <div className="cooking-shell min-h-screen pb-28">
        <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
          <RecipeImage
            src={recipe.image || `/api/recipes/image/${recipe.id}`}
            recipeId={recipe.id}
            alt={recipe.name}
            eager
            className="mx-auto mb-5 h-48 w-full max-w-sm rounded-2xl object-cover shadow-lg sm:h-56"
          />
          <h1 className="text-center font-display text-2xl text-[var(--text-primary)] sm:text-3xl">
            {getRecipeName(recipe, cookLang)}
          </h1>
          {offlineMode && (
            <p className="mt-2 text-center text-xs text-amber-400">Offline pack — saved recipe</p>
          )}
          <p className="mt-2 text-center text-sm text-[var(--text-secondary)]">{steps.length} {ui.steps}</p>
          {offlineMode && (
            <p className="mt-1 text-center text-xs text-[var(--accent-soft)]">Offline pack — cooking without network</p>
          )}

          <div className="glass-strong mt-6 rounded-2xl p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap gap-2">
              {COOK_LANGS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setCookLang(l.id)}
                  className={`tap-smooth rounded-full px-3 py-1.5 text-xs font-medium ${
                    cookLang === l.id ? "bg-[var(--accent)] text-[#14110e]" : "border border-white/10 bg-white/5 text-[var(--text-secondary)]"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <label className="mb-4 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <input type="checkbox" checked={handsFree} onChange={(e) => setHandsFree(e.target.checked)} className="accent-[var(--accent)]" />
              Hands-free: say &ldquo;next&rdquo; / &ldquo;अगला&rdquo; / &ldquo;repeat&rdquo; / &ldquo;दोहराओ&rdquo;
            </label>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              {ui.ingredients}
            </h2>
            <ol className="max-h-72 space-y-2 overflow-y-auto">
              {recipe.ingredients?.map((ing, i) => (
                <li key={`${ing.name}-${i}`}>
                  <label className="ingredient-note flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={checkedItems[ing.name] || false}
                      onChange={() => setCheckedItems((p) => ({ ...p, [ing.name]: !p[ing.name] }))}
                      className="mt-1 h-5 w-5 shrink-0 rounded accent-[var(--accent)]"
                    />
                    <span className="ingredient-note__num shrink-0">{i + 1}</span>
                    <span className="min-w-0 flex-1 text-sm">
                      <span className="font-medium text-[var(--text-primary)]">
                        {getIngredientLabel(ing, cookLang).split(" — ")[0]}
                      </span>
                      <span className="ingredient-note__qty">{ing.quantity}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ol>
          </div>
          {savedSession?.started && (
            <button
              type="button"
              onClick={() => startCooking(true)}
              className="premium-btn-outline tap-smooth mt-4 w-full py-4 text-base"
            >
              Resume from step {(savedSession.stepIndex ?? 0) + 1}
            </button>
          )}
          <button onClick={() => startCooking(false)} className="premium-btn tap-smooth mt-4 w-full py-4 text-base">
            {ui.startCooking}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cooking-shell flex min-h-screen flex-col">
      <div className="sticky top-0 z-50 border-b border-white/10 bg-[#14110e]/95 px-4 py-3 backdrop-blur-xl safe-top">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <button type="button" onClick={() => navigate(`/recipe/${id}`)} className="text-sm text-[var(--text-secondary)]">
            {ui.close}
          </button>
          <span className="text-sm font-medium">{Math.min(stepIndex + 1, steps.length)} / {steps.length}</span>
          {handsFree && <span className="text-[10px] text-[var(--accent-soft)]">🎤 Listening</span>}
        </div>
        <p className="mx-auto mt-1 max-w-2xl text-center text-[10px] text-[var(--text-secondary)]">
          Space = next · ← → navigate · R = repeat
        </p>
        <div className="mx-auto mt-2 h-1 max-w-2xl overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-[var(--accent)] transition-all" style={{ width: `${((Math.min(stepIndex + 1, steps.length)) / steps.length) * 100}%` }} />
        </div>
        <ActiveTimers timers={timers} toggleTimer={toggleTimer} />
      </div>

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 pb-32">
        <div className="glass-strong rounded-2xl p-6 text-center sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-xl font-bold text-[#14110e]">
            {isDone ? "☺️" : stepIndex + 1}
          </div>
          <p className="mt-6 text-lg leading-relaxed text-[var(--text-primary)] sm:text-xl">{stepText}</p>
          <StepTimer
            timerKey={stepIndex}
            minutes={stepMinutes}
            timers={timers}
            ensureTimer={ensureTimer}
            toggleTimer={toggleTimer}
            resetTimer={resetTimer}
          />
          {supported && stepText && (
            <div className="mt-5 flex justify-center gap-2">
              <VoiceButton
                text={stepText}
                lang={voiceLang}
                label="Listen to step"
                onSpeak={() => recordVoiceUse()}
              />
            </div>
          )}
        </div>
      </div>

      <div className="safe-bottom fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[#14110e]/95 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl gap-3">
          <button
            type="button"
            onClick={goPrevious}
            disabled={stepIndex === 0}
            className="premium-btn-outline flex-1 py-3 text-sm disabled:opacity-30"
          >
            {ui.back}
          </button>
          {supported && stepText && !speaking && (
            <button
              type="button"
              onClick={() => { speak(stepText); recordVoiceUse(); }}
              className="premium-btn-outline flex h-12 w-12 shrink-0 items-center justify-center text-lg"
              aria-label="Read step aloud"
            >
              🔊
            </button>
          )}
          {isDone ? (
            <button type="button" onClick={finishCook} className="premium-btn flex-1 py-3 text-sm">
              {ui.review}
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              className="premium-btn flex-1 py-3 text-sm"
            >
              {ui.next}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
