import { useState } from "react";
import { useTranslation } from "../i18n";
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
  const { t } = useTranslation();
  const [name, setName] = useState(initialValue.name ?? "");
  const [prompt, setPrompt] = useState(initialValue.prompt ?? "");
  const [thumbnail, setThumbnail] = useState(initialValue.thumbnail ?? DEFAULT_THUMBNAILS[0]);

  const handleSubmit = () => {
    if (!name.trim() || !prompt.trim()) {
      alert(t("preset.form.validation"));
      return;
    }

    onSubmit({ name: name.trim(), prompt: prompt.trim(), thumbnail: thumbnail.trim() });
  };

  return (
    <>
      <label>
        {t("preset.form.name")}
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t("preset.form.name.placeholder")}
        />
      </label>
      <label>
        {t("preset.form.prompt")}
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={t("preset.form.prompt.placeholder")}
        />
      </label>
      <label>
        {t("preset.form.thumbnail")}
        <input
          value={thumbnail}
          onChange={(event) => setThumbnail(event.target.value)}
          placeholder={t("preset.form.thumbnail.placeholder")}
        />
      </label>
      <div className="modal__actions">
        <button type="button" className="ghost-btn" onClick={onCancel}>
          {t("preset.form.cancel")}
        </button>
        <button type="button" className="secondary-btn" onClick={handleSubmit}>
          {t("preset.form.save")}
        </button>
      </div>
    </>
  );
}

export default PresetEditorForm;
