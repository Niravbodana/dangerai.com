import { VegSymbol, NonVegSymbol } from "./DietSymbols";

const OPTIONS = [
  { id: "veg", label: "Veg", labelHi: "शाकाहारी", color: "green" },
  { id: "all", label: "All", labelHi: "सभी", color: "neutral" },
  { id: "non-veg", label: "Non-Veg", labelHi: "मांसाहारी", color: "red" },
];

export default function DietToggle({ value, onChange, lang = "en" }) {
  return (
    <div className="diet-toggle" role="group" aria-label="Diet filter">
      {OPTIONS.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`diet-toggle__seg diet-toggle__seg--${opt.color} ${active ? "diet-toggle__seg--active" : ""}`}
            aria-pressed={active}
          >
            {opt.id === "veg" && <VegSymbol className="h-3.5 w-3.5" />}
            {opt.id === "non-veg" && <NonVegSymbol className="h-3.5 w-3.5" />}
            <span className="diet-toggle__light" aria-hidden />
            <span>{lang === "hi" ? opt.labelHi : opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
