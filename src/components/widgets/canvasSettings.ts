import type { CanvasWidget } from "./widgetTypes";

export type CanvasPresetId = "native-1024x600" | "hd" | "tablet" | "full-hd" | "local-screen";
export type RuntimeCanvasMode = "left" | "center" | "fit";

export type CanvasSettings = {
  presetId: CanvasPresetId;
  runtimeMode: RuntimeCanvasMode;
};

export type CanvasPreset = {
  id: CanvasPresetId;
  label: string;
  width: number;
  height: number;
};

export const CANVAS_PRESETS: CanvasPreset[] = [
  { id: "native-1024x600", label: "Native Tablet (1024x600)", width: 1024, height: 600 },
  { id: "hd", label: "HD (1280x720)", width: 1280, height: 720 },
  { id: "tablet", label: "Tablet (1280x800)", width: 1280, height: 800 },
  { id: "full-hd", label: "Full HD (1920x1080)", width: 1920, height: 1080 },
  { id: "local-screen", label: "Local Screen (1920x1080)", width: 1920, height: 1080 },
];

export const DEFAULT_CANVAS_SETTINGS: CanvasSettings = {
  presetId: "hd",
  runtimeMode: "fit",
};

const MIN_CANVAS_WIDTH = 220;
const MIN_CANVAS_HEIGHT = 220;
const CANVAS_WIDGET_EDGE_PADDING = 24;

export const cloneCanvasSettings = (settings: CanvasSettings): CanvasSettings => ({ ...settings });

const isCanvasPresetId = (value: unknown): value is CanvasPresetId =>
  value === "native-1024x600" ||
  value === "hd" ||
  value === "tablet" ||
  value === "full-hd" ||
  value === "local-screen";

const isRuntimeCanvasMode = (value: unknown): value is RuntimeCanvasMode =>
  value === "left" || value === "center" || value === "fit";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const normalizeCanvasSettings = (value: unknown): CanvasSettings => {
  if (!isRecord(value)) return cloneCanvasSettings(DEFAULT_CANVAS_SETTINGS);
  return {
    presetId: isCanvasPresetId(value.presetId) ? value.presetId : DEFAULT_CANVAS_SETTINGS.presetId,
    runtimeMode: isRuntimeCanvasMode(value.runtimeMode)
      ? value.runtimeMode
      : DEFAULT_CANVAS_SETTINGS.runtimeMode,
  };
};

export const getCanvasPreset = (presetId: CanvasPresetId): CanvasPreset =>
  CANVAS_PRESETS.find((preset) => preset.id === presetId) ?? CANVAS_PRESETS[0];

export const resolveCanvasArtboardSize = (
  widgets: CanvasWidget[],
  settings: CanvasSettings
): { width: number; height: number } => {
  const preset = getCanvasPreset(settings.presetId);
  const maxRight = widgets.reduce((acc, widget) => Math.max(acc, widget.rect.x + widget.rect.w), 0);
  const maxBottom = widgets.reduce((acc, widget) => Math.max(acc, widget.rect.y + widget.rect.h), 0);

  return {
    width: Math.max(MIN_CANVAS_WIDTH, preset.width, maxRight + CANVAS_WIDGET_EDGE_PADDING),
    height: Math.max(MIN_CANVAS_HEIGHT, preset.height, maxBottom + CANVAS_WIDGET_EDGE_PADDING),
  };
};

export const resolveCanvasFitScale = (
  mode: RuntimeCanvasMode,
  canvasSize: { width: number; height: number },
  viewportSize: { width: number; height: number }
) => {
  if (mode !== "fit") return 1;
  if (canvasSize.width <= 0 || canvasSize.height <= 0) return 1;
  if (viewportSize.width <= 0 || viewportSize.height <= 0) return 1;
  return Math.min(viewportSize.width / canvasSize.width, viewportSize.height / canvasSize.height);
};
