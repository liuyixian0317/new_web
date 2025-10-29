import { useCallback, useEffect, useMemo, useState } from "react";
import PromptIntakePage from "./pages/PromptIntakePage";
import AgentCollaborationPage from "./pages/AgentCollaborationPage";
import FinalGenerationPage from "./pages/FinalGenerationPage";
import type { AgentSessionSummary, AppPage } from "./types";
import { useTranslation } from "./i18n";
import "./styles/agent-flow.css";

interface RouterState {
  page: AppPage;
  sessionId?: string;
}

const parseRouterState = (): RouterState => {
  const searchParams = new URLSearchParams(window.location.search);
  const pageParam = searchParams.get("page");
  const page: AppPage = pageParam === "agent" || pageParam === "final" ? (pageParam as AppPage) : "prompt";
  const sessionId = searchParams.get("sessionId") || undefined;
  return { page, sessionId };
};

const pushRouterState = (state: RouterState) => {
  const url = new URL(window.location.href);
  url.searchParams.set("page", state.page);
  if (state.sessionId) {
    url.searchParams.set("sessionId", state.sessionId);
  } else {
    url.searchParams.delete("sessionId");
  }
  window.history.pushState(state, "", url.toString());
};

const App = () => {
  const [route, setRoute] = useState<RouterState>(() => parseRouterState());
  const { t, locale, setLocale } = useTranslation();

  useEffect(() => {
    const handlePopState = () => {
      setRoute(parseRouterState());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = useCallback((page: AppPage, params?: { sessionId?: string }) => {
    const nextState: RouterState = {
      page,
      sessionId: params?.sessionId
    };
    pushRouterState(nextState);
    setRoute(nextState);
  }, []);

  const handleSessionCreated = useCallback(
    (session: AgentSessionSummary) => {
      navigate("agent", { sessionId: session.id });
    },
    [navigate]
  );

  const handleProceedToFinal = useCallback(
    (sessionId: string) => {
      navigate("final", { sessionId });
    },
    [navigate]
  );

  const handleNavigateHome = useCallback(() => {
    navigate("prompt");
  }, [navigate]);

  const sessionLabel = useMemo(() => {
    if (!route.sessionId) return t("app.session.inactive");
    return t("app.session.label", { id: route.sessionId.slice(0, 6) });
  }, [route.sessionId, t]);

  const handleToggleLanguage = useCallback(() => {
    setLocale(locale === "en" ? "zh" : "en");
  }, [locale, setLocale]);

  const shellClass =
    route.page === "prompt" ? "app-shell app-shell--home" : "app-shell app-shell--workflow";

  return (
    <div className={shellClass}>
      {route.page === "prompt" ? (
        <header className="home-header">
          <div className="home-header__brand" role="button" tabIndex={0} onClick={handleNavigateHome}>
            <img
              className="home-header__logo"
              src="/assets/midas-shiny-logo.svg"
              alt={t("app.brandTitle")}
              width={28}
              height={28}
            />
            <span className="home-header__title">{t("app.brandTitle")}</span>
          </div>
          <div className="home-header__actions">
            <button
              className="chip chip--ghost"
              onClick={handleToggleLanguage}
              title={t("language.toggle")}
              type="button"
            >
              {locale === "en" ? t("language.english") : t("language.chinese")}
            </button>
          </div>
        </header>
      ) : (
        <header className="app-shell__header">
          <div className="app-shell__brand" role="button" tabIndex={0} onClick={handleNavigateHome}>
            <span className="app-shell__brand-title">{t("app.brandTitle")}</span>
            <span className="app-shell__brand-subtitle">{t("app.brandSubtitle")}</span>
          </div>
          <div className="app-shell__status">
            <span className="app-shell__status-label">{sessionLabel}</span>
            <button
              className="button button--ghost"
              onClick={handleToggleLanguage}
              title={t("language.toggle")}
              type="button"
            >
              {locale === "en" ? t("language.badge") : t("language.badge.zh")}
            </button>
            <button className="button button--ghost" onClick={handleNavigateHome}>
              {t("app.actions.home")}
            </button>
          </div>
        </header>
      )}

      <main className={`app-shell__body${route.page === "prompt" ? " app-shell__body--home" : ""}`}>
        {route.page === "prompt" && <PromptIntakePage onSessionCreated={handleSessionCreated} />}

        {route.page === "agent" &&
          (route.sessionId ? (
            <AgentCollaborationPage
              key={route.sessionId}
              sessionId={route.sessionId}
              onProceedToFinal={handleProceedToFinal}
            />
          ) : (
            <MissingSessionNotice onNavigateHome={handleNavigateHome} />
          ))}

        {route.page === "final" &&
          (route.sessionId ? (
            <FinalGenerationPage key={route.sessionId} sessionId={route.sessionId} />
          ) : (
            <MissingSessionNotice onNavigateHome={handleNavigateHome} />
          ))}
      </main>
    </div>
  );
};

interface MissingSessionNoticeProps {
  onNavigateHome: () => void;
}

const MissingSessionNotice = ({ onNavigateHome }: MissingSessionNoticeProps) => {
  const { t } = useTranslation();
  return (
    <div className="page page--empty">
      <p>{t("app.missingSession.message")}</p>
      <button className="button button--primary" onClick={onNavigateHome}>
        {t("app.missingSession.cta")}
      </button>
    </div>
  );
};

export default App;
