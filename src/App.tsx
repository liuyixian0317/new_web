import { useCallback, useEffect, useMemo, useState } from "react";
import PromptIntakePage from "./pages/PromptIntakePage";
import AgentCollaborationPage from "./pages/AgentCollaborationPage";
import FinalGenerationPage from "./pages/FinalGenerationPage";
import type { AgentSessionSummary, AppPage } from "./types";
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
    if (!route.sessionId) return "未开始";
    return `会话 #${route.sessionId.slice(0, 6)}`;
  }, [route.sessionId]);

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div className="app-shell__brand" role="button" tabIndex={0} onClick={handleNavigateHome}>
          <span className="app-shell__brand-title">潮玩造梦师</span>
          <span className="app-shell__brand-subtitle">Toy Dream Builder</span>
        </div>
        <div className="app-shell__status">
          <span className="app-shell__status-label">{sessionLabel}</span>
          <button className="button button--ghost" onClick={handleNavigateHome}>
            回到首页
          </button>
        </div>
      </header>

      <main className="app-shell__body">
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

const MissingSessionNotice = ({ onNavigateHome }: MissingSessionNoticeProps) => (
  <div className="page page--empty">
    <p>未找到对应的会话，请返回首页重新发起。</p>
    <button className="button button--primary" onClick={onNavigateHome}>
      返回首页
    </button>
  </div>
);

export default App;
