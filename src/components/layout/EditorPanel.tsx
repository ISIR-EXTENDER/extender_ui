import { useMemo } from "react";

import { widgetDefaults, widgetsByTab } from "../../app/widgets";
import { useUiStore } from "../../store/uiStore";

export function EditorPanel() {
  const activeTab = useUiStore((s) => s.activeTab);
  const widgetVisibility = useUiStore((s) => s.widgetVisibility);
  const widgetTitles = useUiStore((s) => s.widgetTitles);
  const setWidgetVisibility = useUiStore((s) => s.setWidgetVisibility);
  const setWidgetTitle = useUiStore((s) => s.setWidgetTitle);
  const resetWidgetsForTab = useUiStore((s) => s.resetWidgetsForTab);

  const widgetIds = useMemo(() => widgetsByTab[activeTab] ?? [], [activeTab]);

  return (
    <section className="editor-panel">
      <div className="editor-panel-header">
        <div>
          <div className="editor-title">Editor Mode</div>
          <div className="editor-subtitle">Customize widgets for the active tab.</div>
        </div>
        <div className="editor-actions">
          <button className="header-button" type="button" onClick={() => resetWidgetsForTab(activeTab)}>
            Reset tab
          </button>
        </div>
      </div>
      <div className="editor-grid">
        {widgetIds.map((id) => (
          <div key={id} className="editor-row">
            <label className="editor-toggle">
              <input
                type="checkbox"
                checked={widgetVisibility[id] !== false}
                onChange={(e) => setWidgetVisibility(id, e.target.checked)}
              />
              <span>{widgetDefaults.titles[id] ?? id}</span>
            </label>
            <input
              className="editor-input"
              value={widgetTitles[id] ?? ""}
              onChange={(e) => setWidgetTitle(id, e.target.value)}
              placeholder="Widget title"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
