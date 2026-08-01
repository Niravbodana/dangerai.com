import { useCallback, useEffect, useRef, useState } from "react";

const LANG_MAP = {
  en: "en-IN",
  hi: "hi-IN",
  hinglish: "hi-IN",
  gu: "gu-IN",
  mr: "mr-IN",
};

export function useSpeech(lang = "en") {
  const [speaking, setSpeaking] = useState(false);
  const utterRef = useRef(null);

  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const speak = useCallback(
    (text) => {
      if (!supported || !text?.trim()) return;
      stop();
      const utter = new SpeechSynthesisUtterance(text.trim());
      utter.lang = LANG_MAP[lang] || "en-IN";
      utter.rate = 0.92;
      utter.pitch = 1;
      utter.onend = () => setSpeaking(false);
      utter.onerror = () => setSpeaking(false);
      utterRef.current = utter;
      setSpeaking(true);
      window.speechSynthesis.speak(utter);
    },
    [lang, supported, stop]
  );

  useEffect(() => () => stop(), [stop]);

  return { speak, stop, speaking, supported };
}
