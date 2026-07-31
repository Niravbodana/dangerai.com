export default function SegmentedControl({ options, value, onChange, className = "" }) {
  return (
    <div className={`segmented-control tap-smooth ${className}`} role="tablist">
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={`segmented-control__item ${active ? "segmented-control__item--active" : ""}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
