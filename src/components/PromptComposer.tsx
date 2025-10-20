import { FormEvent } from "react";
import { useTranslation } from "../i18n";
import type { Preset } from "../types";
import "./PromptComposer.css";

interface PromptComposerProps {
  sectionId?: string;
  prompt: string;
  onPromptChange: (value: string) => void;
  selectedPresets: Preset[];
  onClearPresets: () => void;
  onGenerate: () => void;
  generationCount: number;
  onGenerationCountChange: (value: number) => void;
  isGenerating: boolean;
  maxLength?: number;
}

function PromptComposer({
  sectionId,
  prompt,
  onPromptChange,
  selectedPresets,
  onClearPresets,
  onGenerate,
  generationCount,
  onGenerationCountChange,
  isGenerating,
  maxLength = 500
}: PromptComposerProps) {
  const { t, locale } = useTranslation();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onGenerate();
  };

  return (
    <section id={sectionId} className="prompt-composer">
      <form className="prompt-form" onSubmit={handleSubmit}>
        <div>
          <h2>{t("composer.title")}</h2>
          <p>{t("composer.subtitle", { maxLength })}</p>
        </div>

        <label className="prompt-form__textarea">
          <textarea
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value.slice(0, maxLength))}
            placeholder={t("composer.placeholder")}
          />
          <span className="prompt-form__counter">
            {t("prompt.counter", { current: prompt.length, max: maxLength })}
          </span>
        </label>

        <div className="prompt-form__chips">
          {selectedPresets.map((preset) => {
            const displayName = preset.translations?.name?.[locale] ?? preset.name;
            return (
              <span key={preset.id} className="preset-chip">
                {displayName}
              </span>
            );
          })}

          {selectedPresets.length > 0 && (
            <button type="button" className="ghost-btn" onClick={onClearPresets}>
              {t("composer.clear")}
            </button>
          )}
        </div>

        <div className="prompt-form__actions">
          <label className="prompt-form__quantity" htmlFor="generation-count">
            <span>{t("composer.count")}</span>
            <input
              id="generation-count"
              type="number"
              min={1}
              max={10}
              value={generationCount}
              disabled={isGenerating}
              onChange={(event) => {
                const nextValue = Number.parseInt(event.target.value, 10);
                if (Number.isNaN(nextValue)) return;
                onGenerationCountChange(nextValue);
              }}
            />
          </label>
          <button type="submit" className="primary-btn" disabled={isGenerating}>
            {isGenerating ? t("composer.generate.processing") : t("composer.generate.start")}
          </button>
          <span className="prompt-form__hint">{t("composer.generate.hint")}</span>
        </div>
      </form>
    </section>
  );
}

export default PromptComposer;
