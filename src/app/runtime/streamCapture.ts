import type { CanvasWidget } from "../../components/widgets";

export type StreamDisplayRuntimeWidget = Extract<CanvasWidget, { kind: "stream-display" }>;

export const findStreamWidgetById = (
  widgets: CanvasWidget[],
  widgetId: string
): StreamDisplayRuntimeWidget | null => {
  const widget = widgets.find(
    (item): item is StreamDisplayRuntimeWidget =>
      item.kind === "stream-display" && item.id === widgetId
  );
  return widget ?? null;
};

export const captureImageDataUrlFromStreamWidget = (widgetId: string): string | null => {
  if (typeof document === "undefined") return null;

  const videoEl =
    Array.from(document.querySelectorAll<HTMLVideoElement>("video[data-stream-widget-id]")).find(
      (node) => node.dataset.streamWidgetId === widgetId
    ) ?? null;
  if (videoEl && videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
    const canvas = document.createElement("canvas");
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return null;
    try {
      context.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", 0.92);
    } catch {
      return null;
    }
  }

  const imageEl =
    Array.from(document.querySelectorAll<HTMLImageElement>("img[data-stream-widget-id]")).find(
      (node) => node.dataset.streamWidgetId === widgetId
    ) ?? null;
  if (imageEl && imageEl.naturalWidth > 0 && imageEl.naturalHeight > 0) {
    const canvas = document.createElement("canvas");
    canvas.width = imageEl.naturalWidth;
    canvas.height = imageEl.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) return null;
    try {
      context.drawImage(imageEl, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", 0.92);
    } catch {
      return null;
    }
  }

  return null;
};

export const buildCameraFrameMessage = (
  widget: StreamDisplayRuntimeWidget,
  imageDataUrl: string
) => {
  const topic = widget.topic.trim();
  if (!topic) return null;
  return {
    type: "camera_frame" as const,
    topic,
    image_data_url: imageDataUrl,
    widget_id: widget.id,
  };
};
