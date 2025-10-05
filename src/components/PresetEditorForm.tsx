import { useState } from "react";
import type { Preset } from "../types";

interface PresetEditorFormProps {
  initialValue: Partial<Preset>;
  onSubmit: (preset: { name: string; prompt: string; thumbnail: string }) => void;
  onCancel: () => void;
}

const DEFAULT_THUMBNAILS = [
  "https://dummyimage.com/320x360/1f2937/38bdf8&text=Dream",
  "https://dummyimage.com/320x360/111827/f9fafb&text=Toy",
  "https://dummyimage.com/320x360/0f172a/c084fc&text=Art"
];

function PresetEditorForm({ initialValue, onSubmit, onCancel }: PresetEditorFormProps) {
  const [name, setName] = useState(initialValue.name ?? "");
  const [prompt, setPrompt] = useState(initialValue.prompt ?? "");
  const [thumbnail, setThumbnail] = useState(initialValue.thumbnail ?? DEFAULT_THUMBNAILS[0]);

  const handleSubmit = () => {
    if (!name.trim() || !prompt.trim()) {
      alert("请填写完整的预设名称和提示词");
      return;
    }

    onSubmit({ name: name.trim(), prompt: prompt.trim(), thumbnail: thumbnail.trim() });
  };

  return (
    <>
      <label>
        预设名称
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="输入一个易识别的名称" />
      </label>
      <label>
        Prompt 提示词
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="例如：adorable chibi creature, glossy finish, holographic patterns"
        />
      </label>
      <label>
        缩略图地址（可选）
        <input
          value={thumbnail}
          onChange={(event) => setThumbnail(event.target.value)}
          placeholder="放一张示意图 URL，或使用默认"
        />
      </label>
      <div className="modal__actions">
        <button type="button" className="ghost-btn" onClick={onCancel}>
          取消
        </button>
        <button type="button" className="secondary-btn" onClick={handleSubmit}>
          保存预设
        </button>
      </div>
    </>
  );
}

export default PresetEditorForm;
