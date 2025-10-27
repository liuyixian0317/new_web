import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchSessionDetail, fetchSessionMessages, streamAgentMessage } from "../api/agent";
import type { AgentMessage, AgentSessionDetail, GeneratedArtwork } from "../types";

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
  const [hasSentInitial, setHasSentInitial] = useState(false);
  const [thinkingExpanded, setThinkingExpanded] = useState<Record<string, boolean>>({});

  const draftRef = useRef<{ thinking: string; content: string } | null>(null);
  const chatWindowRef = useRef<HTMLDivElement | null>(null);
  const layoutRef = useRef<HTMLDivElement | null>(null);

  const sortedMessages = useMemo(
    () =>
      [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [messages]
  );

  const loadSession = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [detail, history] = await Promise.all([
        fetchSessionDetail(sessionId),
        fetchSessionMessages(sessionId)
      ]);
      setSession(detail);
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
        error instanceof Error ? error.message : "加载会话失败，请刷新页面或稍后再试。";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

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
    async (content: string) => {
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
      draftRef.current = { thinking: "", content: "" };
      setDraft({ ...draftRef.current });

      try {
        await streamAgentMessage(
          sessionId,
          { message: trimmed },
          {
            onThinkingDelta: (delta) => {
              if (!draftRef.current) {
                draftRef.current = { thinking: "", content: "" };
              }
              draftRef.current.thinking += delta;
              setDraft({ ...draftRef.current });
            },
            onContentDelta: (delta) => {
              if (!draftRef.current) {
                draftRef.current = { thinking: "", content: "" };
              }
              draftRef.current.content += delta;
              setDraft({ ...draftRef.current });
            },
            onComplete: (event) => {
              const finalThinking = event.thinking ?? draftRef.current?.thinking ?? "";
              const finalContent =
                event.message?.trim() || draftRef.current?.content.trim() || "（未返回内容）";
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
            },
            onError: (error) => {
              setErrorMessage(error.message);
              setDraft(null);
              draftRef.current = null;
            }
          }
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "发送失败，请稍后再试。";
        setErrorMessage(message);
        setDraft(null);
        draftRef.current = null;
      } finally {
        setIsStreaming(false);
      }
    },
    [mergeArtworks, sessionId]
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
    void sendMessageContent(initial);
  }, [session, hasSentInitial, isStreaming, messages.length, sendMessageContent]);

  if (isLoading) {
    return (
      <div className="page page--agent">
        <div className="page__loading">正在唤醒 Agent，会话初始化中...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="page page--agent">
        <div className="page__error">{errorMessage ?? "未找到对应的设计会话。"}</div>
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
              <h2 className="agent-pane__title">会话协作</h2>
              <p className="agent-pane__subtitle">
                所有需求收集、澄清与确认均通过对话完成，准备好时 Agent 将自动生图。
              </p>
            </div>
            <div className="agent-pane__actions">
              <button className="button button--secondary" onClick={loadSession} disabled={isStreaming}>
                刷新
              </button>
              <button className="button button--ghost" onClick={handleProceed}>
                进入最终方案
              </button>
            </div>
          </header>

          <div className="chat-window" ref={chatWindowRef}>
            {sortedMessages.map((message) => (
              <div key={message.id} className={`chat-message chat-message--${message.role}`}>
                <div className="chat-message__meta">
                  <span className="chat-message__role">
                    {message.role === "user" ? "我" : message.role === "assistant" ? "Agent" : "系统"}
                  </span>
                  <span className="chat-message__time">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                {message.thinkingTrace && (
                  <details
                    className="chat-message__thinking"
                    open={thinkingExpanded[message.id] ?? false}
                    onToggle={(event) => {
                      const element = event.currentTarget as HTMLDetailsElement;
                      setThinkingExpanded((prev) => ({ ...prev, [message.id]: element.open }));
                    }}
                  >
                    <summary>
                      {thinkingExpanded[message.id] ?? false
                        ? "思考过程（点击折叠）"
                        : "思考过程（点击展开）"}
                    </summary>
                    <pre>{message.thinkingTrace}</pre>
                  </details>
                )}
                {message.content && <p className="chat-message__content">{message.content}</p>}
                {message.prompts?.length ? (
                  <div className="chat-message__prompts">
                    <span>生成指令：</span>
                    <ul>
                      {message.prompts.map((prompt, index) => (
                        <li key={index}>{prompt}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ))}

            {draft && (
              <div className="chat-message chat-message--assistant chat-message--streaming">
                <div className="chat-message__meta">
                  <span className="chat-message__role">Agent</span>
                  <span className="chat-message__time">正在生成...</span>
                </div>
                {draft.thinking && (
                  <details className="chat-message__thinking" open>
                    <summary>推理中</summary>
                    <pre>{draft.thinking}</pre>
                  </details>
                )}
                {draft.content && <p className="chat-message__content">{draft.content}</p>}
              </div>
            )}
          </div>

          <div className="chat-input">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="继续补充需求、回答 Agent 问题或提出新想法..."
              rows={3}
            />
            <button onClick={handleSend} className="button button--primary" disabled={isStreaming}>
              {isStreaming ? "生成中..." : "发送"}
            </button>
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
              <h2 className="agent-pane__title">生成结果</h2>
              <p className="agent-pane__subtitle">
                {currentAction === "generate_image"
                  ? "最新回合已触发 SeedDream 生图，等待结果..."
                  : "当信息充分时，Agent 会自动调用 SeedDream 生成图片。"}
              </p>
            </div>
          </header>

          {artworks.length === 0 ? (
            <div className="gallery-empty">
              <p>暂无图片。继续完善需求或等待 Agent 决定生成。</p>
              {session.referenceImageUrl ? (
                <figure className="gallery-reference">
                  <img src={session.referenceImageUrl} alt="参考图" />
                  <figcaption>用户参考图</figcaption>
                </figure>
              ) : null}
            </div>
          ) : (
            <div className="gallery-grid">
              {artworks.map((artwork) => (
                <figure key={artwork.id} className={`gallery-item${artwork.error ? " gallery-item--error" : ""}`}>
                  {artwork.imageUrl ? (
                    <img src={artwork.imageUrl} alt="生成图片" />
                  ) : (
                    <div className="gallery-item__placeholder">图片暂未返回</div>
                  )}
                  <figcaption>
                    {artwork.error ? (
                      <p className="gallery-item__error">生成失败：{artwork.error}</p>
                    ) : (
                      <>
                        {artwork.prompt && <p className="gallery-item__prompt">{artwork.prompt}</p>}
                        <p className="gallery-item__meta">
                          {(artwork.seed && `Seed ${artwork.seed}`) ||
                            (artwork.sizeLabel && `${artwork.sizeLabel}`) ||
                            "SeedDream 输出"}
                        </p>
                      </>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default AgentCollaborationPage;
