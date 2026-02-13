import { useCallback } from "react";

import { useUiStore } from "../store/uiStore";
import { useWidgetsStore } from "../store/widgetsStore";

export function useWidgetConfig() {
  const activeTab = useUiStore((s) => s.activeTab);
  const widgets = useWidgetsStore((s) => s.widgetsByTab[activeTab] ?? []);

  const isVisible = useCallback(
    () => true, // all widgets in the store are visible by default
    []
  );

  const titleFor = useCallback(
    (id: string, fallback: string) => {
      const widget = widgets.find((w) => w.id === id);
      return widget?.title ?? fallback;
    },
    [widgets]
  );

  return { isVisible, titleFor };
}
