import type { GenerationTask } from "../types";
import "./HistoryPanel.css";

interface HistoryPanelProps {
  sectionId?: string;
  tasks: GenerationTask[];
  onSelectTask: (task: GenerationTask) => void;
}

function HistoryPanel({ sectionId, tasks, onSelectTask }: HistoryPanelProps) {
  return (
    <aside id={sectionId} className="history-panel">
      <h2>生成记录</h2>
      <p className="history-panel__desc">快速回看历史生成任务，复用灵感。</p>
      <div className="history-panel__list">
        {tasks.length === 0 ? (
          <p className="history-panel__empty">暂无生成记录。</p>
        ) : (
          tasks.map((task) => (
            <button
              type="button"
              key={task.id}
              onClick={() => onSelectTask(task)}
              className={`history-panel__item history-panel__item--${task.status}`}
            >
              <span className="history-panel__time">{task.createdAt}</span>
              {(task.origin || task.requestedCount) && (
                <div className="history-panel__meta">
                  {task.origin && <span className="history-panel__badge">{task.origin}</span>}
                  {task.requestedCount && (
                    <span className="history-panel__badge history-panel__badge--neutral">
                      {task.requestedCount} 组
                    </span>
                  )}
                </div>
              )}
              <p className="history-panel__prompt" title={task.prompt}>
                {task.prompt}
              </p>
              <span className="history-panel__status">{task.results.length} 张作品</span>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}

export default HistoryPanel;
