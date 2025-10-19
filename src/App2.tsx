import { useEffect, useMemo, useState } from "react";
import AppHeader from "./components/AppHeader";
import PromptComposer from "./components/PromptComposer";
import PresetSection from "./components/PresetSection";
import GenerationGallery from "./components/GenerationGallery";
import HistoryPanel from "./components/HistoryPanel";
import Modal from "./components/Modal";
import PresetEditorForm from "./components/PresetEditorForm";
import {
  SYSTEM_MATERIAL_PRESETS,
  SYSTEM_STYLE_PRESETS
} from "./constants/presets";
import type { GeneratedArtwork, GenerationTask, Preset } from "./types";
import "./styles/app.css";

const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

const PLACEHOLDER_IMAGES = [
  "https://dummyimage.com/512x640/111827/ffffff&text=Toy+1",
  "https://dummyimage.com/512x640/0f172a/ffffff&text=Toy+2",
  "https://dummyimage.com/512x640/1f2937/ffffff&text=Toy+3",
  "https://dummyimage.com/512x640/111827/ffffff&text=Toy+4"
];

const seedDreamApiUrl = (import.meta.env.VITE_SEEDDREAM_API_URL || "https://ark.cn-beijing.volces.com/api/v3/images/generations").trim();
const seedDreamApiKey = import.meta.env.VITE_SEEDDREAM_API_KEY?.trim();
const seedDreamModel = (import.meta.env.VITE_SEEDDREAM_MODEL || "doubao-seedream-4-0-250828").trim();
const seedDreamConfigured = Boolean(seedDreamApiUrl && seedDreamApiKey);

const ensureDataUrl = (value: unknown): string | undefined => {
  if (typeof value !== "string" || value.length === 0) {
    return undefined;
  }
  return value.startsWith("data:") ? value : `data:image/png;base64,${value}`;
};

const normalizeSeedDreamArtworks = (payload: unknown, taskId: string): GeneratedArtwork[] => {
  if (!payload || typeof payload !== "object") {
    console.warn("[SeedDream] empty payload", payload);
    return [];
  }

  const container = payload as Record<string, unknown>;
  const candidateArrays: unknown[][] = [];

  if (Array.isArray(container.data)) candidateArrays.push(container.data as unknown[]);
  if (Array.isArray(container.images)) candidateArrays.push(container.images as unknown[]);
  if (Array.isArray(container.results)) candidateArrays.push(container.results as unknown[]);
  if (Array.isArray(payload)) candidateArrays.push(payload as unknown[]);

  const items = candidateArrays.find((arr) => arr.length > 0) ?? [];

  return items.reduce<GeneratedArtwork[]>((acc, item, index) => {
    if (!item || typeof item !== "object") {
      console.warn("[SeedDream] unexpected item type", { index, item });
      return acc;
    }

    const record = item as Record<string, unknown>;
    const media = typeof record.image === "object" && record.image !== null ? (record.image as Record<string, unknown>) : null;
    const meta = typeof record.meta === "object" && record.meta !== null ? (record.meta as Record<string, unknown>) : null;

    const rawUrl =
      (typeof record.url === "string" && record.url) ||
      (typeof record.imageUrl === "string" && record.imageUrl) ||
      (typeof record.image_url === "string" && record.image_url) ||
      (typeof record.cdn_url === "string" && record.cdn_url) ||
      (media && typeof media.url === "string" ? media.url : undefined);

    const base64 =
      (typeof record.base64 === "string" && record.base64) ||
      (typeof record.image_base64 === "string" && record.image_base64) ||
      (media && typeof media.base64 === "string" ? media.base64 : undefined);

    const imageUrl = rawUrl?.trim() || ensureDataUrl(base64);

    if (!imageUrl) {
      console.warn("[SeedDream] missing image source", { index, record });
      return acc;
    }

    const seedCandidate = record.seed ?? media?.seed ?? meta?.seed;
    const sizeCandidate = record.size ?? meta?.size ?? record.resolution ?? record.dimensions;

    const artwork: GeneratedArtwork = {
      id: typeof record.id === "string" && record.id.length > 0 ? record.id : `${taskId}-${index}`,
      imageUrl
    };

    if (typeof seedCandidate === "number") {
      artwork.seed = String(seedCandidate);
    } else if (typeof seedCandidate === "string" && seedCandidate.length > 0) {
      artwork.seed = seedCandidate;
    }

    if (typeof sizeCandidate === "string" && sizeCandidate.length > 0) {
      artwork.sizeLabel = sizeCandidate;
    }

    acc.push(artwork);
    return acc;
  }, []);
};

const simulateSeedDreamRequest = async (taskId: string, prompt: string) => {
  console.info("[SeedDream] mock request start", { taskId, prompt });
  await new Promise((resolve) => setTimeout(resolve, 1800));
  const artworks = PLACEHOLDER_IMAGES.map((url, index) => ({
    id: `${taskId}-${index}`,
    imageUrl: url,
    seed: `SD-${Math.floor(Math.random() * 100000)}`,
    sizeLabel: "512x640"
  }));
  console.info("[SeedDream] mock response", { taskId, prompt, artworks });
  return artworks;
};

