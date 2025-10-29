import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchSessionDetail, fetchSessionMessages, streamAgentMessage } from "../api/agent";
import type { AgentMessage, AgentSessionDetail, GeneratedArtwork } from "../types";
import { useTranslation } from "../i18n";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AgentCollaborationPageProps {
  sessionId: string;
  onProceedToFinal: (sessionId: string) => void;
}

function AgentCollaborationPage({ sessionId, onProceedToFinal }: AgentCollaborationPageProps) {
  const [session, setSession] = useState<AgentSessionDetail | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [artworks, setArtworks] = useState<GeneratedArtwork[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [splitPercent, setSplitPercent] = useState(60);
  const [draft, setDraft] = useState<{ thinking: string; content: string } | null>(null);
  const [draftThinkingOpen, setDraftThinkingOpen] = useState(true);
  const [hasSentInitial, setHasSentInitial] = useState(false);
  const [thinkingExpanded, setThinkingExpanded] = useState<Record<string, boolean>>({});
  const [imageCount, setImageCount] = useState(4);
  const [pendingPrompts, setPendingPrompts] = useState<string[] | null>(null);
  const [pendingSize, setPendingSize] = useState<string | null>(null);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const { t } = useTranslation();

  const draftRef = useRef<{ thinking: string; content: string } | null>(null);
  const chatWindowRef = useRef<HTMLDivElement | null>(null);
  const layoutRef = useRef<HTMLDivElement | null>(null);

  const sortedMessages = useMemo(
    () =>
      [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [messages]
  );

  const groupedArtworks = useMemo(() => {
    if (artworks.length === 0) return [];
    const groups = new Map<string, { key: string; prompt: string; items: GeneratedArtwork[] }>();
    artworks.forEach((artwork) => {
      const promptKey = artwork.prompt?.trim() ?? `__${artwork.id}`;
      const promptLabel = artwork.prompt?.trim() ?? t("agent.gallery.untitled");
      if (!groups.has(promptKey)) {
        groups.set(promptKey, { key: promptKey, prompt: promptLabel, items: [] });
      }
      groups.get(promptKey)!.items.push(artwork);
    });
    return Array.from(groups.values());
  }, [artworks, t]);

  const loadSession = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [detail, history] = await Promise.all([
        fetchSessionDetail(sessionId),
        fetchSessionMessages(sessionId)
      ]);
      setSession(detail);
      setImageCount(detail.requestedCount ?? 4);
      setMessages(history);
      setArtworks(detail.generatedArtworks ?? []);
      setThinkingExpanded((prev) => {
        const next = { ...prev };
        history.forEach((item) => {
          if (item.role === "assistant" && item.thinkingTrace && !(item.id in next)) {
            next[item.id] = false;
          }
        });
        return next;
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message ? error.message : t("agent.error.load");
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, t]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    const node = chatWindowRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [sortedMessages.length, draft]);

  const mergeArtworks = useCallback((incoming: GeneratedArtwork[] | undefined) => {
    if (!incoming?.length) return;
    setArtworks((prev) => {
      const existing = new Map(prev.map((item) => [item.id, item]));
      incoming.forEach((item) => {
        if (item.id) {
          existing.set(item.id, { ...existing.get(item.id), ...item });
        }
      });
      return Array.from(existing.values());
    });
  }, []);

  const sendMessageContent = useCallback(
    async (content: string, countOverride?: number) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      const timestamp = new Date().toISOString();
      const userMessage: AgentMessage = {
        id: `local-${Date.now()}`,
        role: "user",
        content: trimmed,
        createdAt: timestamp
      };
      setMessages((prev) => [...prev, userMessage]);
      setErrorMessage(null);
      setIsStreaming(true);
      setPendingPrompts(null);
      setPendingSize(null);
      setIsGeneratingImages(false);
      draftRef.current = { thinking: "", content: "" };
      setDraft({ ...draftRef.current });
      setDraftThinkingOpen(true);

      try {
        const requestedCount = countOverride ?? imageCount;

        await streamAgentMessage(
          sessionId,
          { message: trimmed, requestedCount },
          {
            onThinkingDelta: (delta) => {
              if (!draftRef.current) {
                draftRef.current = { thinking: "", content: "" };
              }
              draftRef.current.thinking += delta;
              setDraft({ ...draftRef.current });
              setDraftThinkingOpen(true);
            },
            onContentDelta: (delta) => {
              if (!draftRef.current) {
                draftRef.current = { thinking: "", content: "" };
              }
              draftRef.current.content += delta;
              setDraft({ ...draftRef.current });
              setDraftThinkingOpen(false);
            },
            onActionPlan: (prompts, _thinking, _action, size) => {
              setPendingPrompts(prompts.length ? prompts : []);
              setPendingSize(size ?? null);
              setIsGeneratingImages(true);
            },
            onComplete: (event) => {
              const finalThinking = event.thinking ?? draftRef.current?.thinking ?? "";
              const finalContent =
                event.message?.trim() || draftRef.current?.content.trim() || t("agent.chat.emptyResponse");
              const appliedCount = event.requestedCount ?? requestedCount;
              const assistantMessage: AgentMessage = {
                id: `assistant-${Date.now()}`,
                role: "assistant",
                content: finalContent,
                createdAt: new Date().toISOString(),
                thinkingTrace: finalThinking,
                action: event.action,
                prompts: event.prompts
              };
              setMessages((prev) => [...prev, assistantMessage]);
              if (finalThinking) {
                setThinkingExpanded((prev) => ({ ...prev, [assistantMessage.id]: false }));
              }
              mergeArtworks(event.artworks);
              setDraft(null);
              draftRef.current = null;
              setDraftThinkingOpen(true);
              setSession((prev) => (prev ? { ...prev, requestedCount: appliedCount } : prev));
              setImageCount(appliedCount);
              setPendingPrompts(null);
              setIsGeneratingImages(false);
            },
            onError: (error) => {
              setErrorMessage(error.message || t("agent.error.stream"));
              setDraft(null);
              draftRef.current = null;
              setPendingPrompts(null);
              setIsGeneratingImages(false);
              setDraftThinkingOpen(true);
            }
          }
        );
      } catch (error) {
        const message =
          error instanceof Error && error.message ? error.message : t("agent.chat.error.send");
        setErrorMessage(message);
        setDraft(null);
        draftRef.current = null;
        setPendingPrompts(null);
        setIsGeneratingImages(false);
      } finally {
        setIsStreaming(false);
      }
    },
    [imageCount, mergeArtworks, sessionId, t]
  );

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    const value = input.trim();
    setInput("");
    await sendMessageContent(value);
  };

  const handleProceed = () => {
    onProceedToFinal(sessionId);
  };

  const handleDividerMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    const layoutNode = layoutRef.current;
    if (!layoutNode) return;
    const { left, width } = layoutNode.getBoundingClientRect();

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const relativeX = moveEvent.clientX - left;
      const nextPercent = (relativeX / width) * 100;
      const clamped = Math.min(Math.max(nextPercent, 35), 75);
      setSplitPercent(clamped);
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const currentAction = sortedMessages
    .slice()
    .reverse()
    .find((message) => message.role === "assistant" && message.action)?.action;

  useEffect(() => {
    if (!session || hasSentInitial || isStreaming) return;
    if (messages.length > 0) {
      setHasSentInitial(true);
      return;
    }
    const initial = session.initialPrompt?.trim();
    if (!initial) {
      setHasSentInitial(true);
      return;
    }
    setHasSentInitial(true);
    void sendMessageContent(initial, session.requestedCount ?? imageCount);
  }, [session, hasSentInitial, isStreaming, messages.length, sendMessageContent, imageCount]);

  if (isLoading) {
    return (
      <div className="page page--agent">
        <div className="page__loading">{t("agent.loading")}</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="page page--agent">
        <div className="page__error">{errorMessage ?? t("agent.error.notFound")}</div>
      </div>
    );
  }

  return (
    <div className="page page--agent">
      <div className="agent-workspace" ref={layoutRef}>
        <section
          className="agent-pane agent-pane--chat"
          style={{ flexBasis: `${splitPercent}%`, maxWidth: `${splitPercent}%` }}
        >
          <header className="agent-pane__header">
            <div>
              <h2 className="agent-pane__title">{t("agent.chat.title")}</h2>
              <p className="agent-pane__subtitle">{t("agent.chat.subtitle")}</p>
            </div>
          </header>

          <div className="chat-window" ref={chatWindowRef}>
            {sortedMessages.map((message) => {
              const roleLabel =
                message.role === "user"
                  ? t("agent.chat.role.user")
                  : message.role === "assistant"
                    ? t("agent.chat.role.agent")
                    : t("agent.chat.role.system");
              const isExpanded = thinkingExpanded[message.id] ?? false;
              return (
                <div key={message.id} className={`chat-message chat-message--${message.role}`}>
                  <div className="chat-message__meta">
                    <span className="chat-message__role">{roleLabel}</span>
                    <span className="chat-message__time">
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  {message.thinkingTrace && (
                    <details
                      className="chat-message__thinking"
                      open={isExpanded}
                      onToggle={(event) => {
                        const element = event.currentTarget as HTMLDetailsElement;
                        setThinkingExpanded((prev) => ({ ...prev, [message.id]: element.open }));
                      }}
                    >
                      <summary>
                        {isExpanded ? t("agent.chat.thinking.collapse") : t("agent.chat.thinking.expand")}
                      </summary>
                      <pre>{message.thinkingTrace}</pre>
                    </details>
                  )}
                  {message.content && (
                    <div className="chat-message__content markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                    </div>
                  )}
                  {message.prompts?.length ? (
                    <div className="chat-message__prompts">
                      <span>{t("agent.chat.promptsLabel")}</span>
                      <ul>
                        {message.prompts.map((prompt, index) => (
                          <li key={index}>{prompt}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              );
            })}

            {draft && (
              <div className="chat-message chat-message--assistant chat-message--streaming">
                <div className="chat-message__meta">
                  <span className="chat-message__role">{t("agent.chat.role.agent")}</span>
                  <span className="chat-message__time">{t("agent.chat.streaming")}</span>
                </div>
                {draft.thinking && (
                  <details className="chat-message__thinking" open={draftThinkingOpen}>
                    <summary>{t("agent.chat.reasoning")}</summary>
                    <pre>{draft.thinking}</pre>
                  </details>
                )}
                {draft.content && (
                  <div className="chat-message__content markdown-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            )}

            {pendingPrompts !== null && (
              <div className="chat-message chat-message--assistant chat-message--pending">
                <div className="chat-message__meta">
                  <span className="chat-message__role">{t("agent.chat.role.agent")}</span>
                  <span className="chat-message__time">{t("agent.chat.generatingStatus")}</span>
                </div>
                <div className="chat-action-plan">
                  <p className="chat-action-plan__title">{t("agent.chat.actionPlanTitle")}</p>
                  {pendingPrompts.length > 0 && (
                    <ul className="chat-action-plan__list">
                      {pendingPrompts.map((prompt) => (
                        <li key={prompt}>{prompt}</li>
                      ))}
                    </ul>
                  )}
                  {pendingSize && (
                    <p className="chat-action-plan__size">{t("agent.chat.sizeLabel", { value: pendingSize })}</p>
                  )}
                  {isGeneratingImages && (
                    <div className="chat-action-plan__status">
                      <span className="chat-action-plan__spinner" aria-hidden="true" />
                      <span>{t("agent.chat.generatingStatus")}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="chat-input">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSend();
                }
              }}
              placeholder={t("agent.chat.inputPlaceholder")}
              rows={3}
            />
            <div className="chat-input__actions">
              <label className="chat-input__count" htmlFor="agent-generation-count">
                <span>{t("agent.chat.countLabel")}</span>
                <select
                  id="agent-generation-count"
                  value={imageCount}
                  disabled={isStreaming}
                  onChange={(event) => {
                    const parsed = Number.parseInt(event.target.value, 10);
                    const next = Number.isNaN(parsed) ? 1 : Math.min(Math.max(parsed, 1), 8);
                    setImageCount(next);
                    setSession((prev) => (prev ? { ...prev, requestedCount: next } : prev));
                  }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => (
                    <option key={count} value={count}>
                      {count}
                    </option>
                  ))}
                </select>
              </label>
              <button onClick={handleSend} className="button button--primary" disabled={isStreaming}>
                {isStreaming ? t("agent.chat.generating") : t("agent.chat.send")}
              </button>
            </div>
          </div>
          {errorMessage && <p className="form-error">{errorMessage}</p>}
        </section>

        <div className="agent-divider" role="separator" onMouseDown={handleDividerMouseDown} />

        <aside
          className="agent-pane agent-pane--gallery"
          style={{ flexBasis: `${100 - splitPercent}%`, maxWidth: `${100 - splitPercent}%` }}
        >
          <header className="agent-pane__header">
            <div>
              <h2 className="agent-pane__title">{t("agent.gallery.title")}</h2>
              <p className="agent-pane__subtitle">
                {currentAction === "generate_image"
                  ? t("agent.gallery.subtitle.waiting")
                  : t("agent.gallery.subtitle.idle")}
              </p>
            </div>
          </header>

          <div className="gallery-scroll">
            {groupedArtworks.length === 0 ? (
              <div className="gallery-empty">
                <p>{t("agent.gallery.empty")}</p>
                {session.referenceImageUrl ? (
                  <figure className="gallery-reference">
                    <img src={session.referenceImageUrl} alt={t("agent.gallery.reference.alt")} />
                    <figcaption>{t("agent.gallery.reference.caption")}</figcaption>
                  </figure>
                ) : null}
              </div>
            ) : (
              groupedArtworks.map((group, index) => (
                <section key={group.key} className="gallery-group">
                  <div className="gallery-group__header">
                    <span className="gallery-group__title">
                      {t("agent.gallery.promptLabel", { index: index + 1 })}
                    </span>
                    <p className="gallery-group__prompt">{group.prompt}</p>
                  </div>
                  <div className="gallery-row">
                    {group.items.map((artwork) => (
                      <figure
                        key={artwork.id}
                        className={`gallery-item${artwork.error ? " gallery-item--error" : ""}`}
                      >
                        {artwork.imageUrl ? (
                          <img src={artwork.imageUrl} alt={t("agent.gallery.imageAlt")} />
                        ) : (
                          <div className="gallery-item__placeholder">{t("agent.gallery.placeholder")}</div>
                        )}
                        <figcaption>
                          {artwork.error ? (
                            <p className="gallery-item__error">
                              {t("agent.gallery.error", { message: artwork.error })}
                            </p>
                          ) : (
                            <p className="gallery-item__meta">
                              {(artwork.seed && `Seed ${artwork.seed}`) ||
                                (artwork.sizeLabel && `${artwork.sizeLabel}`) ||
                                t("agent.gallery.seedFallback")}
                            </p>
                          )}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default AgentCollaborationPage;
