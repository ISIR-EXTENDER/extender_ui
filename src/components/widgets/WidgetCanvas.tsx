import { useMemo } from "react";

import type { TabId } from "../../app/tabs";
import type { WidgetInstance } from "../../types/widgets";
import { useUiStore } from "../../store/uiStore";
import { useWidgetsStore } from "../../store/widgetsStore";
import { WidgetContainer } from "./WidgetContainer";
import { WidgetRenderer } from "./WidgetRenderer";

const GRID_SPACING = 24;

type WidgetCanvasProps = {
  tabId: TabId;
};

export function WidgetCanvas({ tabId }: WidgetCanvasProps) {
  const isEditorMode = useUiStore((s) => s.isEditorMode);
  const widgets = useWidgetsStore((s) => s.widgetsByTab[tabId] ?? []);
  const selectedWidgetId = useWidgetsStore((s) => s.selectedWidgetId);
  const selectWidget = useWidgetsStore((s) => s.selectWidget);
  const updateWidget = useWidgetsStore((s) => s.updateWidget);

  const gridStyle = useMemo(() => {
    if (!isEditorMode) return undefined;
    return {
      backgroundImage: `linear-gradient(to right, rgba(74, 158, 255, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(74, 158, 255, 0.15) 1px, transparent 1px)`,
      backgroundSize: `${GRID_SPACING}px ${GRID_SPACING}px`,
    } as const;
  }, [isEditorMode]);

  return (
    <div
      className={`widget-canvas ${isEditorMode ? "is-editor" : ""}`.trim()}
      style={gridStyle}
    >
      {widgets.map((widget) => (
        <WidgetContainer
          key={widget.id}
          widget={widget}
          isEditorMode={isEditorMode}
          isSelected={widget.id === selectedWidgetId}
          onSelect={selectWidget}
          onUpdate={(updates: Partial<WidgetInstance>) => updateWidget(tabId, widget.id, updates)}
        >
          <WidgetRenderer widget={widget} />
        </WidgetContainer>
      ))}
    </div>
  );
}
