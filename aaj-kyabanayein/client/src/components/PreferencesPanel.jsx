const DIET_OPTIONS = [
  { value: "veg", label: "Shakahari" },
  { value: "non-veg", label: "Non-Veg" },
  { value: "vegan", label: "Vegan" },
  { value: "jain", label: "Jain" },
  { value: "diabetic", label: "Diabetic" },
];

const BUDGET_OPTIONS = [
  { value: "low", label: "Sasta" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "Premium" },
];

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "bg-[var(--text-primary)] text-[var(--cream-light)]"
          : "glass text-[var(--text-secondary)] hover:bg-white/50"
      }`}
    >
      {children}
    </button>
  );
}

export default function PreferencesPanel({ prefs, onChange }) {
  const update = (key, value) => onChange({ ...prefs, [key]: value });

  return (
    <div className="recipe-card p-5">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Aapki Pasand</h3>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Diet</label>
          <div className="flex flex-wrap gap-2">
            {DIET_OPTIONS.map((opt) => (
              <Chip key={opt.value} active={prefs.diet === opt.value} onClick={() => update("diet", opt.value)}>
                {opt.label}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
            Parivaar ({prefs.familySize} log)
          </label>
          <input
            type="range"
            min={1}
            max={8}
            value={prefs.familySize}
            onChange={(e) => update("familySize", Number(e.target.value))}
            className="w-full accent-[var(--accent)]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Budget</label>
          <div className="flex flex-wrap gap-2">
            {BUDGET_OPTIONS.map((opt) => (
              <Chip key={opt.value} active={prefs.budget === opt.value} onClick={() => update("budget", opt.value)}>
                {opt.label}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
            Max cooking: {prefs.maxCookTime} min
          </label>
          <input
            type="range"
            min={15}
            max={90}
            step={5}
            value={prefs.maxCookTime}
            onChange={(e) => update("maxCookTime", Number(e.target.value))}
            className="w-full accent-[var(--accent)]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">Leftover planning</label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "alternating", label: "Smart leftovers" },
              { value: "minimal", label: "Fresh daily" },
              { value: "max", label: "Max reuse" },
            ].map((opt) => (
              <Chip
                key={opt.value}
                active={(prefs.leftoverFrequency || "alternating") === opt.value}
                onClick={() => update("leftoverFrequency", opt.value)}
              >
                {opt.label}
              </Chip>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
          <input
            type="checkbox"
            checked={prefs.includeVariations !== false}
            onChange={(e) => update("includeVariations", e.target.checked)}
            className="accent-[var(--accent)]"
          />
          Meal variations (swap options)
        </label>
      </div>
    </div>
  );
}
