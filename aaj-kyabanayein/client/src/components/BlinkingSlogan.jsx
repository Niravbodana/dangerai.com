import { useLanguage } from "../context/LanguageContext";

export default function BlinkingSlogan() {
  const { t } = useLanguage();

  return (
    <div className="slogan-container mx-auto mb-6 h-16 max-w-2xl">
      <p className="slogan-line slogan-line-1 text-xl font-semibold text-stone-700 sm:text-2xl">
        {t("slogan1")}
      </p>
      <p className="slogan-line slogan-line-2 text-xl font-semibold text-emerald-700 sm:text-2xl">
        {t("slogan2")}
      </p>
    </div>
  );
}
