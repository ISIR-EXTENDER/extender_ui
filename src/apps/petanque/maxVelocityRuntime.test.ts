import { describe, expect, it, vi } from "vitest";

import { handlePetanqueMaxVelocityChange } from "./maxVelocityRuntime";

const createArgs = () => ({
  application: null,
  activeScreenId: "play_petanque_lancer",
  widget: {
    id: "play-lancer-alpha",
    kind: "max-velocity",
    label: "Alpha",
    topic: "/petanque_throw/alpha",
    min: 0,
    max: 40,
    step: 1,
    rect: { x: 0, y: 0, w: 10, h: 10 },
  } as never,
  widgets: [],
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
    maxVelocityWidgetValues: {},
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
    confirmAction: vi.fn(() => false),
    sendPetanqueStateCommand: vi.fn(),
    markWidgetPulse: vi.fn(),
    sendMessage: vi.fn(),
  },
});

describe("petanque max-velocity runtime", () => {
  it("clamps unsafe alpha when the operator does not confirm it", () => {
    const args = createArgs();

    expect(
      handlePetanqueMaxVelocityChange({
        ...args,
        nextValue: 25,
      })
    ).toEqual({ value: 20 });
    expect(args.actions.sendMessage).toHaveBeenCalledWith({
      type: "petanque_cfg",
      alpha: 20,
    });
  });

  it("passes through non-petanque topics", () => {
    const args = createArgs();

    expect(
      handlePetanqueMaxVelocityChange({
        ...args,
        widget: {
          id: "sandbox-max-velocity",
          kind: "max-velocity",
          label: "Max Velocity",
          topic: "/cmd/max_velocity",
          min: 0.1,
          max: 3,
          step: 0.1,
          rect: { x: 0, y: 0, w: 10, h: 10 },
        },
        nextValue: 1.2,
      })
    ).toBeNull();
  });
});
