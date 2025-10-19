import { FormEvent, useMemo, useState } from "react";
import type { GeneratedArtwork, GenerationTask } from "../types";
import "./ArtworkDetailPanel.css";

interface ProductionFormValues {
  usage: string;
  material: string;
  quantity: string;
  budget: string;
  timeline: string;
  notes: string;
}

interface ArtworkDetailPanelProps {
  artwork: GeneratedArtwork;
  task: GenerationTask;
  isProcessing: boolean;
  onClose: () => void;
  onRefine: (payload: { prompt: string; count: number }) => void;
  onRequest3D: () => void;
  onSubmitProduction: (payload: ProductionFormValues) => void;
}

const clampCount = (value: number) => Math.min(10, Math.max(1, Math.round(value)));

const initialProductionForm: ProductionFormValues = {
  usage: "",
  material: "",
  quantity: "",
  budget: "",
  timeline: "",
  notes: ""
};

function ArtworkDetailPanel({
  artwork,
  task,
  isProcessing,
  onClose,
  onRefine,
  onRequest3D,
  onSubmitProduction
}: ArtworkDetailPanelProps) {
  const [refinePrompt, setRefinePrompt] = useState(task.prompt);
  const [refineCount, setRefineCount] = useState(1);
  const [show3DPreview, setShow3DPreview] = useState(false);
  const [productionForm, setProductionForm] = useState(initialProductionForm);

  const formattedPromptHint = useMemo(() => {
    if (!artwork.seed) return `源自任务：${task.createdAt}`;
    return `Seed ${artwork.seed} · ${task.createdAt}`;
  }, [artwork.seed, task.createdAt]);

  const handleRefineSubmit = (event: FormEvent) => {
    event.preventDefault();
    const cleanPrompt = refinePrompt.trim();
    if (!cleanPrompt) return;
    onRefine({ prompt: cleanPrompt, count: clampCount(refineCount) });
  };

  const handleProductionSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmitProduction(productionForm);
    setProductionForm(initialProductionForm);
  };

  return (
    <section className="artwork-detail">
      <div className="artwork-detail__header">
        <div>
          <h2>作品详情</h2>
          <p>{formattedPromptHint}</p>
        </div>
        <button type="button" className="ghost-btn" onClick={onClose}>
          返回列表
        </button>
      </div>

      <div className="artwork-detail__content">
        <div className="artwork-detail__visual">
          <img src={artwork.imageUrl} alt="已生成的潮玩设计" />
          <div className="artwork-detail__meta">
            <span>任务 Prompt</span>
            <p>{task.prompt}</p>
          </div>
        </div>

        <div className="artwork-detail__panels">
          <form className="detail-card" onSubmit={handleRefineSubmit}>
            <header>
              <h3>精修与微调</h3>
              <p>调整 Prompt 后再次生成，快速得到你想要的版本。</p>
            </header>
            <label className="detail-card__field">
              <span>Prompt 内容</span>
              <textarea
                value={refinePrompt}
                onChange={(event) => setRefinePrompt(event.target.value)}
                placeholder="在此调整 Prompt ..."
                rows={6}
              />
            </label>
            <div className="detail-card__actions">
              <label htmlFor="refine-count">
                <span>生成数量</span>
                <input
                  id="refine-count"
                  type="number"
                  min={1}
                  max={10}
                  value={refineCount}
                  onChange={(event) => setRefineCount(Number.parseInt(event.target.value, 10) || 1)}
                  disabled={isProcessing}
                />
              </label>
              <button type="submit" className="primary-btn" disabled={isProcessing}>
                {isProcessing ? "处理中..." : "提交精修"}
              </button>
            </div>
          </form>

          <div className="detail-card">
            <header>
              <h3>3D 模型预览</h3>
              <p>一键生成潮玩 3D 模型，后端实现完成后将在此呈现。</p>
            </header>
            <button
              type="button"
              className="primary-btn detail-card__cta"
              onClick={() => {
                setShow3DPreview(true);
                onRequest3D();
              }}
              disabled={isProcessing}
            >
              {show3DPreview ? "重新生成占位模型" : "转换为 3D 模型"}
            </button>
            {show3DPreview && (
              <div className="detail-card__preview">
                <img src="/assets/placeholder-3d.svg" alt="3D 模型占位图" />
                <p>实际模型生成完成后，将替换为真实渲染画面。</p>
              </div>
            )}
          </div>

          <form className="detail-card" onSubmit={handleProductionSubmit}>
            <header>
              <h3>生产问卷</h3>
              <p>填写潮玩量产意向，帮助我们评估工艺与排期。</p>
            </header>
            <div className="detail-card__grid">
              <label className="detail-card__field">
                <span>用途</span>
                <input
                  type="text"
                  value={productionForm.usage}
                  onChange={(event) => setProductionForm((prev) => ({ ...prev, usage: event.target.value }))}
                  placeholder="例如：品牌周边 / 展会赠品"
                />
              </label>
              <label className="detail-card__field">
                <span>材质偏好</span>
                <input
                  type="text"
                  value={productionForm.material}
                  onChange={(event) => setProductionForm((prev) => ({ ...prev, material: event.target.value }))}
                  placeholder="PVC / 树脂 / 搪胶 ..."
                />
              </label>
              <label className="detail-card__field">
                <span>计划数量</span>
                <input
                  type="text"
                  value={productionForm.quantity}
                  onChange={(event) => setProductionForm((prev) => ({ ...prev, quantity: event.target.value }))}
                  placeholder="如 200 件"
                />
              </label>
              <label className="detail-card__field">
                <span>目标成本</span>
                <input
                  type="text"
                  value={productionForm.budget}
                  onChange={(event) => setProductionForm((prev) => ({ ...prev, budget: event.target.value }))}
                  placeholder="例如：每件 120 元以内"
                />
              </label>
              <label className="detail-card__field">
                <span>期望交付时间</span>
                <input
                  type="text"
                  value={productionForm.timeline}
                  onChange={(event) => setProductionForm((prev) => ({ ...prev, timeline: event.target.value }))}
                  placeholder="如 2025 年 3 月"
                />
              </label>
              <label className="detail-card__field detail-card__field--full">
                <span>其他需求</span>
                <textarea
                  value={productionForm.notes}
                  onChange={(event) => setProductionForm((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder="请补充特殊工艺、包装需求或合作方式。"
                  rows={4}
                />
              </label>
            </div>
            <button type="submit" className="primary-btn detail-card__cta" disabled={isProcessing}>
              提交问卷
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export type { ProductionFormValues };
export default ArtworkDetailPanel;
