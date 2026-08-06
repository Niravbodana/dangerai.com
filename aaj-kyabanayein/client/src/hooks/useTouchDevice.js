import { useEffect, useState } from "react";

/** True on phones/tablets (coarse pointer or narrow viewport). */
export function useTouchDevice() {
  const [touch, setTouch] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
  });

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const onChange = () => {
      setTouch(mq.matches || window.innerWidth < 768);
    };
    mq.addEventListener("change", onChange);
    window.addEventListener("resize", onChange);
    return () => {
      mq.removeEventListener("change", onChange);
      window.removeEventListener("resize", onChange);
    };
  }, []);

  return touch;
}
