import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Locale = "en" | "zh";

type TranslationValue = string | ((params?: Record<string, string | number>) => string);
type TranslationDictionary = Record<string, TranslationValue>;

const translations: Record<Locale, TranslationDictionary> = {
  en: {
    "app.subtitle": "AI Toy Creation Studio",
    "nav.composer": "Prompt Input",
    "nav.stylePresets": "Style Presets",
    "nav.materialPresets": "Materials",
    "nav.history": "History",
    "cta.start": "Start Now",
    "language.english": "English",
    "language.chinese": "中文",
    "language.toggle": "Switch language",
    "composer.title": "Describe Your Idea",
    "composer.subtitle":
      "Supports mixed Chinese and English prompts. Include character traits, visual details, or ambience. Max {maxLength} characters.",
    "composer.placeholder":
      "e.g. Cyberpunk rabbit toy in a futuristic city, holographic ears, metallic outfit, neon night lighting",
    "composer.clear": "Clear Presets",
    "composer.count": "Images",
    "composer.generate.start": "Generate",
    "composer.generate.processing": "Generating…",
    "composer.generate.hint": "Button is disabled while generating, usually within 10 seconds.",
    "preset.section.styleTitle": "Select Toy Style",
    "preset.section.materialTitle": "Select Manufacturing Material",
    "preset.section.styleDescription":
      "Tap a style to add its prompt to your request. Mix with materials for more control.",
    "preset.section.materialDescription":
      "Choose materials to match your design. Combine with styles to fine-tune the result.",
    "preset.section.create": "Create Preset",
    "preset.section.empty":
      "More presets are on the way. You can create your own styles and materials first.",
    "preset.card.system": "System",
    "preset.card.custom": "Custom",
    "preset.card.favorite": "Save to My Presets",
    "preset.card.edit": "Edit Preset",
    "preset.card.delete": "Delete Preset",
    "gallery.title": "Your Toy Designs",
    "gallery.subtitle": "Generated images will appear here. Download or copy the link anytime.",
    "gallery.empty.title": "Waiting for Your Spark",
    "gallery.empty.description":
      "Enter a prompt on the left, pick a style/material, then click Generate to see AI results.",
    "gallery.artwork.alt": "Toy artwork",
    "gallery.seed.auto": "Auto",
    "gallery.seed": "Seed: {value}",
    "gallery.size": "Size: {value}",
    "gallery.download": "Download",
    "gallery.copy": "Copy Link",
    "gallery.view": "View details and refine",
    "history.title": "Generation History",
    "history.subtitle": "Revisit previous generations to reuse ideas quickly.",
    "history.empty": "No generations yet.",
    "history.batch": "{count} batches",
    "history.status": "{count} works",
    "modal.editPreset": "Edit Preset",
    "modal.createPreset": "Create Preset",
    "preset.form.name": "Preset Name",
    "preset.form.name.placeholder": "Pick an easy-to-recognize name",
    "preset.form.prompt": "Prompt",
    "preset.form.prompt.placeholder": "e.g. adorable chibi creature, glossy finish, holographic patterns",
    "preset.form.thumbnail": "Thumbnail URL (optional)",
    "preset.form.thumbnail.placeholder": "Provide a reference image URL or keep default",
    "preset.form.cancel": "Cancel",
    "preset.form.save": "Save Preset",
    "preset.form.validation": "Please fill in both the preset name and prompt.",
    "detail.title": "Artwork Detail",
    "detail.back": "Back to List",
    "detail.taskPrompt": "Task Prompt",
    "detail.refine.title": "Refine & Iterate",
    "detail.refine.subtitle": "Adjust the prompt and generate again for quick variations.",
    "detail.refine.prompt": "Prompt Content",
    "detail.refine.count": "Images",
    "detail.refine.submit": "Submit Refinement",
    "detail.preview.title": "3D Preview",
    "detail.preview.subtitle":
      "One-click 3D toy preview. Real models will appear once backend support is ready.",
    "detail.preview.cta.initial": "Convert to 3D Model",
    "detail.preview.cta.repeat": "Regenerate Placeholder",
    "detail.preview.placeholder": "Placeholder 3D render will be replaced once ready.",
    "detail.production.title": "Production Questionnaire",
    "detail.production.subtitle":
      "Share manufacturing intent so we can evaluate process and timeline.",
    "detail.production.usage": "Usage",
    "detail.production.usage.placeholder": "e.g. Brand merchandise / Expo giveaway",
    "detail.production.material": "Material Preference",
    "detail.production.material.placeholder": "PVC / Resin / Soft vinyl …",
    "detail.production.quantity": "Planned Quantity",
    "detail.production.quantity.placeholder": "e.g. 200 pcs",
    "detail.production.budget": "Target Cost",
    "detail.production.budget.placeholder": "e.g. Under 120 RMB each",
    "detail.production.timeline": "Target Delivery",
    "detail.production.timeline.placeholder": "e.g. March 2025",
    "detail.production.notes": "Additional Notes",
    "detail.production.notes.placeholder": "Add special craftsmanship, packaging needs, or collaboration ideas.",
    "detail.production.submit": "Submit Questionnaire",
    "toast.preset.duplicate": "Preset already saved.",
    "toast.preset.saved": "Added to My Presets.",
    "toast.history.switched": "Switched to results from {date}.",
    "toast.preset.deleted": "Preset deleted.",
    "toast.preset.created": "Preset created.",
    "toast.preset.updated": "Preset updated.",
    "toast.seed.unconfigured": "SeedDream API is not configured.",
    "toast.generation.pending": "SeedDream 4.0 is generating ({count} batches in parallel)…",
    "toast.generation.mock": "SeedDream not configured. Showing placeholder images.",
    "toast.generation.failed": "Generation failed, please try again later.",
    "toast.generation.partial":
      "Partial success: received {success} images, {failed} batches failed.",
    "toast.generation.success": "Generation complete with {count} images.",
    "toast.generation.failedWithReason": "Generation failed: {reason}",
    "toast.copy": "Link copied.",
    "toast.detail.placeholder": "3D placeholder generated. Real models will appear once ready.",
    "toast.detail.form": "Questionnaire submitted. We will contact you soon.",
    "alert.prompt.required": "Enter a prompt first.",
    "alert.promptOrPreset.required": "Enter a prompt or select at least one preset first.",
    "detail.source.seed": "Seed {seed} · {date}",
    "detail.source.generated": "From task on {date}",
    "history.origin.refine": "Refine {id}",
    "language.badge": "EN",
    "language.badge.zh": "中文",
    "preset.card.system.badge": "System",
    "preset.card.custom.badge": "Custom",
    "preset.card.delete.confirm": "Delete Preset",
    "gallery.status.generating": "Generating…",
    "gallery.status.idle": "Ready",
    "preset.favorite.success": "Added to My Presets.",
    "preset.favorite.exists": "Preset already saved.",
    "prompt.counter": "{current}/{max}",
    "history.statusImageCount": "{count} images",
    "prompt.copyLink": "Copy this link"
  },
  zh: {
    "app.subtitle": "AI 潮玩创作平台",
    "nav.composer": "创意输入",
    "nav.stylePresets": "潮玩风格",
    "nav.materialPresets": "生产材质",
    "nav.history": "生成记录",
    "cta.start": "立即体验",
    "language.english": "English",
    "language.chinese": "中文",
    "language.toggle": "切换语言",
    "composer.title": "输入你的创意描述",
    "composer.subtitle": "支持中英文混合输入，建议包含角色设定、外观细节、场景氛围等信息，字数上限 {maxLength}。",
    "composer.placeholder":
      "例如：未来城市中的赛博朋克兔子潮玩，拥有全息耳朵，金属质感服装，夜晚霓虹灯光",
    "composer.clear": "清空预设",
    "composer.count": "生成数量",
    "composer.generate.start": "开始生成",
    "composer.generate.processing": "生成中...",
    "composer.generate.hint": "生成过程中按钮会锁定，约 10 秒完成。",
    "preset.section.styleTitle": "选择潮玩风格",
    "preset.section.materialTitle": "选择生产材质",
    "preset.section.styleDescription": "点击喜欢的潮玩风格即可追加到提示词，支持与材质组合使用",
    "preset.section.materialDescription":
      "为造型选择不同的生产材质，和风格预设叠加即可快速微调质感",
    "preset.section.create": "新建预设",
    "preset.section.empty": "即将提供更多预设内容，您可以先创建属于自己的风格或材质。",
    "preset.card.system": "系统",
    "preset.card.custom": "自定义",
    "preset.card.favorite": "收藏到我的预设",
    "preset.card.edit": "编辑预设",
    "preset.card.delete": "删除预设",
    "gallery.title": "你的潮玩设计",
    "gallery.subtitle": "生成的图片将在此展示，可进行下载或复制链接。",
    "gallery.empty.title": "等待你的创意火花",
    "gallery.empty.description":
      "请在左侧输入创意描述并选择风格/材质后点击“生成”，AI 会为你带来多张潮玩效果图。",
    "gallery.artwork.alt": "潮玩设计图",
    "gallery.seed.auto": "自动生成",
    "gallery.seed": "Seed: {value}",
    "gallery.size": "尺寸: {value}",
    "gallery.download": "下载",
    "gallery.copy": "复制链接",
    "gallery.view": "查看详情并继续创作",
    "history.title": "生成记录",
    "history.subtitle": "快速回看历史生成任务，复用灵感。",
    "history.empty": "暂无生成记录。",
    "history.batch": "{count} 组",
    "history.status": "{count} 张作品",
    "modal.editPreset": "编辑预设",
    "modal.createPreset": "新建预设",
    "preset.form.name": "预设名称",
    "preset.form.name.placeholder": "输入一个易识别的名称",
    "preset.form.prompt": "Prompt 提示词",
    "preset.form.prompt.placeholder":
      "例如：adorable chibi creature, glossy finish, holographic patterns",
    "preset.form.thumbnail": "缩略图地址（可选）",
    "preset.form.thumbnail.placeholder": "放一张示意图 URL，或使用默认",
    "preset.form.cancel": "取消",
    "preset.form.save": "保存预设",
    "preset.form.validation": "请填写完整的预设名称和提示词",
    "detail.title": "作品详情",
    "detail.back": "返回列表",
    "detail.taskPrompt": "任务 Prompt",
    "detail.refine.title": "精修与微调",
    "detail.refine.subtitle": "调整 Prompt 后再次生成，快速得到你想要的版本。",
    "detail.refine.prompt": "Prompt 内容",
    "detail.refine.count": "生成数量",
    "detail.refine.submit": "提交精修",
    "detail.preview.title": "3D 模型预览",
    "detail.preview.subtitle": "一键生成潮玩 3D 模型，后端实现完成后将在此呈现。",
    "detail.preview.cta.initial": "转换为 3D 模型",
    "detail.preview.cta.repeat": "重新生成占位模型",
    "detail.preview.placeholder": "实际模型生成完成后，将替换为真实渲染画面。",
    "detail.production.title": "生产问卷",
    "detail.production.subtitle": "填写潮玩量产意向，帮助我们评估工艺与排期。",
    "detail.production.usage": "用途",
    "detail.production.usage.placeholder": "例如：品牌周边 / 展会赠品",
    "detail.production.material": "材质偏好",
    "detail.production.material.placeholder": "PVC / 树脂 / 搪胶 ...",
    "detail.production.quantity": "计划数量",
    "detail.production.quantity.placeholder": "如 200 件",
    "detail.production.budget": "目标成本",
    "detail.production.budget.placeholder": "例如：每件 120 元以内",
    "detail.production.timeline": "期望交付时间",
    "detail.production.timeline.placeholder": "如 2025 年 3 月",
    "detail.production.notes": "其他需求",
    "detail.production.notes.placeholder": "请补充特殊工艺、包装需求或合作方式。",
    "detail.production.submit": "提交问卷",
    "toast.preset.duplicate": "该预设已收藏",
    "toast.preset.saved": "已收藏到我的预设",
    "toast.history.switched": "已切换到 {date} 的结果",
    "toast.preset.deleted": "预设已删除",
    "toast.preset.created": "预设已创建",
    "toast.preset.updated": "预设已更新",
    "toast.seed.unconfigured": "未配置 SeedDream 接口",
    "toast.generation.pending": "SeedDream 4.0 正在生成（{count} 组并行）...",
    "toast.generation.mock": "未配置 SeedDream，使用占位图展示",
    "toast.generation.failed": "生成失败，请稍后重试",
    "toast.generation.partial": "部分成功：获得 {success} 张作品，{failed} 组请求失败",
    "toast.generation.success": "生成完成，共获得 {count} 张作品",
    "toast.generation.failedWithReason": "生成失败：{reason}",
    "toast.copy": "链接已复制",
    "toast.detail.placeholder": "3D 模型占位图已生成，后端能力上线后将展示真实模型",
    "toast.detail.form": "问卷已提交，我们将尽快与您联系",
    "alert.prompt.required": "请先输入 Prompt",
    "alert.promptOrPreset.required": "请先输入 Prompt 或至少选择一个预设",
    "detail.source.seed": "Seed {seed} · {date}",
    "detail.source.generated": "源自任务：{date}",
    "history.origin.refine": "精修 {id}",
    "language.badge": "EN",
    "language.badge.zh": "中文",
    "preset.card.system.badge": "系统",
    "preset.card.custom.badge": "自定义",
    "preset.card.delete.confirm": "删除预设",
    "gallery.status.generating": "生成中...",
    "gallery.status.idle": "准备中",
    "preset.favorite.success": "已收藏到我的预设",
    "preset.favorite.exists": "该预设已收藏",
    "prompt.counter": "{current}/{max}",
    "history.statusImageCount": "{count} 张作品",
    "prompt.copyLink": "复制以下链接"
  }
};

interface TranslationContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const TranslationContext = createContext<TranslationContextValue | undefined>(undefined);

const STORAGE_KEY = "midas-shiny-locale";

const formatString = (template: string, params?: Record<string, string | number>) => {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, token) => {
    const value = params[token];
    return value !== undefined ? String(value) : `{${token}}`;
  });
};

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") {
      return "en";
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "zh" ? "zh" : "en";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
  }, []);

  const value = useMemo(() => {
    const t = (key: string, params?: Record<string, string | number>) => {
      const table = translations[locale];
      const fallbackTable = translations.en;
      const resolved = table[key] ?? fallbackTable[key] ?? key;
      if (typeof resolved === "function") {
        return resolved(params);
      }
      return formatString(resolved, params);
    };

    return { locale, setLocale, t };
  }, [locale]);

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within TranslationProvider");
  }
  return context;
}

export function useLocale() {
  const { locale, setLocale } = useTranslation();
  return { locale, setLocale };
}
