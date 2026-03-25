import { describe, expect, it } from "vitest";

import { sandboxRuntimePlugin } from "./runtime";

describe("sandboxRuntimePlugin", () => {
  it("decorates the sandbox max-velocity widget with sandbox defaults", () => {
    const runtimeState = sandboxRuntimePlugin.getMaxVelocityState?.({
      application: {
        id: "application-95a8",
        name: "SandboxV0.0",
        screenIds: ["sandbox_control"],
        homeScreenId: "sandbox_control",
        updatedAt: new Date().toISOString(),
      },
      activeScreenId: "sandbox_control",
      widget: {
        id: "sandbox-max-velocity",
        kind: "max-velocity",
        label: "Max Velocity",
        topic: "/cmd/max_velocity",
        min: 0.1,
        max: 3,
        step: 0.1,
        rect: { x: 0, y: 0, w: 10, h: 10 },
      } as never,
      widgets: [],
      state: {
        petanqueFlowStage: "teleop",
        measureViewMode: "live",
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
        setMeasureResultImageDataUrl: () => {},
        setMeasureVectorsJson: () => {},
        setMeasureLastUpdatedAtMs: () => {},
        setMeasureStatusText: () => {},
        setMeasureRequestPending: () => {},
        setMeasureViewMode: () => {},
        setMeasureResultHistory: () => {},
        setCapturedMeasureImageDataUrl: () => {},
        setPetanqueFlowStage: () => {},
        setPetanqueAlpha: () => {},
        setPetanqueAlphaUnsafeValidated: () => {},
        setMaxVelocityWidgetValues: () => {},
        setThrowDrawWidgetValues: () => {},
        setThrowDrawAlphaValues: () => {},
        confirmAction: () => true,
        sendPetanqueStateCommand: () => {},
        markWidgetPulse: () => {},
        sendMessage: () => {},
      },
    });

    expect(runtimeState).toMatchObject({
      reverseDirection: false,
      endpointLabels: {
        left: "Precise",
        right: "Fast",
      },
    });
  });
});
