import { useCallback, useEffect, useRef, useState } from "react";

const LANG_MAP = {
  en: "en-IN",
  hi: "hi-IN",
  hinglish: "hi-IN",
  gu: "gu-IN",
  mr: "mr-IN",
};

const SPEECH_RATES = {
  en: 0.9,
  hi: 0.72,
  hinglish: 0.76,
  gu: 0.72,
  mr: 0.72,
};

function pickVoice(langCode) {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const target = LANG_MAP[langCode] || "en-IN";
  const prefix = target.split("-")[0];

  const preferred = voices.find(
    (v) =>
      v.lang.startsWith(target) &&
      /female|lekha|priya|heera|neural|natural|google/i.test(v.name)
  );
  if (preferred) return preferred;

  const exact = voices.find((v) => v.lang.startsWith(target));
  if (exact) return exact;

  const langMatch = voices.find((v) => v.lang.startsWith(prefix));
  return langMatch || null;
}

export function useSpeech(lang = "en") {
  const [speaking, setSpeaking] = useState(false);
  const [voicesReady, setVoicesReady] = useState(false);
  const utterRef = useRef(null);

  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    if (!supported) return undefined;
    const onVoices = () => setVoicesReady(true);
    window.speechSynthesis.addEventListener("voiceschanged", onVoices);
    onVoices();
    return () => window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
  }, [supported]);

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
      const voice = pickVoice(lang);
      utter.lang = voice?.lang || LANG_MAP[lang] || "en-IN";
      if (voice) utter.voice = voice;
      utter.rate = SPEECH_RATES[lang] ?? 0.85;
      utter.pitch = lang === "en" ? 1 : 0.95;
      utter.onend = () => setSpeaking(false);
      utter.onerror = () => setSpeaking(false);
      utterRef.current = utter;
      setSpeaking(true);
      window.speechSynthesis.speak(utter);
    },
    [lang, supported, stop, voicesReady]
  );

  useEffect(() => () => stop(), [stop]);

  return { speak, stop, speaking, supported };
}

export function getSpeechLangCode(cookLang) {
  if (cookLang === "en") return "en";
  if (cookLang === "hinglish") return "hinglish";
  return cookLang;
}
