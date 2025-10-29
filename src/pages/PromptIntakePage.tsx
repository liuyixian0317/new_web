import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createAgentSession } from "../api/agent";
import type { AgentSessionSummary } from "../types";
import { useTranslation } from "../i18n";

interface PromptIntakePageProps {
  onSessionCreated: (session: AgentSessionSummary) => void;
}

function PromptIntakePage({ onSessionCreated }: PromptIntakePageProps) {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<"chat" | "agent">("chat");
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imageCount, setImageCount] = useState(4);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isReady = useMemo(() => prompt.trim().length > 0 && !isSubmitting, [prompt, isSubmitting]);
  const suggestions = useMemo(
    () => [
      t("promptIntake.suggestions.idea"),
      t("promptIntake.suggestions.material"),
      t("promptIntake.suggestions.visual"),
      t("promptIntake.suggestions.story"),
      t("promptIntake.suggestions.more")
    ],
    [t]
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setReferenceImage(file);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
    event.target.value = "";
  };

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (isSubmitting) {
      return;
    }
    if (!prompt.trim()) {
      setErrorMessage(t("promptIntake.error.required"));
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const session = await createAgentSession({
        prompt: prompt.trim(),
        referenceImage,
        requestedCount: imageCount
      });
      onSessionCreated(session);
    } catch (error) {
      const message =
        error instanceof Error && error.message ? error.message : t("promptIntake.error.generic");
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="home-layout">
      <section className="home-hero">
        <p className="home-hero__eyebrow">{t("promptIntake.eyebrow")}</p>
        <h1 className="home-hero__heading">{t("promptIntake.heading")}</h1>
        <p className="home-hero__subtitle">{t("promptIntake.subtitle")}</p>
      </section>

      <section className="home-composer">
        <div className="home-mode-toggle" role="group" aria-label={t("promptIntake.mode.label")}>
          <button
            type="button"
            className={`mode-chip${mode === "chat" ? " mode-chip--active" : ""}`}
            onClick={() => setMode("chat")}
            aria-pressed={mode === "chat"}
          >
            <span aria-hidden="true">💬</span>
            {t("promptIntake.mode.chat")}
          </button>
          <button
            type="button"
            className="mode-chip"
            onClick={() => setMode("agent")}
            aria-pressed={mode === "agent"}
            disabled
            title={t("promptIntake.mode.agentDisabled")}
          >
            <span aria-hidden="true">🧠</span>
            {t("promptIntake.mode.agent")}
          </button>
        </div>

        <form
          className="home-input"
          onSubmit={handleSubmit}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void handleSubmit();
            }
          }}
        >
          <textarea
            id="prompt-input"
            placeholder={t("promptIntake.prompt.placeholder")}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={5}
          />
          <input
            ref={fileInputRef}
            id="reference-image"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            hidden
          />
          <div className="home-input__toolbar">
            <div className="home-input__actions">
              <button
                type="button"
                className="icon-button"
                onClick={() => fileInputRef.current?.click()}
                title={t("promptIntake.actions.image")}
              >
                <span aria-hidden="true">🖼️</span>
                <span>{t("promptIntake.actions.image")}</span>
              </button>
              <button
                type="button"
                className="icon-button icon-button--ghost"
                title={t("promptIntake.actions.file")}
                disabled
              >
                <span aria-hidden="true">📎</span>
                <span>{t("promptIntake.actions.file")}</span>
              </button>
              <button
                type="button"
                className="icon-button icon-button--ghost"
                title={t("promptIntake.actions.more")}
                disabled
              >
                <span aria-hidden="true">⋯</span>
                <span>{t("promptIntake.actions.more")}</span>
              </button>
            </div>
            <div className="home-input__controls">
              <label className="home-input__count" htmlFor="home-generation-count">
                <span>{t("promptIntake.count.label")}</span>
                <select
                  id="home-generation-count"
                  value={imageCount}
                  disabled={isSubmitting}
                  onChange={(event) => {
                    const parsed = Number.parseInt(event.target.value, 10);
                    const next = Number.isNaN(parsed) ? 1 : Math.min(Math.max(parsed, 1), 8);
                    setImageCount(next);
                  }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <button className="home-submit" type="submit" disabled={!isReady}>
                {isSubmitting ? t("promptIntake.submitting") : t("promptIntake.submit")}
              </button>
            </div>
          </div>
        </form>

        {previewUrl && (
          <div className="home-attachment">
            <img src={previewUrl} alt={t("promptIntake.reference.previewAlt")} />
            <button
              type="button"
              onClick={() => {
                setReferenceImage(null);
                setPreviewUrl(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              aria-label={t("promptIntake.reference.remove")}
            >
              ×
            </button>
          </div>
        )}

        {errorMessage && <p className="form-error form-error--home">{errorMessage}</p>}
      </section>

      <section className="home-suggestions">
        <h2 className="home-suggestions__title">{t("promptIntake.tips.title")}</h2>
        <p className="home-suggestions__subtitle">{t("promptIntake.tips.footer")}</p>
        <div className="home-suggestions__chips">
          {suggestions.map((tip) => (
            <button
              key={tip}
              type="button"
              className="chip chip--pill"
              onClick={() => setPrompt((value) => (value ? `${value}\n${tip}` : tip))}
            >
              {tip}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export default PromptIntakePage;
