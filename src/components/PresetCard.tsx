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

function PresetCard({
  preset,
  selected,
  onToggle,
  onEdit,
  onDelete,
  onFavorite
}: PresetCardProps) {
  return (
    <div className={`preset-card ${selected ? "preset-card--selected" : ""}`}>
      <button type="button" className="preset-card__select" onClick={() => onToggle(preset)}>
        <img src={preset.thumbnail} alt={preset.name} />
        <div className="preset-card__content">
          <div className="preset-card__heading">
            <div className="preset-card__name">{preset.name}</div>
            <span
              className={
                preset.isSystem ? "preset-card__badge preset-card__badge--system" : "preset-card__badge"
              }
            >
              {preset.isSystem ? "系统" : "自定义"}
            </span>
          </div>
          <p className="preset-card__prompt" title={preset.prompt}>
            {preset.prompt}
          </p>
        </div>
      </button>
      <div className="preset-card__actions">
        {preset.isSystem ? (
          <button
            type="button"
            className="icon-btn"
            onClick={() => onFavorite?.(preset)}
            title="收藏到我的预设"
          >
            ☆
          </button>
        ) : (
          <>
            <button
              type="button"
              className="icon-btn"
              onClick={() => onEdit?.(preset)}
              title="编辑预设"
            >
              ✎
            </button>
            <button
              type="button"
              className="icon-btn icon-btn--danger"
              onClick={() => onDelete?.(preset)}
              title="删除预设"
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
