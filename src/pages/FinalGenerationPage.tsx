import { useEffect, useMemo, useState } from "react";
import { finalizeAgentSession, fetchSessionDetail } from "../api/agent";
import type { AgentSessionDetail, GeneratedArtwork } from "../types";

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
          setStatusMessage("已加载上一轮的渲染结果。");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "加载会话信息失败。";
        setError(message);
      }
    };
    loadSession();
  }, [sessionId]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStatusMessage("正在整理需求并生成最终 prompt...");
    setError(null);
    try {
      const response = await finalizeAgentSession(sessionId);
      setSession(response.session);
      setFinalPrompt(response.finalPrompt);
      setArtworks(response.generatedArtworks);
      setStatusMessage("生成完成，可以下载高清图或复制 prompt。");
    } catch (err) {
      const message = err instanceof Error ? err.message : "生成失败，请稍后再试。";
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
      setStatusMessage("Prompt 已复制到剪贴板。");
    } catch (err) {
      const message = err instanceof Error ? err.message : "复制失败，请手动选择文本复制。";
      setError(message);
    }
  };

  const knowledgeList = useMemo(() => session?.knowledgeReferences ?? [], [session]);

  return (
    <div className="page page--final">
      <section className="final-panel final-panel--summary">
        <header className="final-panel__header">
          <div>
            <h2 className="final-panel__title">最终方案确认</h2>
            <p className="final-panel__subtitle">
              Agent 已整理所有聊天记录与知识库信息，点击生成将产出可复用的生图 prompt 以及高清渲染。
            </p>
          </div>
          <button className="button button--primary" onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? "生成中..." : "生成最终效果"}
          </button>
        </header>

        <div className="final-summary">
          <h3>初始需求</h3>
          <p className="final-summary__content">{session?.initialPrompt}</p>
          {session?.notes && <p className="final-summary__notes">{session.notes}</p>}
        </div>

        <div className="final-prompt">
          <div className="final-prompt__header">
            <h3>最终 Prompt</h3>
            <button
              className="button button--secondary"
              onClick={handleCopyPrompt}
              disabled={!finalPrompt}
            >
              复制 Prompt
            </button>
          </div>
          <textarea readOnly rows={8} value={finalPrompt} />
        </div>

        {knowledgeList.length > 0 && (
          <div className="final-knowledge">
            <h3>引用的知识条目</h3>
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
        <h3 className="final-gallery__title">渲染效果</h3>
        {artworks.length === 0 ? (
          <p className="final-gallery__empty">
            点击“生成最终效果”后，将展示高清渲染结果和可下载的图片资源。
          </p>
        ) : (
          <div className="final-gallery__grid">
            {artworks.map((artwork) => (
              <figure key={artwork.id} className="final-gallery__item">
                <img src={artwork.imageUrl} alt="潮玩渲染图" />
                <figcaption>
                  {artwork.seed ? `Seed ${artwork.seed}` : "高清渲染"}
                  {artwork.sizeLabel ? ` · ${artwork.sizeLabel}` : ""}
                </figcaption>
                <a className="button button--link" href={artwork.imageUrl} download>
                  下载图片
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
