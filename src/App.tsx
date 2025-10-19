import { useEffect, useMemo, useState } from "react";
import AppHeader from "./components/AppHeader";
import PromptComposer from "./components/PromptComposer";
import PresetSection from "./components/PresetSection";
import GenerationGallery from "./components/GenerationGallery";
import HistoryPanel from "./components/HistoryPanel";
import Modal from "./components/Modal";
import PresetEditorForm from "./components/PresetEditorForm";
import ArtworkDetailPanel, { type ProductionFormValues } from "./components/ArtworkDetailPanel";
import {
  SYSTEM_MATERIAL_PRESETS,
  SYSTEM_STYLE_PRESETS
} from "./constants/presets";
import type { GeneratedArtwork, GenerationTask, Preset } from "./types";
import "./styles/app.css";

const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
const clampGenerationCount = (value: number) => Math.min(10, Math.max(1, Math.round(value)));
const DETAIL_STORAGE_PREFIX = "midas-shiny-artwork-";
const DETAIL_HASH_PREFIX = "artwork";

interface ArtworkDetailSnapshot {
  artwork: GeneratedArtwork;
  task: GenerationTask;
}

const getDetailStorageKey = (artworkId: string) => `${DETAIL_STORAGE_PREFIX}${artworkId}`;

const readDetailSnapshotFromLocation = (): ArtworkDetailSnapshot | null => {
  const hash = window.location.hash;
  if (!hash.startsWith(`#${DETAIL_HASH_PREFIX}`)) {
    return null;
  }

  const rawQuery = hash.slice(DETAIL_HASH_PREFIX.length + 1); // remove #artwork
  const search = rawQuery.startsWith("?") ? rawQuery.slice(1) : rawQuery;
  const params = new URLSearchParams(search);
  const artworkId = params.get("artworkId");
  if (!artworkId) return null;

  const storageKey = getDetailStorageKey(artworkId);
  let stored: string | null = null;
  try {
    stored = sessionStorage.getItem(storageKey) ?? localStorage.getItem(storageKey);
  } catch (error) {
    console.warn("[Detail] read storage failed", error);
  }
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored) as ArtworkDetailSnapshot;
    return parsed && parsed.artwork && parsed.task ? parsed : null;
  } catch (error) {
    console.warn("[Detail] parse snapshot failed", error);
    return null;
  }
};

