import { useCallback } from "react";

import { useUiStore } from "../store/uiStore";

export function useWidgetConfig() {
  const widgetVisibility = useUiStore((s) => s.widgetVisibility);
  const widgetTitles = useUiStore((s) => s.widgetTitles);

  const isVisible = useCallback(
    (id: string) => widgetVisibility[id] !== false,
    [widgetVisibility]
  );

  const titleFor = useCallback(
    (id: string, fallback: string) => widgetTitles[id] ?? fallback,
    [widgetTitles]
  );

  return { isVisible, titleFor };
}
