import { useMemo } from "react";

import { useUiStore } from "../../store/uiStore";
import { useWidgetsStore } from "../../store/widgetsStore";

export function WidgetInspector() {
  const activeTab = useUiStore((s) => s.activeTab);
  const widgets = useWidgetsStore((s) => s.widgetsByTab[activeTab]);
  const selectedWidgetId = useWidgetsStore((s) => s.selectedWidgetId);
  const selectWidget = useWidgetsStore((s) => s.selectWidget);
  const updateWidget = useWidgetsStore((s) => s.updateWidget);
  const deleteWidget = useWidgetsStore((s) => s.deleteWidget);
  const resetTab = useWidgetsStore((s) => s.resetTab);
  const setShowWidgetMenu = useUiStore((s) => s.setShowWidgetMenu);

  const selectedWidget = useMemo(
    () => widgets.find((widget) => widget.id === selectedWidgetId) ?? null,
    [widgets, selectedWidgetId]
  );

  return (
    <section className="editor-panel">
      <div className="editor-panel-header">
        <div>
          <div className="editor-title">Editor Mode</div>
          <div className="editor-subtitle">Select a widget to edit its size or label.</div>
        </div>
        <div className="editor-actions">
          <button className="header-button" type="button" onClick={() => setShowWidgetMenu(true)}>
            Add widget
          </button>
          <button className="header-button" type="button" onClick={() => resetTab(activeTab)}>
            Reset tab
          </button>
        </div>
      </div>

      <div className="editor-grid">
        <div className="editor-section">
          <h3>Widgets</h3>
          <div className="editor-widget-list">
            {widgets.map((widget) => (
              <button
                key={widget.id}
                className={`editor-widget-item ${widget.id === selectedWidgetId ? "active" : ""}`.trim()}
                onClick={() => selectWidget(widget.id)}
              >
                {widget.title}
              </button>
            ))}
          </div>
        </div>

        <div className="editor-section">
          <h3>Properties</h3>
          {!selectedWidget && <div className="editor-empty">Select a widget.</div>}
          {selectedWidget && (
            <div className="editor-fields">
              <label>
                Title
                <input
                  className="editor-input"
                  value={selectedWidget.title}
                  onChange={(event) =>
                    updateWidget(activeTab, selectedWidget.id, { title: event.target.value })
                  }
                />
              </label>
              <div className="editor-field-row">
                <label>
                  X
                  <input
                    className="editor-input"
                    type="number"
                    value={selectedWidget.x}
                    onChange={(event) =>
                      updateWidget(activeTab, selectedWidget.id, {
                        x: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <label>
                  Y
                  <input
                    className="editor-input"
                    type="number"
                    value={selectedWidget.y}
                    onChange={(event) =>
                      updateWidget(activeTab, selectedWidget.id, {
                        y: Number(event.target.value),
                      })
                    }
                  />
                </label>
              </div>
              <div className="editor-field-row">
                <label>
                  Width
                  <input
                    className="editor-input"
                    type="number"
                    value={selectedWidget.width}
                    onChange={(event) =>
                      updateWidget(activeTab, selectedWidget.id, {
                        width: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <label>
                  Height
                  <input
                    className="editor-input"
                    type="number"
                    value={selectedWidget.height}
                    onChange={(event) =>
                      updateWidget(activeTab, selectedWidget.id, {
                        height: Number(event.target.value),
                      })
                    }
                  />
                </label>
              </div>
              <button
                className="header-button stop"
                type="button"
                onClick={() => deleteWidget(activeTab, selectedWidget.id)}
              >
                Delete Widget
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
