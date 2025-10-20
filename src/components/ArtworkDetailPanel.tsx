import { FormEvent, useMemo, useState } from "react";
import { useTranslation } from "../i18n";
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
  const { t } = useTranslation();
  const [refinePrompt, setRefinePrompt] = useState(task.prompt);
  const [refineCount, setRefineCount] = useState(1);
  const [show3DPreview, setShow3DPreview] = useState(false);
  const [productionForm, setProductionForm] = useState(initialProductionForm);

  const formattedPromptHint = useMemo(() => {
    if (!artwork.seed) return t("detail.source.generated", { date: task.createdAt });
    return t("detail.source.seed", { seed: artwork.seed, date: task.createdAt });
  }, [artwork.seed, task.createdAt, t]);

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
          <h2>{t("detail.title")}</h2>
          <p>{formattedPromptHint}</p>
        </div>
        <button type="button" className="ghost-btn" onClick={onClose}>
          {t("detail.back")}
        </button>
      </div>

      <div className="artwork-detail__content">
        <div className="artwork-detail__visual">
          <img src={artwork.imageUrl} alt={t("gallery.artwork.alt")} />
          <div className="artwork-detail__meta">
            <span>{t("detail.taskPrompt")}</span>
            <p>{task.prompt}</p>
          </div>
        </div>

        <div className="artwork-detail__panels">
          <form className="detail-card" onSubmit={handleRefineSubmit}>
            <header>
              <h3>{t("detail.refine.title")}</h3>
              <p>{t("detail.refine.subtitle")}</p>
            </header>
            <label className="detail-card__field">
              <span>{t("detail.refine.prompt")}</span>
              <textarea
                value={refinePrompt}
                onChange={(event) => setRefinePrompt(event.target.value)}
                placeholder={t("detail.refine.prompt")}
                rows={6}
              />
            </label>
            <div className="detail-card__actions">
              <label htmlFor="refine-count">
                <span>{t("detail.refine.count")}</span>
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
                {isProcessing ? t("composer.generate.processing") : t("detail.refine.submit")}
              </button>
            </div>
          </form>

          <div className="detail-card">
            <header>
              <h3>{t("detail.preview.title")}</h3>
              <p>{t("detail.preview.subtitle")}</p>
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
              {show3DPreview ? t("detail.preview.cta.repeat") : t("detail.preview.cta.initial")}
            </button>
            {show3DPreview && (
              <div className="detail-card__preview">
                <img src="/assets/placeholder-3d.svg" alt="3D placeholder" />
                <p>{t("detail.preview.placeholder")}</p>
              </div>
            )}
          </div>

          <form className="detail-card" onSubmit={handleProductionSubmit}>
            <header>
              <h3>{t("detail.production.title")}</h3>
              <p>{t("detail.production.subtitle")}</p>
            </header>
            <div className="detail-card__grid">
              <label className="detail-card__field">
                <span>{t("detail.production.usage")}</span>
                <input
                  type="text"
                  value={productionForm.usage}
                  onChange={(event) => setProductionForm((prev) => ({ ...prev, usage: event.target.value }))}
                  placeholder={t("detail.production.usage.placeholder")}
                />
              </label>
              <label className="detail-card__field">
                <span>{t("detail.production.material")}</span>
                <input
                  type="text"
                  value={productionForm.material}
                  onChange={(event) => setProductionForm((prev) => ({ ...prev, material: event.target.value }))}
                  placeholder={t("detail.production.material.placeholder")}
                />
              </label>
              <label className="detail-card__field">
                <span>{t("detail.production.quantity")}</span>
                <input
                  type="text"
                  value={productionForm.quantity}
                  onChange={(event) => setProductionForm((prev) => ({ ...prev, quantity: event.target.value }))}
                  placeholder={t("detail.production.quantity.placeholder")}
                />
              </label>
              <label className="detail-card__field">
                <span>{t("detail.production.budget")}</span>
                <input
                  type="text"
                  value={productionForm.budget}
                  onChange={(event) => setProductionForm((prev) => ({ ...prev, budget: event.target.value }))}
                  placeholder={t("detail.production.budget.placeholder")}
                />
              </label>
              <label className="detail-card__field">
                <span>{t("detail.production.timeline")}</span>
                <input
                  type="text"
                  value={productionForm.timeline}
                  onChange={(event) => setProductionForm((prev) => ({ ...prev, timeline: event.target.value }))}
                  placeholder={t("detail.production.timeline.placeholder")}
                />
              </label>
              <label className="detail-card__field detail-card__field--full">
                <span>{t("detail.production.notes")}</span>
                <textarea
                  value={productionForm.notes}
                  onChange={(event) => setProductionForm((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder={t("detail.production.notes.placeholder")}
                  rows={4}
                />
              </label>
            </div>
            <button type="submit" className="primary-btn detail-card__cta" disabled={isProcessing}>
              {t("detail.production.submit")}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export type { ProductionFormValues };
export default ArtworkDetailPanel;