const seedDreamApiUrl = (import.meta.env.VITE_SEEDDREAM_API_URL || "https://ark.cn-beijing.volces.com/api/v3/images/generations").trim();
const seedDreamApiKey = import.meta.env.VITE_SEEDDREAM_API_KEY?.trim();
const seedDreamModel = (import.meta.env.VITE_SEEDDREAM_MODEL || "doubao-seedream-4-0-250828").trim();
const seedDreamProxyPath = import.meta.env.VITE_SEEDDREAM_PROXY_PATH || "/seed-dream";
const useSeedDreamProxy = Boolean(import.meta.env.DEV && seedDreamProxyPath);
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

  const requestUrl = useSeedDreamProxy ? seedDreamProxyPath : seedDreamApiUrl;
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (!useSeedDreamProxy) {
    headers.Authorization = `Bearer ${seedDreamApiKey}`;
  }

  console.info("[SeedDream] request start", { taskId, requestUrl, body: requestBody, useSeedDreamProxy });

  const response = await fetch(requestUrl, {
    method: "POST",
    headers,
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
  const [detailSnapshot, setDetailSnapshot] = useState<ArtworkDetailSnapshot | null>(() =>
    readDetailSnapshotFromLocation()
  );

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    const handleHashChange = () => {
      setDetailSnapshot(readDetailSnapshotFromLocation());
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

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
  const firstTaskWithResults = generationTasks.find((task) => task.results.length > 0);
  const galleryTask = activeArtworks.length > 0 ? activeTask : firstTaskWithResults;
  const galleryArtworks = galleryTask?.results ?? [];
  const shouldShowGallery = galleryArtworks.length > 0;

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

  const startGeneration = async ({
    prompt,
    requestedCount,
    origin,
    sourceArtworkId
  }: {
    prompt: string;
    requestedCount?: number;
    origin?: string;
    sourceArtworkId?: string;
  }) => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      alert("请先输入 Prompt");
      return;
    }

    const count = clampGenerationCount(requestedCount ?? generationCount);
    const taskId = uuid();
    const createdAt = new Intl.DateTimeFormat("zh-CN", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(new Date());

    const pendingTask: GenerationTask = {
      id: taskId,
      prompt: cleanPrompt,
      createdAt,
      status: "pending",
      results: [],
      origin,
      requestedCount: count,
      sourceArtworkId
    };

    setIsGenerating(true);
    const initialStatus = seedDreamConfigured
      ? `SeedDream 4.0 正在生成（${count} 组并行）...`
      : "未配置 SeedDream，使用占位图展示";
    setStatusMessage(initialStatus);
    setToastMessage(initialStatus);
    setGenerationTasks((prev) => [pendingTask, ...prev]);
    ensureActiveTask(taskId);

    if (!seedDreamConfigured) {
      const message = "未配置 SeedDream 接口";
      setStatusMessage(message);
      setToastMessage(message);
      setGenerationTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status: "error"
              }
            : task
        )
      );
      setIsGenerating(false);
      return;
    }

    try {
      const requests = Array.from({ length: count }, (_, index) =>
        requestSeedDream(`${taskId}-batch${index}`, cleanPrompt)
      );
      const settled = await Promise.allSettled(requests);

      const aggregated: GeneratedArtwork[] = [];
      let failureCount = 0;

      settled.forEach((result, batchIndex) => {
        if (result.status === "fulfilled") {
          result.value.forEach((artwork, artworkIndex) => {
            const baseId =
              typeof artwork.id === "string" && artwork.id.length > 0
                ? artwork.id
                : `${taskId}-art-${batchIndex}-${artworkIndex}`;
            aggregated.push({
              ...artwork,
              id: `${taskId}-b${batchIndex}-${baseId}`
            });
          });
        } else {
          failureCount += 1;
          console.error("[SeedDream] batch request failed", result.reason);
        }
      });

      setGenerationTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status: aggregated.length > 0 ? "success" : "error",
                results: aggregated
              }
            : task
        )
      );

      let message: string;
      if (aggregated.length === 0) {
        message = "生成失败，请稍后重试";
      } else if (failureCount > 0) {
        message = `部分成功：获得 ${aggregated.length} 张作品，${failureCount} 组请求失败`;
      } else {
        message = `生成完成，共获得 ${aggregated.length} 张作品`;
      }
      setStatusMessage(message);
      setToastMessage(message);
    } catch (error) {
      console.error("[SeedDream] generation failed", error);
      const errorMessage =
        error instanceof Error ? `生成失败：${error.message}` : "生成失败，请稍后重试";
      setGenerationTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status: "error",
                results: []
              }
            : task
        )
      );
      setStatusMessage(errorMessage);
      setToastMessage(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    if (!promptText.trim() && selectedPresets.length === 0) {
      alert("请先输入 Prompt 或至少选择一个预设");
      return;
    }

    const mergedPrompt = [promptText.trim(), ...selectedPresets.map((preset) => preset.prompt)]
      .filter(Boolean)
      .join(", ");

    console.info("[SeedDream] prepare payload", { mergedPrompt, selectedPresets });

    await startGeneration({ prompt: mergedPrompt });
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

  const handleOpenArtworkDetail = (artwork: GeneratedArtwork, task: GenerationTask | undefined) => {
    if (!task) return;
    const snapshot: ArtworkDetailSnapshot = {
      artwork,
      task: {
        id: task.id,
        prompt: task.prompt,
        createdAt: task.createdAt,
        status: task.status,
        results: [artwork],
        requestedCount: task.requestedCount,
        origin: task.origin,
        sourceArtworkId: task.sourceArtworkId
      }
    };
    const storageKey = getDetailStorageKey(artwork.id);
    const serialized = JSON.stringify(snapshot);
    try {
      sessionStorage.setItem(storageKey, serialized);
    } catch (error) {
      console.warn("[Detail] sessionStorage set failed", error);
    }
    try {
      localStorage.setItem(storageKey, serialized);
    } catch (error) {
      console.warn("[Detail] localStorage set failed", error);
    }
    const detailUrl = new URL(window.location.href);
    detailUrl.hash = `${DETAIL_HASH_PREFIX}?artworkId=${encodeURIComponent(artwork.id)}`;
    window.open(detailUrl.toString(), "_blank", "noopener,noreferrer");
  };

  const handleRefineFromDetail = async ({ prompt, count }: { prompt: string; count: number }) => {
    if (!detailSnapshot) return;
    await startGeneration({
      prompt,
      requestedCount: count,
      origin: `精修 ${detailSnapshot.artwork.id}`,
      sourceArtworkId: detailSnapshot.artwork.id
    });
  };

  const handleRequest3DMock = () => {
    setToastMessage("3D 模型占位图已生成，后端能力上线后将展示真实模型");
  };

  const handleSubmitProductionForm = (payload: ProductionFormValues) => {
    console.info("[Production Questionnaire]", {
      artworkId: detailSnapshot?.artwork.id,
      ...payload
    });
    setToastMessage("问卷已提交，我们将尽快与您联系");
  };

  const clearStoredDetailSnapshot = () => {
    if (!detailSnapshot) return;
    const storageKey = getDetailStorageKey(detailSnapshot.artwork.id);
    try {
      sessionStorage.removeItem(storageKey);
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn("[Detail] clear storage failed", error);
    }
  };

  const handleExitDetailPage = () => {
    if (!detailSnapshot) return;
    clearStoredDetailSnapshot();
    if (window.opener) {
      window.close();
      return;
    }
    window.location.hash = "";
    setDetailSnapshot(null);
  };

  if (detailSnapshot) {
    return (
      <div className="app-shell">
        <AppHeader />
        <main className="app-content">
          <div className="app-main">
            <ArtworkDetailPanel
              artwork={detailSnapshot.artwork}
              task={detailSnapshot.task}
              isProcessing={isGenerating}
              onClose={handleExitDetailPage}
              onRefine={handleRefineFromDetail}
              onRequest3D={handleRequest3DMock}
              onSubmitProduction={handleSubmitProductionForm}
            />
          </div>
        </main>
        {toastMessage && <div className="status-toast">{toastMessage}</div>}
      </div>
    );
  }

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
            onGenerationCountChange={(value) => setGenerationCount(clampGenerationCount(value))}
            isGenerating={isGenerating}
          />

          {shouldShowGallery && (
            <GenerationGallery
              sectionId="gallery"
              artworks={galleryArtworks}
              isGenerating={isGenerating}
              statusMessage={statusMessage}
              onDownload={handleDownloadArtwork}
              onCopyLink={handleCopyLink}
              onSelect={(artwork) => handleOpenArtworkDetail(artwork, galleryTask)}
            />
          )}

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
