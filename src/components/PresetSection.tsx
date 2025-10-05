import type { Preset } from "../types";
import PresetCard from "./PresetCard";
import "./PresetSection.css";

interface PresetSectionProps {
  sectionId: string;
  title: string;
  category: "style" | "material";
  systemPresets: Preset[];
  customPresets: Preset[];
  selectedIds: Set<string>;
  onToggle: (preset: Preset) => void;
  onFavorite: (preset: Preset) => void;
  onCreate: () => void;
  onEdit: (preset: Preset) => void;
  onDelete: (preset: Preset) => void;
}

function PresetSection({
  sectionId,
  title,
  category,
  systemPresets,
  customPresets,
  selectedIds,
  onToggle,
  onFavorite,
  onCreate,
  onEdit,
  onDelete
}: PresetSectionProps) {
  const displayPresets = [...customPresets, ...systemPresets];
  const description =
    category === "style"
      ? "点击喜欢的潮玩风格即可追加到提示词，支持与材质组合使用"
      : "为造型选择不同的生产材质，和风格预设叠加即可快速微调质感";

  return (
    <section id={sectionId} className="preset-section">
      <div className="preset-section__header">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <button type="button" className="ghost-btn" onClick={onCreate}>
          新建预设
        </button>
      </div>

      {displayPresets.length === 0 ? (
        <div className="preset-section__empty">
          <p>即将提供更多预设内容，您可以先创建属于自己的风格或材质。</p>
        </div>
      ) : (
        <div className="preset-grid">
          {displayPresets.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              selected={selectedIds.has(preset.id)}
              onToggle={onToggle}
              onFavorite={onFavorite}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default PresetSection;
