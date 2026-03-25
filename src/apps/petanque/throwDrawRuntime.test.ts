import { describe, expect, it, vi } from "vitest";

import {
  handlePetanqueThrowDrawChange,
  resolvePetanqueThrowDrawState,
} from "./throwDrawRuntime";

const createArgs = () => ({
  application: null,
  activeScreenId: "play_petanque_lancer_draw",
  widget: {
    id: "play-lancer-draw",
    kind: "throw-draw",
    label: "Throw Draw",
    topic: "/petanque_throw/draw",
    angleTopic: "/petanque_throw/angle_between_start_and_finish",
    powerTopic: "/petanque_throw/total_duration",
    alphaTopic: "/petanque_throw/alpha",
    alphaMin: 0,
    alphaMax: 40,
    alphaSafeMax: 20,
    angleMin: -1.57,
    angleMax: 1.57,
    durationMin: 0.9,
    durationMax: 3.0,
    holdToMaxMs: 1200,
    rect: { x: 0, y: 0, w: 10, h: 10 },
  } as never,
  widgets: [
    {
      id: "alpha-widget",
      kind: "max-velocity",
      label: "Alpha",
      topic: "/petanque_throw/alpha",
      min: 0,
      max: 40,
      step: 1,
      rect: { x: 0, y: 0, w: 10, h: 10 },
    } as never,
  ],
  state: {
    petanqueFlowStage: "start_ready" as const,
    measureViewMode: "live" as const,
    measureRequestPending: false,
    measureResultImageDataUrl: null,
    capturedMeasureImageDataUrl: null,
    measureResultHistory: [],
    measureVectorsJson: null,
    measureStatusText: "",
    measureLastUpdatedAtMs: null,
    maxVelocityWidgetValues: {
      "alpha-widget": 12,
    },
    throwDrawWidgetValues: {},
    throwDrawAlphaValues: {},
    petanqueAlphaUnsafeValidated: false,
  },
  actions: {
    setMeasureResultImageDataUrl: vi.fn(),
    setMeasureVectorsJson: vi.fn(),
    setMeasureLastUpdatedAtMs: vi.fn(),
    setMeasureStatusText: vi.fn(),
    setMeasureRequestPending: vi.fn(),
    setMeasureViewMode: vi.fn(),
    setMeasureResultHistory: vi.fn(),
    setCapturedMeasureImageDataUrl: vi.fn(),
    setPetanqueFlowStage: vi.fn(),
    setPetanqueAlpha: vi.fn(),
    setPetanqueAlphaUnsafeValidated: vi.fn(),
    setMaxVelocityWidgetValues: vi.fn(),
    setThrowDrawWidgetValues: vi.fn(),
    setThrowDrawAlphaValues: vi.fn(),
    confirmAction: vi.fn(() => true),
    sendPetanqueStateCommand: vi.fn(),
    markWidgetPulse: vi.fn(),
    sendMessage: vi.fn(),
  },
});

describe("petanque throw-draw runtime", () => {
  it("resolves throw-draw values from local runtime state", () => {
    const resolved = resolvePetanqueThrowDrawState(createArgs());

    expect(resolved).toMatchObject({
      angleValue: 0,
      durationValue: 1.1,
      alphaValue: 12,
      hasAlphaControl: true,
    });
  });

  it("handles throw-draw changes through runtime actions", () => {
    const args = createArgs();

    expect(
      handlePetanqueThrowDrawChange({
        ...args,
        next: {
          angle: 0.5,
          duration: 1.4,
          alpha: 24,
          powerPercent: 60,
          throwRequested: true,
        },
      })
    ).toBe(true);

    expect(args.actions.setThrowDrawWidgetValues).toHaveBeenCalled();
    expect(args.actions.setMaxVelocityWidgetValues).toHaveBeenCalled();
    expect(args.actions.setPetanqueAlpha).toHaveBeenCalledWith(24);
    expect(args.actions.setPetanqueAlphaUnsafeValidated).toHaveBeenCalledWith(true);
    expect(args.actions.sendMessage).toHaveBeenCalledWith({
      type: "petanque_cfg",
      total_duration: 1.4,
      angle_between_start_and_finish: 0.5,
    });
    expect(args.actions.sendPetanqueStateCommand).toHaveBeenCalledWith("throw");
    expect(args.actions.markWidgetPulse).toHaveBeenCalledWith("play-lancer-draw");
  });
});
