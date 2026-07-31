import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchRecipe } from "../api";
import Navbar from "../components/Navbar";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const TYPE_COLORS = {
  intro: "bg-blue-50 border-blue-200",
  prep: "bg-yellow-50 border-yellow-200",
  cut: "bg-orange-50 border-orange-200",
  cook: "bg-red-50 border-red-200",
  fry: "bg-red-50 border-red-200",
  steam: "bg-cyan-50 border-cyan-200",
  boil: "bg-purple-50 border-purple-200",
  mix: "bg-green-50 border-green-200",
  serve: "bg-emerald-50 border-emerald-200",
  done: "bg-green-100 border-green-300",
};

export default function CookingMode() {
  const { id } = useParams();
  const navigate = useNavigate();
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

  useEffect(() => {
    if (!timerRunning || timerLeft <= 0) return;
    const interval = setInterval(() => {
      setTimerLeft((t) => {
        if (t <= 1) {
          setTimerRunning(false);
          return 0;
        }
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

  if (!recipe) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fffbf7]">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="min-h-screen bg-[#fffbf7]">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 py-8 text-center">
          <img src={recipe.image} alt="" className="mx-auto mb-6 h-48 w-48 rounded-2xl object-cover" />
          <h1 className="text-3xl font-bold text-gray-900">{recipe.nameHi}</h1>
          <p className="mt-2 text-gray-500">{flow.length} steps · {recipe.cookTime} min</p>

          <div className="mt-8 rounded-2xl border border-orange-100 bg-white p-6 text-left shadow-sm">
            <h2 className="mb-4 font-bold text-gray-900">Pehle yeh samaan taiyar rakhein:</h2>
            <ul className="space-y-2">
              {recipe.ingredients.map((ing) => (
                <li key={ing.name}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-orange-50">
                    <input
                      type="checkbox"
                      checked={checkedItems[ing.name] || false}
                      onChange={() =>
                        setCheckedItems((prev) => ({ ...prev, [ing.name]: !prev[ing.name] }))
                      }
                      className="h-4 w-4 rounded text-orange-500"
                    />
                    <span className="text-sm text-gray-700">
                      {ing.nameHi} — {ing.quantity}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => setStarted(true)}
            className="mt-8 w-full rounded-2xl bg-orange-500 py-4 text-xl font-bold text-white shadow-lg transition hover:bg-orange-600"
          >
            Start Cooking
          </button>
        </div>
      </div>
    );
  }

  if (!currentStep) return null;

  const isDone = currentStep.type === "done";

  return (
    <div className="min-h-screen bg-[#fffbf7]">
      <div className="sticky top-0 z-50 border-b border-orange-100 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <button onClick={() => navigate(`/recipe/${id}`)} className="text-sm text-gray-500">
            ✕ Band karo
          </button>
          <span className="text-sm font-medium text-gray-700">
            Step {stepIndex + 1} / {flow.length}
          </span>
        </div>
        <div className="mx-auto mt-2 h-2 max-w-2xl overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-orange-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8">
        <div
          className={`rounded-2xl border-2 p-8 text-center ${TYPE_COLORS[currentStep.type] || "bg-white border-orange-100"}`}
        >
          <span className="text-5xl">{currentStep.icon}</span>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">{currentStep.titleHi}</h2>
          {currentStep.descriptionHi && (
            <p className="mt-3 text-gray-600">{currentStep.descriptionHi}</p>
          )}

          {currentStep.ingredients && (
            <ul className="mt-4 space-y-1 text-left">
              {currentStep.ingredients.map((ing) => (
                <li key={ing.name} className="text-sm text-gray-700">
                  • {ing.nameHi} — {ing.quantity}
                </li>
              ))}
            </ul>
          )}

          {currentStep.ingredient && (
            <div className="mt-4 rounded-xl bg-white/80 px-4 py-3">
              <p className="font-medium text-orange-700">
                {currentStep.ingredient.nameHi} — {currentStep.ingredient.quantity}
              </p>
            </div>
          )}

          {currentStep.duration > 0 && (
            <div className="mt-6">
              {timerRunning || timerLeft > 0 ? (
                <div className="text-4xl font-bold text-orange-600">{formatTime(timerLeft)}</div>
              ) : (
                <button
                  onClick={startTimer}
                  className="rounded-xl bg-orange-500 px-6 py-2 font-semibold text-white"
                >
                  Timer Start ({currentStep.duration} min)
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={goPrev}
            disabled={stepIndex === 0}
            className="flex-1 rounded-xl border border-gray-200 py-3 font-medium text-gray-600 disabled:opacity-30"
          >
            Pehle
          </button>

          {isDone ? (
            <button
              onClick={() => navigate("/recipes")}
              className="flex-1 rounded-xl bg-green-500 py-3 font-bold text-white"
            >
              Done — Recipes dekho
            </button>
          ) : (
            <button
              onClick={goNext}
              className="flex-1 rounded-xl bg-orange-500 py-3 font-bold text-white"
            >
              Agla Step
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
