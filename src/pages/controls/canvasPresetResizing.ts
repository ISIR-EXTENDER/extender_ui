import {
  getCanvasPreset,
  type CanvasPreset,
  type CanvasPresetId,
  type CanvasWidget,
} from "../../components/widgets";

const MIN_RESIZED_WIDGET_SIZE = 24;

const clampInRange = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export type PresetResizeOutcome = {
  resizedWidgets: CanvasWidget[];
  resizedCount: number;
  fromPreset: CanvasPreset;
  toPreset: CanvasPreset;
};

export const resizeWidgetsForPresetTransition = (
  widgets: CanvasWidget[],
  fromPresetId: CanvasPresetId,
  toPresetId: CanvasPresetId
): PresetResizeOutcome => {
  const fromPreset = getCanvasPreset(fromPresetId);
  const toPreset = getCanvasPreset(toPresetId);

  if (fromPreset.id === toPreset.id || widgets.length === 0) {
    return {
      resizedWidgets: widgets,
      resizedCount: 0,
      fromPreset,
      toPreset,
    };
  }

  const scaleX = toPreset.width / Math.max(1, fromPreset.width);
  const scaleY = toPreset.height / Math.max(1, fromPreset.height);
  const resizedWidgets = widgets.map((widget) => {
    const scaledWidth = Math.round(widget.rect.w * scaleX);
    const scaledHeight = Math.round(widget.rect.h * scaleY);
    const nextWidth = clampInRange(scaledWidth, MIN_RESIZED_WIDGET_SIZE, toPreset.width);
    const nextHeight = clampInRange(scaledHeight, MIN_RESIZED_WIDGET_SIZE, toPreset.height);
    const maxX = Math.max(0, toPreset.width - nextWidth);
    const maxY = Math.max(0, toPreset.height - nextHeight);

    return {
      ...widget,
      rect: {
        x: clampInRange(Math.round(widget.rect.x * scaleX), 0, maxX),
        y: clampInRange(Math.round(widget.rect.y * scaleY), 0, maxY),
        w: nextWidth,
        h: nextHeight,
      },
    };
  });

  return {
    resizedWidgets,
    resizedCount: widgets.length,
    fromPreset,
    toPreset,
  };
};

export const resolvePendingResizeSourcePreset = (
  currentPendingSource: CanvasPresetId | null,
  previousPresetId: CanvasPresetId,
  nextPresetId: CanvasPresetId,
  hasWidgets: boolean
) => {
  if (!hasWidgets) return null;
  const sourcePresetId = currentPendingSource ?? previousPresetId;
  return sourcePresetId === nextPresetId ? null : sourcePresetId;
};
