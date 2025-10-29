import { useTranslation } from "../i18n";
import "./AppHeader.css";

function AppHeader() {
  const { t, locale, setLocale } = useTranslation();

  const handleStart = () => {
    document.getElementById("composer")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleToggleLanguage = () => {
    setLocale(locale === "en" ? "zh" : "en");
  };

  return (
    <header className="app-header">
      <div className="app-header__branding">
        <img
          className="app-header__logo"
          src="/assets/midas-shiny-logo.svg"
          alt={`${t("app.brandTitle")} logo`}
          width={48}
          height={48}
        />
        <div>
          <div className="app-header__title">{t("app.brandTitle")}</div>
          <div className="app-header__subtitle">{t("app.brandSubtitle")}</div>
        </div>
      </div>
      <nav className="app-header__nav">
        <a href="#composer">{t("nav.composer")}</a>
        <a href="#style-presets">{t("nav.stylePresets")}</a>
        <a href="#material-presets">{t("nav.materialPresets")}</a>
        <a href="#history">{t("nav.history")}</a>
      </nav>
      <div className="app-header__actions">
        <button
          type="button"
          className="language-toggle"
          onClick={handleToggleLanguage}
          title={t("language.toggle")}
        >
          {locale === "en" ? t("language.badge") : t("language.badge.zh")}
        </button>
        <button type="button" className="primary-btn" onClick={handleStart}>
          {t("cta.start")}
        </button>
      </div>
    </header>
  );
}

export default AppHeader;
