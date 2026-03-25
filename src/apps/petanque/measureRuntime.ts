import defaultMeasureDemoImage from "../../assets/image_measures.png";
import type { CanvasWidget } from "../../components/widgets";
import {
  buildCameraFrameMessage,
  captureImageDataUrlFromStreamWidget,
  findStreamWidgetById,
} from "../../app/runtime/streamCapture";
import {
  PLAY_PETANQUE_MEASURE_CAPTURE_TOPIC,
  PLAY_PETANQUE_MEASURE_REFRESH_TOPIC,
  PLAY_PETANQUE_MEASURE_REQUEST_TOPIC,
  PLAY_PETANQUE_MEASURE_STREAM_WIDGET_ID,
  PLAY_PETANQUE_MEASURE_VIEW_LIVE_TOPIC,
  PLAY_PETANQUE_MEASURE_VIEW_RESULT_TOPIC,
} from "../../pages/applicationTopics";

export const PLAY_PETANQUE_MEASURES_SCREEN_ID = "play_petanque_measures";

const MEASURE_DEMO_HISTORY_ID = "measure-demo-image-measures";
const MEASURE_DEMO_VECTORS_JSON = JSON.stringify(
  {
    source: "image_measures_demo",
    distances_cm: [27.9],
  },
  null,
  2
);

export type MeasureViewMode = "live" | "result";

export type MeasureResultHistoryEntry = {
  id: string;
  imageDataUrl: string;
  vectorsJson: string | null;
  updatedAtMs: number | null;
  source: "demo" | "opencv";
};

export const MEASURE_DEMO_HISTORY_ENTRY: MeasureResultHistoryEntry = {
  id: MEASURE_DEMO_HISTORY_ID,
  imageDataUrl: defaultMeasureDemoImage,
  vectorsJson: MEASURE_DEMO_VECTORS_JSON,
  updatedAtMs: null,
  source: "demo",
};

export const formatMeasureStatusText = (
  measureStatusText: string,
  measureLastUpdatedAtMs: number | null
) =>
  measureLastUpdatedAtMs != null
    ? `${measureStatusText} (updated ${new Date(measureLastUpdatedAtMs).toLocaleTimeString()})`
    : measureStatusText;

export const formatMeasureVectorsText = (measureVectorsJson: string | null) => {
  if (!measureVectorsJson || !measureVectorsJson.trim()) return "No vectors yet.";
  try {
    const parsed = JSON.parse(measureVectorsJson);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return measureVectorsJson;
  }
};

export const upsertMeasureResultHistory = (
  history: MeasureResultHistoryEntry[],
  entry: MeasureResultHistoryEntry
) => {
  const demoEntry =
    history.find((item) => item.id === MEASURE_DEMO_HISTORY_ID) ?? MEASURE_DEMO_HISTORY_ENTRY;
  const nonDemo = history.filter(
    (item) => item.id !== MEASURE_DEMO_HISTORY_ID && item.imageDataUrl !== entry.imageDataUrl
  );
  return [entry, ...nonDemo].slice(0, 7).concat(demoEntry);
};

export const resolveMeasureResultViewStatus = (measureResultImageDataUrl: string | null) => {
  if (measureResultImageDataUrl === MEASURE_DEMO_HISTORY_ENTRY.imageDataUrl) {
    return "Showing demo measure image";
  }
  if (measureResultImageDataUrl) {
    return "Showing cached measure result";
  }
  return "No measure result available yet";
};

export const resolveMeasureResultOverlayText = (measureResultImageDataUrl: string | null) => {
  if (measureResultImageDataUrl === MEASURE_DEMO_HISTORY_ENTRY.imageDataUrl) {
    return "demo measure";
  }
  if (measureResultImageDataUrl) {
    return "latest measure";
  }
  return "no measured image yet";
};

export const resolveMeasureStreamWidgetId = (widgets: CanvasWidget[]) => {
  const configured = widgets.find(
    (item) =>
      item.kind === "stream-display" && item.id === PLAY_PETANQUE_MEASURE_STREAM_WIDGET_ID
  );
  if (configured) return configured.id;

  const fallback = widgets.find(
    (item) => item.kind === "stream-display" && item.source === "webcam"
  );
  return fallback?.id ?? null;
};