const requestSeedDream = async (taskId: string, prompt: string) => {
  if (!seedDreamConfigured || !seedDreamApiKey) {
    throw new Error("SeedDream 接口未配置");
  }

  const requestBody = {
    model: seedDreamModel,
    prompt,
    response_format: "url",
    size: "2K",
    sequential_image_generation: "auto",
    sequential_image_generation_options: {
      max_images: 4
    },
    watermark: true
  };

  console.info("[SeedDream] request start", { taskId, seedDreamApiUrl, body: requestBody });

  const response = await fetch(seedDreamApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${seedDreamApiKey}`
    },
    body: JSON.stringify(requestBody)
  });

  console.info("[SeedDream] response status", response.status);

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    console.error("[SeedDream] request failed", { status: response.status, errorText });
    throw new Error(`SeedDream 请求失败: ${response.status}`);
  }

  const payload = await response.json().catch((error: unknown) => {
    console.error("[SeedDream] parse json failed", error);
    throw error;
  });

  console.info("[SeedDream] response payload", payload);

  const artworks = normalizeSeedDreamArtworks(payload, taskId);
  console.info("[SeedDream] parsed artworks", artworks);

  if (artworks.length === 0) {
    throw new Error("SeedDream 返回为空");
  }

  return artworks;
};

interface PresetModalState {
  open: boolean;
  category: "style" | "material";
  editingPreset?: Preset;
}

function App() {
  const [promptText, setPromptText] = useState("");
  const [generationCount, setGenerationCount] = useState(1);
  const [customStylePresets, setCustomStylePresets] = useState<Preset[]>([]);
  const [customMaterialPresets, setCustomMaterialPresets] = useState<Preset[]>([]);
  const [selectedPresetIds, setSelectedPresetIds] = useState<string[]>([]);
  const [generationTasks, setGenerationTasks] = useState<GenerationTask[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("准备中");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [modalState, setModalState] = useState<PresetModalState | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const allPresets = useMemo(() => {
    return [
      ...SYSTEM_STYLE_PRESETS,
      ...customStylePresets,
      ...SYSTEM_MATERIAL_PRESETS,
      ...customMaterialPresets
    ];
  }, [customMaterialPresets, customStylePresets]);

  const selectedPresets = useMemo(() => {
    const presetMap = new Map(allPresets.map((preset) => [preset.id, preset]));
    return selectedPresetIds
      .map((id) => presetMap.get(id))
      .filter((item): item is Preset => Boolean(item));
  }, [allPresets, selectedPresetIds]);

  const activeTask = generationTasks.find((task) => task.id === activeTaskId) ?? generationTasks[0];
  const activeArtworks = activeTask?.results ?? [];

  const handleTogglePreset = (preset: Preset) => {
    setSelectedPresetIds((prev) =>
      prev.includes(preset.id) ? prev.filter((id) => id !== preset.id) : [...prev, preset.id]
    );
  };

  const handleFavoritePreset = (preset: Preset) => {
    const collection = preset.category === "style" ? customStylePresets : customMaterialPresets;
    const setter = preset.category === "style" ? setCustomStylePresets : setCustomMaterialPresets;
    const exists = collection.some((item) => item.prompt === preset.prompt && item.name === preset.name);

    if (exists) {
      setToastMessage("该预设已收藏");
      return;
    }

    const newPreset: Preset = {
      ...preset,
      id: `${preset.id}-${Date.now()}`,
      isSystem: false
    };
    setter([newPreset, ...collection]);
    setModalState(null);
    setToastMessage("已收藏到我的预设");
  };

  const handleClearPresets = () => {
    setSelectedPresetIds([]);
  };

  const ensureActiveTask = (taskId: string) => {
    setActiveTaskId(taskId);
  };

  const handleSelectHistoryTask = (task: GenerationTask) => {
    ensureActiveTask(task.id);
    setToastMessage(`已切换到 ${task.createdAt} 的结果`);
  };

  const handleDeletePreset = (preset: Preset) => {
    const setter = preset.category === "style" ? setCustomStylePresets : setCustomMaterialPresets;
    setter((prev) => prev.filter((item) => item.id !== preset.id));
    setSelectedPresetIds((prev) => prev.filter((id) => id !== preset.id));
    setToastMessage("预设已删除");
  };

  const handleSavePreset = (values: { name: string; prompt: string; thumbnail: string }) => {
    if (!modalState) return;

    const { category, editingPreset } = modalState;
    const setter = category === "style" ? setCustomStylePresets : setCustomMaterialPresets;

    const newPreset: Preset = {
      id: editingPreset ? editingPreset.id : `custom-${category}-${Date.now()}`,
      name: values.name,
      prompt: values.prompt,
      thumbnail: values.thumbnail,
      category,
      isSystem: false
    };

    setter((prev) => {
      if (editingPreset) {
        return prev.map((item) => (item.id === editingPreset.id ? newPreset : item));
      }
      return [newPreset, ...prev];
    });

    setModalState(null);
    setToastMessage(editingPreset ? "预设已更新" : "预设已创建");
  };

  const handleGenerate = async () => {
    if (!promptText.trim() && selectedPresets.length === 0) {
      alert("请先输入Prompt或至少选择一个预设");
      return;
    }

    const mergedPrompt = [promptText.trim(), ...selectedPresets.map((preset) => preset.prompt)]
      .filter(Boolean)
      .join(", ");

    console.info("[SeedDream] prepare payload", { mergedPrompt, selectedPresets });

    const taskId = uuid();
    const createdAt = new Intl.DateTimeFormat("zh-CN", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(new Date());

    const pendingTask: GenerationTask = {
      id: taskId,
      prompt: mergedPrompt,
      createdAt,
      status: "pending",
      results: []
    };

    setIsGenerating(true);
    const status = seedDreamConfigured ? "SeedDream 4.0 正在生成，请稍候..." : "未配置 SeedDream，使用占位图展示";
    setStatusMessage(status);
    setToastMessage(status);
    setGenerationTasks((prev) => [pendingTask, ...prev]);
    ensureActiveTask(taskId);

    const generator = seedDreamConfigured ? requestSeedDream : simulateSeedDreamRequest;

    try {
      const artworks = await generator(taskId, mergedPrompt);
      setGenerationTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status: "success",
                results: artworks
              }
            : task
        )
      );
      const successMessage = seedDreamConfigured ? "生成完成，可在右侧查看记录" : "占位图生成完成";
      setStatusMessage(successMessage);
      setToastMessage(successMessage);
    } catch (error) {
      console.error("[SeedDream] generation failed", error);
      const fallbackArtworks = await simulateSeedDreamRequest(taskId, mergedPrompt);
      setGenerationTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status: "error",
                results: fallbackArtworks
              }
            : task
        )
      );
      const errorMessage =
        error instanceof Error ? `生成失败：${error.message}` : "生成失败，请稍后重试";
      setStatusMessage(errorMessage);
      setToastMessage(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadArtwork = async (artwork: { id: string; imageUrl: string }) => {
    const link = document.createElement("a");
    link.href = artwork.imageUrl;
    link.download = `${artwork.id}.png`;
    document.body.append(link);
    link.click();
    link.remove();
  };

  const handleCopyLink = async (artwork: { imageUrl: string }) => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(artwork.imageUrl);
      setToastMessage("链接已复制");
    } else {
      prompt("复制以下链接", artwork.imageUrl);
    }
  };

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="app-content">
        <div className="app-main">
          <PromptComposer
            sectionId="composer"
            prompt={promptText}
            onPromptChange={setPromptText}
            selectedPresets={selectedPresets}
            onClearPresets={handleClearPresets}
            onGenerate={handleGenerate}
            generationCount={generationCount}
            onGenerationCountChange={(value) =>
              setGenerationCount(Math.min(10, Math.max(1, Math.round(value))))
            }
            isGenerating={isGenerating}
          />

          <PresetSection
            sectionId="style-presets"
            title="选择潮玩风格"
            category="style"
            systemPresets={SYSTEM_STYLE_PRESETS}
            customPresets={customStylePresets}
            selectedIds={new Set(selectedPresetIds)}
            onToggle={handleTogglePreset}
            onFavorite={handleFavoritePreset}
            onCreate={() => setModalState({ open: true, category: "style" })}
            onEdit={(preset) => setModalState({ open: true, category: "style", editingPreset: preset })}
            onDelete={handleDeletePreset}
          />

          <PresetSection
            sectionId="material-presets"
            title="选择生产材质"
            category="material"
            systemPresets={SYSTEM_MATERIAL_PRESETS}
            customPresets={customMaterialPresets}
            selectedIds={new Set(selectedPresetIds)}
            onToggle={handleTogglePreset}
            onFavorite={handleFavoritePreset}
            onCreate={() => setModalState({ open: true, category: "material" })}
            onEdit={(preset) => setModalState({ open: true, category: "material", editingPreset: preset })}
            onDelete={handleDeletePreset}
          />

          <GenerationGallery
            sectionId="gallery"
            artworks={activeArtworks}
            isGenerating={isGenerating}
            statusMessage={statusMessage}
            onDownload={handleDownloadArtwork}
            onCopyLink={handleCopyLink}
            onSelect={(artwork) => setToastMessage(`预览作品 ${artwork.id}`)}
          />
        </div>
        <HistoryPanel sectionId="history" tasks={generationTasks} onSelectTask={handleSelectHistoryTask} />
      </main>

      {modalState?.open && (
        <Modal
          open
          title={modalState.editingPreset ? "编辑预设" : "新建预设"}
          onClose={() => setModalState(null)}
        >
          <PresetEditorForm
            initialValue={modalState.editingPreset ?? {}}
            onCancel={() => setModalState(null)}
            onSubmit={handleSavePreset}
          />
        </Modal>
      )}
      {toastMessage && <div className="status-toast">{toastMessage}</div>}
    </div>
  );
}

export default App;
