import { useTranslation } from "../i18n";
import type { Preset } from "../types";
import "./PresetCard.css";

interface PresetCardProps {
  preset: Preset;
  selected: boolean;
  onToggle: (preset: Preset) => void;
  onEdit?: (preset: Preset) => void;
  onDelete?: (preset: Preset) => void;
  onFavorite?: (preset: Preset) => void;
}

function PresetCard({ preset, selected, onToggle, onEdit, onDelete, onFavorite }: PresetCardProps) {
  const { t, locale } = useTranslation();
  const displayName = preset.translations?.name?.[locale] ?? preset.name;
  const displayPrompt = preset.translations?.prompt?.[locale] ?? preset.prompt;

  return (
    <div className={`preset-card ${selected ? "preset-card--selected" : ""}`}>
      <button type="button" className="preset-card__select" onClick={() => onToggle(preset)}>
        <img src={preset.thumbnail} alt={displayName} />
        <div className="preset-card__content">
          <div className="preset-card__heading">
            <div className="preset-card__name">{displayName}</div>
            <span
              className={
                preset.isSystem ? "preset-card__badge preset-card__badge--system" : "preset-card__badge"
              }
            >
              {preset.isSystem ? t("preset.card.system") : t("preset.card.custom")}
            </span>
          </div>
          <p className="preset-card__prompt" title={displayPrompt}>
            {displayPrompt}
          </p>
        </div>
      </button>
      <div className="preset-card__actions">
        {preset.isSystem ? (
          <button
            type="button"
            className="icon-btn"
            onClick={() => onFavorite?.(preset)}
            title={t("preset.card.favorite")}
          >
            ☆
          </button>
        ) : (
          <>
            <button
              type="button"
              className="icon-btn"
              onClick={() => onEdit?.(preset)}
              title={t("preset.card.edit")}
            >
              ✎
            </button>
            <button
              type="button"
              className="icon-btn icon-btn--danger"
              onClick={() => onDelete?.(preset)}
              title={t("preset.card.delete")}
            >
              ⌫
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default PresetCard;
