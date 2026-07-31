import { useEffect, useRef, useState } from "react";

export default function SegmentedControl({
  options,
  value,
  onChange,
  className = "",
  variant = "default",
}) {
  const containerRef = useRef(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const activeIndex = options.findIndex((o) => o.id === value);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const buttons = container.querySelectorAll("[data-segment]");
    const active = buttons[activeIndex];
    if (!active) return;
    setIndicator({
      left: active.offsetLeft,
      width: active.offsetWidth,
    });
  }, [value, activeIndex, options]);

  return (
    <div
      ref={containerRef}
      className={`segmented-control segmented-control--${variant} tap-smooth ${className}`}
      role="tablist"
    >
      <span
        className="segmented-control__indicator"
        style={{ transform: `translateX(${indicator.left}px)`, width: indicator.width }}
        aria-hidden
      />
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            data-segment
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={`segmented-control__item ${active ? "segmented-control__item--active" : ""} ${
              opt.tone ? `segmented-control__item--${opt.tone}` : ""
            }`}
          >
            {opt.icon && <span className="segmented-control__icon">{opt.icon}</span>}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
