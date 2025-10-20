import { useTranslation } from "../i18n";
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
  const { t } = useTranslation();
  const displayPresets = [...customPresets, ...systemPresets];
  const description =
    category === "style"
      ? t("preset.section.styleDescription")
      : t("preset.section.materialDescription");

  return (
    <section id={sectionId} className="preset-section">
      <div className="preset-section__header">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <button type="button" className="ghost-btn" onClick={onCreate}>
          {t("preset.section.create")}
        </button>
      </div>

      {displayPresets.length === 0 ? (
        <div className="preset-section__empty">
          <p>{t("preset.section.empty")}</p>
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
