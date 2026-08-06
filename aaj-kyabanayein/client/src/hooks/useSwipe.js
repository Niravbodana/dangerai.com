import { useEffect, useRef } from "react";

/** Horizontal swipe on touch devices — left = next, right = back */
export function useSwipe(ref, { onSwipeLeft, onSwipeRight, enabled = true, threshold = 48 }) {
  const start = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return undefined;

    const onTouchStart = (e) => {
      const t = e.changedTouches[0];
      start.current = { x: t.clientX, y: t.clientY, time: Date.now() };
    };

    const onTouchEnd = (e) => {
      if (!start.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.current.x;
      const dy = t.clientY - start.current.y;
      const elapsed = Date.now() - start.current.time;
      start.current = null;
      if (elapsed > 800) return;
      if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      if (dx < 0) onSwipeLeft?.();
      else onSwipeRight?.();
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [ref, enabled, onSwipeLeft, onSwipeRight, threshold]);
}
