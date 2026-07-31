const DIET_OPTIONS = [
  { value: "veg", label: "🥬 Shakahari" },
  { value: "non-veg", label: "🍗 Non-Veg" },
  { value: "vegan", label: "🌱 Vegan" },
  { value: "jain", label: "🙏 Jain" },
  { value: "diabetic", label: "💚 Diabetic" },
];

const BUDGET_OPTIONS = [
  { value: "low", label: "₹ Sasta" },
  { value: "medium", label: "₹₹ Medium" },
  { value: "high", label: "₹₹₹ Premium" },
];

export default function PreferencesPanel({ prefs, onChange }) {
  const update = (key, value) => onChange({ ...prefs, [key]: value });

  return (
    <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-bold text-gray-900">⚙️ Aapki Pasand</h3>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Diet</label>
          <div className="flex flex-wrap gap-2">
            {DIET_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => update("diet", opt.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  prefs.diet === opt.value
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-orange-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Parivaar ({prefs.familySize} log)
          </label>
          <input
            type="range"
            min={1}
            max={8}
            value={prefs.familySize}
            onChange={(e) => update("familySize", Number(e.target.value))}
            className="w-full accent-orange-500"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Budget</label>
          <div className="flex flex-wrap gap-2">
            {BUDGET_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => update("budget", opt.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  prefs.budget === opt.value
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-orange-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Max cooking: {prefs.maxCookTime} min
          </label>
          <input
            type="range"
            min={15}
            max={90}
            step={5}
            value={prefs.maxCookTime}
            onChange={(e) => update("maxCookTime", Number(e.target.value))}
            className="w-full accent-orange-500"
          />
        </div>
      </div>
    </div>
  );
}