type MeasureButtonSnapshot = {
  capturedMeasureImageDataUrl: string | null;
  measureResultImageDataUrl: string | null;
  widgets: CanvasWidget[];
};

type MeasureButtonActions = {
  setMeasureViewMode: (value: MeasureViewMode) => void;
  setMeasureStatusText: (value: string) => void;
  setCapturedMeasureImageDataUrl: (value: string) => void;
  setMeasureRequestPending: (value: boolean) => void;
  markWidgetPulse: (widgetId: string) => void;
  sendMessage: (
    message:
      | {
          type: "camera_frame";
          topic: string;
          image_data_url: string;
          widget_id: string;
        }
      | { type: "measure_request"; image_data_url: string }
      | { type: "measure_refresh" }
  ) => void;
};

const publishCameraFrameForMeasureWidget = (
  widgets: CanvasWidget[],
  widgetId: string | null,
  imageDataUrl: string,
  sendMessage: MeasureButtonActions["sendMessage"]
) => {
  if (!widgetId) return;
  const widget = findStreamWidgetById(widgets, widgetId);
  if (!widget) return;
  const message = buildCameraFrameMessage(widget, imageDataUrl);
  if (!message) return;
  sendMessage(message);
};

export const triggerMeasureButton = (
  topic: string,
  widgetId: string,
  snapshot: MeasureButtonSnapshot,
  actions: MeasureButtonActions
) => {
  if (topic === PLAY_PETANQUE_MEASURE_VIEW_LIVE_TOPIC) {
    actions.setMeasureViewMode("live");
    actions.setMeasureStatusText("Live feed active");
    actions.markWidgetPulse(widgetId);
    return true;
  }

  if (topic === PLAY_PETANQUE_MEASURE_VIEW_RESULT_TOPIC) {
    actions.setMeasureViewMode("result");
    actions.setMeasureStatusText(resolveMeasureResultViewStatus(snapshot.measureResultImageDataUrl));
    actions.markWidgetPulse(widgetId);
    return true;
  }

  if (topic === PLAY_PETANQUE_MEASURE_CAPTURE_TOPIC) {
    const streamWidgetId = resolveMeasureStreamWidgetId(snapshot.widgets);
    const captured =
      streamWidgetId == null ? null : captureImageDataUrlFromStreamWidget(streamWidgetId);
    if (!captured) {
      actions.setMeasureStatusText("Capture failed: no visible frame");
      actions.markWidgetPulse(widgetId);
      return true;
    }
    actions.setCapturedMeasureImageDataUrl(captured);
    publishCameraFrameForMeasureWidget(
      snapshot.widgets,
      streamWidgetId,
      captured,
      actions.sendMessage
    );
    actions.setMeasureStatusText("Image captured");
    actions.markWidgetPulse(widgetId);
    return true;
  }

  if (topic === PLAY_PETANQUE_MEASURE_REQUEST_TOPIC) {
    const streamWidgetId = resolveMeasureStreamWidgetId(snapshot.widgets);
    let imageToSend = snapshot.capturedMeasureImageDataUrl;
    if (!imageToSend) {
      imageToSend = streamWidgetId == null ? null : captureImageDataUrlFromStreamWidget(streamWidgetId);
    }
    if (!imageToSend) {
      actions.setMeasureStatusText("Measure failed: capture an image first or switch to live feed");
      actions.markWidgetPulse(widgetId);
      return true;
    }
    actions.setCapturedMeasureImageDataUrl(imageToSend);
    publishCameraFrameForMeasureWidget(
      snapshot.widgets,
      streamWidgetId,
      imageToSend,
      actions.sendMessage
    );
    actions.sendMessage({
      type: "measure_request",
      image_data_url: imageToSend,
    });
    actions.setMeasureRequestPending(true);
    actions.setMeasureStatusText("Measure request sent");
    actions.markWidgetPulse(widgetId);
    return true;
  }

  if (topic === PLAY_PETANQUE_MEASURE_REFRESH_TOPIC) {
    actions.sendMessage({ type: "measure_refresh" });
    actions.setMeasureViewMode("result");
    actions.setMeasureStatusText("Requested latest measure result");
    actions.markWidgetPulse(widgetId);
    return true;
  }

  return false;
};
