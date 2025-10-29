import { useEffect, useMemo, useState } from "react";
import { finalizeAgentSession, fetchSessionDetail } from "../api/agent";
import type { AgentSessionDetail, GeneratedArtwork } from "../types";
import { useTranslation } from "../i18n";

interface FinalGenerationPageProps {
  sessionId: string;
}

function FinalGenerationPage({ sessionId }: FinalGenerationPageProps) {
  const [session, setSession] = useState<AgentSessionDetail | null>(null);
  const [finalPrompt, setFinalPrompt] = useState<string>("");
  const [artworks, setArtworks] = useState<GeneratedArtwork[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const loadSession = async () => {
      try {
        const detail = await fetchSessionDetail(sessionId);
        setSession(detail);
        if (detail.finalPrompt) {
          setFinalPrompt(detail.finalPrompt);
        }
        if (detail.generatedArtworks?.length) {
          setArtworks(detail.generatedArtworks);
          setStatusMessage(t("final.status.loaded"));
        }
      } catch (err) {
        const message = err instanceof Error && err.message ? err.message : t("final.error.load");
        setError(message);
      }
    };
    loadSession();
  }, [sessionId, t]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStatusMessage(t("final.status.preparing"));
    setError(null);
    try {
      const response = await finalizeAgentSession(sessionId);
      setSession(response.session);
      setFinalPrompt(response.finalPrompt);
      setArtworks(response.generatedArtworks);
      setStatusMessage(t("final.status.done"));
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : t("final.error.generate");
      setError(message);
      setStatusMessage(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPrompt = async () => {
    if (!finalPrompt) return;
    try {
      await navigator.clipboard.writeText(finalPrompt);
      setStatusMessage(t("final.prompt.copied"));
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : t("final.error.copy");
      setError(message);
    }
  };

  const knowledgeList = useMemo(() => session?.knowledgeReferences ?? [], [session]);

  return (
    <div className="page page--final">
      <section className="final-panel final-panel--summary">
        <header className="final-panel__header">
          <div>
            <h2 className="final-panel__title">{t("final.summary.title")}</h2>
            <p className="final-panel__subtitle">{t("final.summary.subtitle")}</p>
          </div>
          <button className="button button--primary" onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? t("final.summary.generating") : t("final.summary.generate")}
          </button>
        </header>

        <div className="final-summary">
          <h3>{t("final.summary.initial")}</h3>
          <p className="final-summary__content">{session?.initialPrompt}</p>
          {session?.notes && <p className="final-summary__notes">{session.notes}</p>}
        </div>

        <div className="final-prompt">
          <div className="final-prompt__header">
            <h3>{t("final.prompt.title")}</h3>
            <button
              className="button button--secondary"
              onClick={handleCopyPrompt}
              disabled={!finalPrompt}
            >
              {t("final.prompt.copy")}
            </button>
          </div>
          <textarea readOnly rows={8} value={finalPrompt} />
        </div>

        {knowledgeList.length > 0 && (
          <div className="final-knowledge">
            <h3>{t("final.knowledge.title")}</h3>
            <ul>
              {knowledgeList.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {statusMessage && <p className="status-message">{statusMessage}</p>}
        {error && <p className="form-error">{error}</p>}
      </section>

      <section className="final-panel final-panel--gallery">
        <h3 className="final-gallery__title">{t("final.gallery.title")}</h3>
        {artworks.length === 0 ? (
          <p className="final-gallery__empty">{t("final.gallery.empty")}</p>
        ) : (
          <div className="final-gallery__grid">
            {artworks.map((artwork) => (
              <figure key={artwork.id} className="final-gallery__item">
                <img src={artwork.imageUrl} alt={t("final.gallery.imageAlt")} />
                <figcaption>
                  {artwork.seed ? `Seed ${artwork.seed}` : t("final.gallery.seedFallback")}
                  {artwork.sizeLabel ? ` · ${artwork.sizeLabel}` : ""}
                </figcaption>
                <a className="button button--link" href={artwork.imageUrl} download>
                  {t("final.gallery.download")}
                </a>
              </figure>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default FinalGenerationPage;
