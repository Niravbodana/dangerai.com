import { useCallback, useEffect, useRef, useState } from "react";

const LANG_MAP = {
  en: "en-IN",
  hi: "hi-IN",
  hinglish: "hi-IN",
  gu: "gu-IN",
  mr: "mr-IN",
};

const SPEECH_RATES = {
  en: 0.88,
  hi: 0.72,
  hinglish: 0.75,
  gu: 0.72,
  mr: 0.72,
};

const SPEECH_PITCH = {
  en: 1.05,
  hi: 1.02,
  hinglish: 1.02,
  gu: 1.02,
  mr: 1.02,
};

const WARM_VOICE_PATTERNS = [
  /samantha|karen|veena|lekha|heera|kalpana|priya|neha|female|woman|natural|neural|premium|enhanced|google.*hindi|hindi.*female|com\.apple.*compact/i,
];

function scoreVoice(voice, langCode) {
  const target = LANG_MAP[langCode] || "en-IN";
  const prefix = target.split("-")[0];
  let score = 0;
  if (voice.lang.startsWith(target)) score += 10;
  else if (voice.lang.startsWith(prefix)) score += 5;
  if (WARM_VOICE_PATTERNS.some((re) => re.test(voice.name))) score += 8;
  if (/google|apple|microsoft/i.test(voice.name)) score += 2;
  if (voice.localService) score += 1;
  return score;
}

function pickVoice(langCode) {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const ranked = [...voices].sort((a, b) => scoreVoice(b, langCode) - scoreVoice(a, langCode));
  return ranked[0] || null;
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
      utter.pitch = SPEECH_PITCH[lang] ?? 1.02;
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
