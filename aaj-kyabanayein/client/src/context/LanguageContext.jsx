import { createContext, useContext, useEffect, useState } from "react";
import { translations } from "../i18n/translations";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("akb-lang") || "hi");

  useEffect(() => {
    localStorage.setItem("akb-lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key) => translations[lang][key] || translations.en[key] || key;
  const toggle = () => setLang((l) => (l === "hi" ? "en" : "hi"));

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
