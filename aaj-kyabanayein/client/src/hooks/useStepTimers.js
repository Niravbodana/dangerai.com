import { useCallback, useEffect, useState } from "react";

/** Multiple concurrent step timers keyed by step id */
export function useStepTimers(initial = {}) {
  const [timers, setTimers] = useState(initial);

  useEffect(() => {
    const running = Object.values(timers).some((t) => t.running && t.left > 0);
    if (!running) return undefined;

    const interval = setInterval(() => {
      setTimers((prev) => {
        const next = { ...prev };
        let changed = false;
        for (const [key, timer] of Object.entries(next)) {
          if (!timer.running || timer.left <= 0) continue;
          changed = true;
          const left = timer.left - 1;
          next[key] = { ...timer, left, running: left > 0 };
          if (left === 0 && navigator.vibrate) navigator.vibrate([200, 100, 200]);
        }
        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timers]);

  const ensureTimer = useCallback((key, totalSeconds) => {
    setTimers((prev) => {
      if (prev[key]) return prev;
      return { ...prev, [key]: { left: totalSeconds, total: totalSeconds, running: false, label: key } };
    });
  }, []);

  const toggleTimer = useCallback((key) => {
    setTimers((prev) => {
      const timer = prev[key];
      if (!timer) return prev;
      return { ...prev, [key]: { ...timer, running: !timer.running } };
    });
  }, []);

  const resetTimer = useCallback((key) => {
    setTimers((prev) => {
      const timer = prev[key];
      if (!timer) return prev;
      return { ...prev, [key]: { ...timer, left: timer.total, running: false } };
    });
  }, []);

  return { timers, setTimers, ensureTimer, toggleTimer, resetTimer };
}
