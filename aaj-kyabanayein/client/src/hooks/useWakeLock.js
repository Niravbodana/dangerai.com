import { useEffect, useRef } from "react";

/** Keep screen awake during cooking when supported */
export function useWakeLock(active) {
  const lockRef = useRef(null);

  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return undefined;

    let cancelled = false;
    navigator.wakeLock.request("screen").then((lock) => {
      if (cancelled) {
        lock.release().catch(() => {});
        return;
      }
      lockRef.current = lock;
    }).catch(() => {});

    return () => {
      cancelled = true;
      lockRef.current?.release?.().catch(() => {});
      lockRef.current = null;
    };
  }, [active]);
}
