import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Only Hindi + English voice narration — kept intentionally simple so every
 * Indian user gets a language they understand, with no risk of silently
 * falling back to a mismatched regional voice (e.g. missing Gujarati/
 * Marathi OS voices used to make the reader switch to an English voice).
 */
const LANG_MAP = {
  en: "en-IN",
  hi: "hi-IN",
};

const SPEECH_RATES = {
  en: 0.9,
  hi: 0.82,
};

const SPEECH_PITCH = {
  en: 1.02,
  hi: 1.0,
};

/** Real, natural-sounding female voices (not robotic) on common platforms. */
const WARM_VOICE_PATTERNS = [
  /google.*hindi|hindi.*india|lekha|veena|kalpana|priya|neha|heera/i,
  /samantha|female|woman|natural|neural|premium|enhanced|wavenet|studio/i,
];

function scoreVoice(voice, langCode) {
  const target = LANG_MAP[langCode] || "en-IN";
  const prefix = target.split("-")[0];
  let score = 0;
  // Language match dominates everything else — a same-language voice must
  // always outrank a "warm"-sounding voice in the wrong language.
  if (voice.lang?.toLowerCase() === target.toLowerCase()) score += 100;
  else if (voice.lang?.toLowerCase().startsWith(prefix)) score += 60;
  else return 0; // never pick a voice in an unrelated language

  if (WARM_VOICE_PATTERNS[0].test(voice.name)) score += 10;
  if (WARM_VOICE_PATTERNS[1].test(voice.name)) score += 6;
  if (/google|apple|microsoft/i.test(voice.name)) score += 2;
  if (voice.localService) score += 1;
  return score;
}

function pickVoice(langCode) {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const ranked = [...voices]
    .map((v) => ({ v, score: scoreVoice(v, langCode) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.v || null;
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
    (text, overrideLang) => {
      if (!supported || !text?.trim()) return;
      stop();
      const speakLang = overrideLang || lang;
      const utter = new SpeechSynthesisUtterance(text.trim());
      const voice = pickVoice(speakLang);
      utter.lang = voice?.lang || LANG_MAP[speakLang] || "en-IN";
      if (voice) utter.voice = voice;
      utter.rate = SPEECH_RATES[speakLang] ?? 0.85;
      utter.pitch = SPEECH_PITCH[speakLang] ?? 1.0;
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
  return cookLang === "hi" ? "hi" : "en";
}
