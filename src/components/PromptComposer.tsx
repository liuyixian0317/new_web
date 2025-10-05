import { FormEvent } from "react";
import type { Preset } from "../types";
import "./PromptComposer.css";

interface PromptComposerProps {
  sectionId?: string;
  prompt: string;
  onPromptChange: (value: string) => void;
  selectedPresets: Preset[];
  onClearPresets: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
  maxLength?: number;
}

function PromptComposer({
  sectionId,
  prompt,
  onPromptChange,
  selectedPresets,
  onClearPresets,
  onGenerate,
  isGenerating,
  maxLength = 500
}: PromptComposerProps) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onGenerate();
  };

  return (
    <section id={sectionId} className="prompt-composer">
      <form className="prompt-form" onSubmit={handleSubmit}>
        <div>
          <h2>输入你的创意描述</h2>
          <p>
            支持中英文混合输入，建议包含角色设定、外观细节、场景氛围等信息，字数上限 {maxLength}。
          </p>
        </div>

        <label className="prompt-form__textarea">
          <textarea
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value.slice(0, maxLength))}
            placeholder="例如：未来城市中的赛博朋克兔子潮玩，拥有全息耳朵，金属质感服装，夜晚霓虹灯光" 
          />
          <span className="prompt-form__counter">
            {prompt.length}/{maxLength}
          </span>
        </label>

        <div className="prompt-form__chips">
          {selectedPresets.map((preset) => (
            <span key={preset.id} className="preset-chip">
              {preset.name}
            </span>
          ))}

          {selectedPresets.length > 0 && (
            <button type="button" className="ghost-btn" onClick={onClearPresets}>
              清空预设
            </button>
          )}
        </div>

        <div className="prompt-form__actions">
          <button type="submit" className="primary-btn" disabled={isGenerating}>
            {isGenerating ? "生成中..." : "开始生成"}
          </button>
          <span className="prompt-form__hint">生成过程中按钮会锁定，约 10 秒完成。</span>
        </div>
      </form>
    </section>
  );
}

export default PromptComposer;
