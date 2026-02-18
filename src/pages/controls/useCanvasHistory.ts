import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from "react";

import {
  cloneCanvasSettings,
  cloneWidgets,
  type CanvasSettings,
  type CanvasWidget,
} from "../../components/widgets";

type CanvasDesignerSnapshot = {
  widgets: CanvasWidget[];
  canvas: CanvasSettings;
};

type UseCanvasHistoryParams = {
  widgets: CanvasWidget[];
  canvasSettings: CanvasSettings;
  setWidgets: Dispatch<SetStateAction<CanvasWidget[]>>;
  setCanvasSettings: Dispatch<SetStateAction<CanvasSettings>>;
  setSelectedWidgetId: Dispatch<SetStateAction<string | null>>;
  isTypingTarget: (target: EventTarget | null) => boolean;
  setStatusMessage: Dispatch<SetStateAction<string>>;
  onSnapshotApplied?: () => void;
  historyLimit?: number;
};

const DEFAULT_HISTORY_LIMIT = 120;

const createCanvasSnapshot = (
  widgets: CanvasWidget[],
  canvasSettings: CanvasSettings
): CanvasDesignerSnapshot => ({
  widgets: cloneWidgets(widgets),
  canvas: cloneCanvasSettings(canvasSettings),
});

export const useCanvasHistory = ({
  widgets,
  canvasSettings,
  setWidgets,
  setCanvasSettings,
  setSelectedWidgetId,
  isTypingTarget,
  setStatusMessage,
  onSnapshotApplied,
  historyLimit = DEFAULT_HISTORY_LIMIT,
}: UseCanvasHistoryParams) => {
  const undoStackRef = useRef<CanvasDesignerSnapshot[]>([]);
  const redoStackRef = useRef<CanvasDesignerSnapshot[]>([]);
  const committedSnapshotRef = useRef<CanvasDesignerSnapshot | null>(null);
  const committedSignatureRef = useRef<{ widget: string; canvas: string } | null>(null);
  const isApplyingHistoryRef = useRef(false);
  const widgetsRef = useRef(widgets);
  const canvasSettingsRef = useRef(canvasSettings);

  useEffect(() => {
    widgetsRef.current = widgets;
    canvasSettingsRef.current = canvasSettings;
  }, [canvasSettings, widgets]);

  const applyHistorySnapshot = useCallback(
    (snapshot: CanvasDesignerSnapshot) => {
      isApplyingHistoryRef.current = true;
      setWidgets(cloneWidgets(snapshot.widgets));
      setCanvasSettings(cloneCanvasSettings(snapshot.canvas));
      onSnapshotApplied?.();
      setSelectedWidgetId((current) => {
        if (current && snapshot.widgets.some((widget) => widget.id === current)) {
          return current;
        }
        return snapshot.widgets[0]?.id ?? null;
      });
    },
    [onSnapshotApplied, setCanvasSettings, setSelectedWidgetId, setWidgets]
  );

  const undoCanvasChange = useCallback(() => {
    const previousSnapshot = undoStackRef.current.pop();
    if (!previousSnapshot) {
      setStatusMessage("Nothing to undo.");
      return;
    }
    redoStackRef.current.push(
      createCanvasSnapshot(widgetsRef.current, canvasSettingsRef.current)
    );
    applyHistorySnapshot(previousSnapshot);
    setStatusMessage("Undo applied.");
  }, [applyHistorySnapshot, setStatusMessage]);

  const redoCanvasChange = useCallback(() => {
    const nextSnapshot = redoStackRef.current.pop();
    if (!nextSnapshot) {
      setStatusMessage("Nothing to redo.");
      return;
    }
    undoStackRef.current.push(
      createCanvasSnapshot(widgetsRef.current, canvasSettingsRef.current)
    );
    applyHistorySnapshot(nextSnapshot);
    setStatusMessage("Redo applied.");
  }, [applyHistorySnapshot, setStatusMessage]);

  useEffect(() => {
    const widgetSignature = JSON.stringify(widgets);
    const canvasSignature = JSON.stringify(canvasSettings);
    const currentSignature = {
      widget: widgetSignature,
      canvas: canvasSignature,
    };
    const currentSnapshot = createCanvasSnapshot(widgets, canvasSettings);

    if (!committedSnapshotRef.current || !committedSignatureRef.current) {
      committedSnapshotRef.current = currentSnapshot;
      committedSignatureRef.current = currentSignature;
      return;
    }

    if (
      committedSignatureRef.current.widget === currentSignature.widget &&
      committedSignatureRef.current.canvas === currentSignature.canvas
    ) {
      return;
    }

    if (isApplyingHistoryRef.current) {
      isApplyingHistoryRef.current = false;
      committedSnapshotRef.current = currentSnapshot;
      committedSignatureRef.current = currentSignature;
      return;
    }

    undoStackRef.current.push(committedSnapshotRef.current);
    if (undoStackRef.current.length > historyLimit) {
      undoStackRef.current.shift();
    }
    redoStackRef.current = [];
    committedSnapshotRef.current = currentSnapshot;
    committedSignatureRef.current = currentSignature;
  }, [canvasSettings, historyLimit, widgets]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      const modifierPressed = event.ctrlKey || event.metaKey;
      if (!modifierPressed) return;

      const key = event.key.toLowerCase();
      const wantsUndo = key === "z" && !event.shiftKey;
      const wantsRedo = key === "y" || (key === "z" && event.shiftKey);
      if (!wantsUndo && !wantsRedo) return;

      event.preventDefault();
      if (wantsUndo) {
        undoCanvasChange();
        return;
      }
      redoCanvasChange();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isTypingTarget, redoCanvasChange, undoCanvasChange]);

  return {
    undoCanvasChange,
    redoCanvasChange,
  };
};
