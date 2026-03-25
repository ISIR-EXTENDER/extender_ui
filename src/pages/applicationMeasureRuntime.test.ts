import { describe, expect, it, vi } from "vitest";

import {
  PLAY_PETANQUE_MEASURE_CAPTURE_TOPIC,
  PLAY_PETANQUE_MEASURE_REFRESH_TOPIC,
  PLAY_PETANQUE_MEASURE_REQUEST_TOPIC,
  PLAY_PETANQUE_MEASURE_VIEW_LIVE_TOPIC,
  PLAY_PETANQUE_MEASURE_STREAM_WIDGET_ID,
  PLAY_PETANQUE_MEASURE_VIEW_RESULT_TOPIC,
} from "./applicationTopics";
import {
  MEASURE_DEMO_HISTORY_ENTRY,
  captureImageDataUrlFromStreamWidget,
  formatMeasureStatusText,
  formatMeasureVectorsText,
  resolveMeasureResultOverlayText,
  resolveMeasureResultViewStatus,
  resolveMeasureStreamWidgetId,
  triggerMeasureButton,
  upsertMeasureResultHistory,
} from "./applicationMeasureRuntime";

describe("applicationMeasureRuntime", () => {
  it("formats status and vector text safely", () => {
    expect(formatMeasureStatusText("Ready", null)).toBe("Ready");
    expect(formatMeasureStatusText("Ready", 1_700_000_000_000)).toContain("updated");
    expect(formatMeasureVectorsText(null)).toBe("No vectors yet.");
    expect(formatMeasureVectorsText('{"distance": 12}')).toContain('"distance": 12');
    expect(formatMeasureVectorsText("not-json")).toBe("not-json");
  });

  it("keeps the demo entry while upserting recent measure history", () => {
    const next = upsertMeasureResultHistory([MEASURE_DEMO_HISTORY_ENTRY], {
      id: "opencv-1",
      imageDataUrl: "data:image/jpeg;base64,opencv",
      vectorsJson: '{"distance":12}',
      updatedAtMs: 12,
      source: "opencv",
    });

    expect(next[0]?.id).toBe("opencv-1");
    expect(next.at(-1)?.id).toBe(MEASURE_DEMO_HISTORY_ENTRY.id);
  });

  it("resolves the configured measure stream widget before a webcam fallback", () => {
    expect(
      resolveMeasureStreamWidgetId([
        {
          id: PLAY_PETANQUE_MEASURE_STREAM_WIDGET_ID,
          kind: "stream-display",
          source: "camera",
          streamUrl: "",
          x: 0,
          y: 0,
          width: 10,
          height: 10,
          label: "Measure",
        } as never,
      ])
    ).toBe(PLAY_PETANQUE_MEASURE_STREAM_WIDGET_ID);

    expect(
      resolveMeasureStreamWidgetId([
        {
          id: "webcam-fallback",
          kind: "stream-display",
          source: "webcam",
          streamUrl: "",
          x: 0,
          y: 0,
          width: 10,
          height: 10,
          label: "Webcam",
        } as never,
      ])
    ).toBe("webcam-fallback");

    expect(resolveMeasureStreamWidgetId([])).toBeNull();
  });

  it("captures a visible stream image when the measure capture button is triggered", () => {
    const image = document.createElement("img");
    image.dataset.streamWidgetId = PLAY_PETANQUE_MEASURE_STREAM_WIDGET_ID;
    Object.defineProperty(image, "naturalWidth", { value: 320 });
    Object.defineProperty(image, "naturalHeight", { value: 180 });
    document.body.appendChild(image);

    const drawImage = vi.fn();
    const getContextSpy = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
    const toDataURLSpy = vi
      .spyOn(HTMLCanvasElement.prototype, "toDataURL")
      .mockReturnValue("data:image/jpeg;base64,captured");

    const actions = {
      setMeasureViewMode: vi.fn(),
      setMeasureStatusText: vi.fn(),
      setCapturedMeasureImageDataUrl: vi.fn(),
      setMeasureRequestPending: vi.fn(),
      markWidgetPulse: vi.fn(),
      sendMessage: vi.fn(),
    };

    expect(captureImageDataUrlFromStreamWidget(PLAY_PETANQUE_MEASURE_STREAM_WIDGET_ID)).toBe(
      "data:image/jpeg;base64,captured"
    );

    expect(
      triggerMeasureButton(
        PLAY_PETANQUE_MEASURE_CAPTURE_TOPIC,
        "measure-capture",
        {
          capturedMeasureImageDataUrl: null,
          measureResultImageDataUrl: null,
          widgets: [
            {
              id: PLAY_PETANQUE_MEASURE_STREAM_WIDGET_ID,
              kind: "stream-display",
              source: "camera",
              streamUrl: "",
              x: 0,
              y: 0,
              width: 10,
              height: 10,
              label: "Measure",
            } as never,
          ],
        },
        actions
      )
    ).toBe(true);
    expect(actions.setCapturedMeasureImageDataUrl).toHaveBeenCalledWith(
      "data:image/jpeg;base64,captured"
    );
    expect(actions.setMeasureStatusText).toHaveBeenCalledWith("Image captured");

    image.remove();
    getContextSpy.mockRestore();
    toDataURLSpy.mockRestore();
  });

  it("handles measure view and refresh buttons without needing a live capture", () => {
    const actions = {
      setMeasureViewMode: vi.fn(),
      setMeasureStatusText: vi.fn(),
      setCapturedMeasureImageDataUrl: vi.fn(),
      setMeasureRequestPending: vi.fn(),
      markWidgetPulse: vi.fn(),
      sendMessage: vi.fn(),
    };

    expect(
      triggerMeasureButton(
        PLAY_PETANQUE_MEASURE_VIEW_LIVE_TOPIC,
        "measure-live",
        {
          capturedMeasureImageDataUrl: null,
          measureResultImageDataUrl: null,
          widgets: [],
        },
        actions
      )
    ).toBe(true);
    expect(actions.setMeasureViewMode).toHaveBeenCalledWith("live");

    expect(
      triggerMeasureButton(
        PLAY_PETANQUE_MEASURE_VIEW_RESULT_TOPIC,
        "measure-result",
        {
          capturedMeasureImageDataUrl: null,
          measureResultImageDataUrl: MEASURE_DEMO_HISTORY_ENTRY.imageDataUrl,
          widgets: [],
        },
        actions
      )
    ).toBe(true);
    expect(actions.setMeasureViewMode).toHaveBeenCalledWith("result");
    expect(actions.setMeasureStatusText).toHaveBeenCalledWith("Showing demo measure image");

    expect(
      triggerMeasureButton(
        PLAY_PETANQUE_MEASURE_REFRESH_TOPIC,
        "measure-refresh",
        {
          capturedMeasureImageDataUrl: null,
          measureResultImageDataUrl: null,
          widgets: [],
        },
        actions
      )
    ).toBe(true);
    expect(actions.sendMessage).toHaveBeenCalledWith({ type: "measure_refresh" });
  });

  it("sends a measure request when an image is already available", () => {
    const actions = {
      setMeasureViewMode: vi.fn(),
      setMeasureStatusText: vi.fn(),
      setCapturedMeasureImageDataUrl: vi.fn(),
      setMeasureRequestPending: vi.fn(),
      markWidgetPulse: vi.fn(),
      sendMessage: vi.fn(),
    };

    expect(
      triggerMeasureButton(
        PLAY_PETANQUE_MEASURE_REQUEST_TOPIC,
        "measure-request",
        {
          capturedMeasureImageDataUrl: "data:image/jpeg;base64,captured",
          measureResultImageDataUrl: null,
          widgets: [],
        },
        actions
      )
    ).toBe(true);
    expect(actions.sendMessage).toHaveBeenCalledWith({
      type: "measure_request",
      image_data_url: "data:image/jpeg;base64,captured",
    });
    expect(actions.setMeasureRequestPending).toHaveBeenCalledWith(true);
  });

  it("fails safely when a measure request has no captured image", () => {
    const actions = {
      setMeasureViewMode: vi.fn(),
      setMeasureStatusText: vi.fn(),
      setCapturedMeasureImageDataUrl: vi.fn(),
      setMeasureRequestPending: vi.fn(),
      markWidgetPulse: vi.fn(),
      sendMessage: vi.fn(),
    };

    expect(
      triggerMeasureButton(
        PLAY_PETANQUE_MEASURE_REQUEST_TOPIC,
        "measure-request",
        {
          capturedMeasureImageDataUrl: null,
          measureResultImageDataUrl: null,
          widgets: [],
        },
        actions
      )
    ).toBe(true);
    expect(actions.setMeasureStatusText).toHaveBeenCalledWith(
      "Measure failed: capture an image first or switch to live feed"
    );
    expect(actions.sendMessage).not.toHaveBeenCalled();
  });

  it("derives overlay text from the current result source", () => {
    expect(resolveMeasureResultViewStatus(MEASURE_DEMO_HISTORY_ENTRY.imageDataUrl)).toBe(
      "Showing demo measure image"
    );
    expect(resolveMeasureResultViewStatus("data:image/jpeg;base64,opencv")).toBe(
      "Showing cached measure result"
    );
    expect(resolveMeasureResultViewStatus(null)).toBe("No measure result available yet");
    expect(resolveMeasureResultOverlayText(MEASURE_DEMO_HISTORY_ENTRY.imageDataUrl)).toBe(
      "demo measure"
    );
    expect(resolveMeasureResultOverlayText("data:image/jpeg;base64,opencv")).toBe(
      "latest measure"
    );
    expect(resolveMeasureResultOverlayText(null)).toBe("no measured image yet");
    expect(triggerMeasureButton("/custom/topic", "noop", {
      capturedMeasureImageDataUrl: null,
      measureResultImageDataUrl: null,
      widgets: [],
    }, {
      setMeasureViewMode: vi.fn(),
      setMeasureStatusText: vi.fn(),
      setCapturedMeasureImageDataUrl: vi.fn(),
      setMeasureRequestPending: vi.fn(),
      markWidgetPulse: vi.fn(),
      sendMessage: vi.fn(),
    })).toBe(false);
  });
});
