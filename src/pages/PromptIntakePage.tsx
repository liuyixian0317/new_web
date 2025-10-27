import { useEffect, useMemo, useState } from "react";
import { createAgentSession } from "../api/agent";
import type { AgentSessionSummary } from "../types";

interface PromptIntakePageProps {
  onSessionCreated: (session: AgentSessionSummary) => void;
}

const quickTips = [
  "说明潮玩的主题、角色或背景故事。",
  "告诉我们你希望使用的材质、配色以及尺寸。",
  "可以上传草图或灵感图，帮助设计师理解需求。"
];

function PromptIntakePage({ onSessionCreated }: PromptIntakePageProps) {
  const [prompt, setPrompt] = useState("");
  const [notes, setNotes] = useState("");
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isReady = useMemo(() => prompt.trim().length > 0 && !isSubmitting, [prompt, isSubmitting]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setReferenceImage(file);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!prompt.trim()) {
      setErrorMessage("请先输入想要制作的潮玩描述。");
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const session = await createAgentSession({
        prompt: prompt.trim(),
        notes: notes.trim() || undefined,
        referenceImage
      });
      onSessionCreated(session);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "创建智能设计会话失败，请稍后再试。";
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
    <div className="page page--prompt">
      <section className="panel panel--intro">
        <div className="panel__content">
          <h1 className="heading">潮玩造梦师 2.0</h1>
          <p className="subtitle">
            告诉我们你的灵感，AI 设计师将陪伴你完成专属潮玩，从需求确认到成品生成一步到位。
          </p>
          <ol className="steps">
            <li>输入需求或上传参考图，创建智能设计会话。</li>
            <li>与 AI Agent 协作完善设计方案并生成效果图。</li>
            <li>确认最终 prompt，唤起生图模型获得高清渲染。</li>
          </ol>
        </div>
      </section>

      <section className="panel panel--form">
        <form className="intake-form" onSubmit={handleSubmit}>
          <label className="form-label" htmlFor="prompt-input">
            我希望制作的潮玩是...
          </label>
          <textarea
            id="prompt-input"
            className="textarea"
            placeholder="例如：一只背着喷气背包的太空熊，整体采用透明材质，内部有会发光的星云。"
            rows={6}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
          />

          <label className="form-label" htmlFor="notes-input">
            补充说明（可选）
          </label>
          <textarea
            id="notes-input"
            className="textarea textarea--secondary"
            placeholder="告诉设计师特殊工艺、包装、目标人群等信息"
            rows={4}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />

          <label className="form-label" htmlFor="reference-image">
            上传灵感图（可选）
          </label>
          <div className="file-input">
            <input
              id="reference-image"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
            {previewUrl ? (
              <img className="file-input__preview" src={previewUrl} alt="参考图预览" />
            ) : (
              <span className="file-input__placeholder">拖拽或点击上传参考图</span>
            )}
          </div>

          {errorMessage && <p className="form-error">{errorMessage}</p>}

          <button className="button button--primary" type="submit" disabled={!isReady}>
            {isSubmitting ? "创建中..." : "开始智能设计"}
          </button>
        </form>

        <aside className="tips">
          <h2 className="tips__title">高质量提示词速查</h2>
          <ul className="tips__list">
            {quickTips.map((tip) => (
              <li key={tip} className="tips__item">
                {tip}
              </li>
            ))}
          </ul>
          <p className="tips__footer">提示词越具体，生成效果越贴合你的期待。</p>
        </aside>
      </section>
    </div>
  );
}

export default PromptIntakePage;
