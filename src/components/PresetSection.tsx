import { useState } from "react";
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
  const [activeTab, setActiveTab] = useState<"system" | "custom">("system");

  const currentPresets = activeTab === "system" ? systemPresets : customPresets;
  const descriptions = {
    system:
      category === "style"
        ? "官方精选风格，点击可快速组合"
        : "官方推荐材质，快速组合同一模型的不同质感",
    custom:
      category === "style"
        ? "我的风格预设可编辑、删除，并支持无限扩展"
        : "我的材质预设可编辑、删除，并支持无限扩展"
  } as const;

  return (
    <section id={sectionId} className="preset-section">
      <div className="preset-section__header">
        <div>
          <h3>{title}</h3>
          <p>{descriptions[activeTab]}</p>
        </div>
        <button type="button" className="ghost-btn" onClick={onCreate}>
          新建预设
        </button>
      </div>

      <div className="preset-section__tabs">
        <button
          type="button"
          className={activeTab === "system" ? "preset-tab preset-tab--active" : "preset-tab"}
          onClick={() => setActiveTab("system")}
        >
          系统预设
        </button>
        <button
          type="button"
          className={activeTab === "custom" ? "preset-tab preset-tab--active" : "preset-tab"}
          onClick={() => setActiveTab("custom")}
        >
          我的预设
        </button>
      </div>

      {currentPresets.length === 0 ? (
        <div className="preset-section__empty">
          <p>
            {activeTab === "system"
              ? "即将提供更多官方内容，敬请期待。"
              : "还没有收藏或新建预设，点击右上角“新建预设”进行创建。"}
          </p>
        </div>
      ) : (
        <div className="preset-grid">
          {currentPresets.map((preset) => (
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
