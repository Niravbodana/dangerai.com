import { useEffect, useRef } from "react";

const NEXT_RE = /next|आगे|अगला|aage|agla|done|खत्म|aage badho/i;
const PREV_RE = /back|पीछे|peeche|previous|pichla|पिछला|pehle/i;
const REPEAT_RE = /repeat|दोहर|dohra|फिर|fir|again|sunao|सुनाओ|dobara/i;

export function useVoiceCommands({ enabled, lang = "en", onNext, onPrevious, onRepeat }) {
  const recognitionRef = useRef(null);
  const supported = typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    if (!enabled || !supported) {
      recognitionRef.current?.stop?.();
      return undefined;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = lang === "en" ? "en-IN" : "hi-IN";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (event) => {
      const last = event.results[event.results.length - 1]?.[0]?.transcript?.toLowerCase() || "";
      if (NEXT_RE.test(last)) onNext?.();
      else if (PREV_RE.test(last)) onPrevious?.();
      else if (REPEAT_RE.test(last)) onRepeat?.();
    };
    rec.onerror = () => {};
    rec.onend = () => {
      if (enabled) {
        try { rec.start(); } catch { /* ignore */ }
      }
    };

    try {
      rec.start();
      recognitionRef.current = rec;
    } catch {
      /* ignore */
    }

    return () => {
      try { rec.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    };
  }, [enabled, lang, onNext, onPrevious, onRepeat, supported]);

  return { supported };
}
