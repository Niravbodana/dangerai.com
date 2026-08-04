import { useEffect, useState } from "react";
import { useSpeech } from "../hooks/useSpeech";

const VOICE_LANGS = [
  { id: "en", label: "English", flag: "🇬🇧", listen: "Listen" },
  { id: "hi", label: "हिंदी", flag: "🇮🇳", listen: "सुनें" },
  { id: "gu", label: "ગુજરાતી", flag: "🇮🇳", listen: "સાંભળો" },
];

export default function StepVoicePanel({ texts, activeLang, onLangChange, onSpeak }) {
  const speechLang = activeLang === "hinglish" ? "hi" : activeLang;
  const { speak, stop, speaking, supported } = useSpeech(speechLang);
  const [activeId, setActiveId] = useState(activeLang);

  useEffect(() => {
    setActiveId(activeLang);
  }, [activeLang]);

  if (!supported) return null;

  const handleListen = (langId) => {
    const text = texts[langId];
    if (!text?.trim()) return;
    setActiveId(langId);
    onLangChange?.(langId);
    if (speaking) stop();
    speak(text);
    onSpeak?.();
  };

  return (
    <div className="step-voice-panel">
      <p className="step-voice-panel__label">🔊 Warm voice guide</p>
      <div className="step-voice-panel__langs">
        {VOICE_LANGS.map((l) => {
          const hasText = !!texts[l.id]?.trim();
          const isActive = activeId === l.id;
          const isSpeaking = isActive && speaking;
          return (
            <button
              key={l.id}
              type="button"
              disabled={!hasText}
              onClick={() => handleListen(l.id)}
              className={`step-voice-panel__btn ${isActive ? "step-voice-panel__btn--active" : ""} ${isSpeaking ? "step-voice-panel__btn--speaking" : ""}`}
            >
              <span className="step-voice-panel__flag">{l.flag}</span>
              <span className="step-voice-panel__name">{l.label}</span>
              <span className="step-voice-panel__action">
                {isSpeaking ? "⏹ Stop" : l.listen}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
