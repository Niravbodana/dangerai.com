import { useLanguage } from "../context/LanguageContext";

export default function BlinkingSlogan() {
  const { t } = useLanguage();

  return (
    <div className="slogan-container my-4">
      <p className="slogan-line slogan-line-1">{t("slogan1")}</p>
      <p className="slogan-line slogan-line-2">{t("slogan2")}</p>
    </div>
  );
}
