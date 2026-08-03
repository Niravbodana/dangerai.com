import { createContext, useContext, useEffect, useState } from "react";
import { translations } from "../i18n/translations";
import { defaultLanguageForState } from "../data/indianStates";

const LanguageContext = createContext(null);

function readInitialLang() {
  const saved = localStorage.getItem("akb-lang");
  if (saved) return saved;
  try {
    const taste = JSON.parse(localStorage.getItem("akb-taste-profile") || "{}");
    if (taste.homeState) return defaultLanguageForState(taste.homeState);
  } catch {
    /* ignore */
  }
  return "en";
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(readInitialLang);

  useEffect(() => {
    localStorage.setItem("akb-lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key) => translations[lang][key] || translations.en[key] || key;
  const toggle = () => {
    localStorage.setItem("akb-lang-manual", "1");
    setLang((l) => (l === "hi" ? "en" : "hi"));
  };
  const setLangWithManual = (next) => {
    localStorage.setItem("akb-lang-manual", "1");
    setLang(next);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: setLangWithManual, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
