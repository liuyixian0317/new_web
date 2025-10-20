import { useTranslation } from "../i18n";
import type { GenerationTask } from "../types";
import "./HistoryPanel.css";

interface HistoryPanelProps {
  sectionId?: string;
  tasks: GenerationTask[];
  onSelectTask: (task: GenerationTask) => void;
}

function HistoryPanel({ sectionId, tasks, onSelectTask }: HistoryPanelProps) {
  const { t } = useTranslation();

  return (
    <aside id={sectionId} className="history-panel">
      <h2>{t("history.title")}</h2>
      <p className="history-panel__desc">{t("history.subtitle")}</p>
      <div className="history-panel__list">
        {tasks.length === 0 ? (
          <p className="history-panel__empty">{t("history.empty")}</p>
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
                      {t("history.batch", { count: task.requestedCount })}
                    </span>
                  )}
                </div>
              )}
              <p className="history-panel__prompt" title={task.prompt}>
                {task.prompt}
              </p>
              <span className="history-panel__status">
                {t("history.statusImageCount", { count: task.results.length })}
              </span>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}

export default HistoryPanel;
