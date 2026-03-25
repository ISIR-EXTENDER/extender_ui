import { describe, expect, it, vi } from "vitest";

import {
  PETANQUE_STATE_TOPIC,
  PLAY_PETANQUE_MEASURE_REFRESH_TOPIC,
} from "../../pages/applicationTopics";
import { petanqueRuntimePlugin } from "../../apps/petanque/runtime";
import { resolveApplicationRuntimePlugins } from "./registry";
import type { ApplicationRuntimeButtonArgs, ApplicationRuntimeMessageArgs } from "./types";

const createRuntimeState = () => ({
  petanqueFlowStage: "teleop" as const,
  measureViewMode: "live" as const,
  measureRequestPending: false,
  measureResultImageDataUrl: null,
  capturedMeasureImageDataUrl: null,
  measureResultHistory: [],
});

const createRuntimeActions = () => ({
  setMeasureResultImageDataUrl: vi.fn(),
  setMeasureVectorsJson: vi.fn(),
  setMeasureLastUpdatedAtMs: vi.fn(),
  setMeasureStatusText: vi.fn(),
  setMeasureRequestPending: vi.fn(),
  setMeasureViewMode: vi.fn(),
  setMeasureResultHistory: vi.fn(),
  setCapturedMeasureImageDataUrl: vi.fn(),
  setPetanqueFlowStage: vi.fn(),
  markWidgetPulse: vi.fn(),
  sendMessage: vi.fn(),
});

describe("petanqueRuntimePlugin", () => {
  it("matches petanque and sandbox runtimes through the registry", () => {
    const petanquePlugins = resolveApplicationRuntimePlugins({
      application: {
        id: "application-play-petanque",
        name: "PlayPetanque",
        screenIds: ["play_petanque_measures"],
        homeScreenId: "play_petanque_measures",
        updatedAt: new Date().toISOString(),
      },
      activeScreenId: "play_petanque_measures",
    });
    expect(petanquePlugins.map((plugin) => plugin.id)).toContain("petanque");

    const sandboxPlugins = resolveApplicationRuntimePlugins({
      application: {
        id: "application-95a8",
        name: "SandboxV0.0",
        screenIds: ["sandbox_control"],
        homeScreenId: "sandbox_control",
        updatedAt: new Date().toISOString(),
      },
      activeScreenId: "sandbox_control",
    });
    expect(sandboxPlugins.map((plugin) => plugin.id)).toContain("sandbox");
  });

  it("maps measure websocket messages into runtime state actions", () => {
    const actions = createRuntimeActions();
    const args: ApplicationRuntimeMessageArgs = {
      application: null,
      activeScreenId: "play_petanque_measures",
      message: {
        type: "measure_result",
        image_data_url: "data:image/jpeg;base64,opencv",
        vectors_json: '{"distance":12}',
        updated_at_ms: 123,
      },
      widgets: [],
      state: createRuntimeState(),
      actions,
    };

    expect(petanqueRuntimePlugin.handleIncomingMessage?.(args)).toBe(true);
    expect(actions.setMeasureResultImageDataUrl).toHaveBeenCalledWith(
      "data:image/jpeg;base64,opencv"
    );
    expect(actions.setMeasureVectorsJson).toHaveBeenCalledWith('{"distance":12}');
    expect(actions.setMeasureRequestPending).toHaveBeenCalledWith(false);
    expect(actions.setMeasureViewMode).toHaveBeenCalledWith("result");
    expect(actions.setMeasureResultHistory).toHaveBeenCalled();
  });

  it("derives button presentation for petanque state-machine buttons", () => {
    const presentation = petanqueRuntimePlugin.getButtonPresentation?.({
      application: null,
      activeScreenId: "petanque",
      widget: {
        id: "throw",
        kind: "button",
        label: "Throw",
        topic: PETANQUE_STATE_TOPIC,
        payload: "throw",
        x: 0,
        y: 0,
        width: 10,
        height: 10,
      } as never,
      widgets: [],
      state: createRuntimeState(),
      actions: createRuntimeActions(),
    });

    expect(presentation).toMatchObject({
      disabled: true,
      tone: "danger",
    });
  });

  it("routes state-machine triggers through the generic runtime action API", () => {
    const actions = createRuntimeActions();
    const args: ApplicationRuntimeButtonArgs = {
      application: null,
      activeScreenId: "petanque",
      widget: {
        id: "teleop",
        kind: "button",
        label: "Teleop",
        topic: PETANQUE_STATE_TOPIC,
        payload: "teleop",
        x: 0,
        y: 0,
        width: 10,
        height: 10,
      } as never,
      widgets: [],
      state: createRuntimeState(),
      actions,
    };

    expect(petanqueRuntimePlugin.handleButtonTrigger?.(args)).toBe(true);
    expect(actions.sendMessage).toHaveBeenCalledWith({
      type: "state_cmd",
      command: "teleop",
    });
    expect(actions.setPetanqueFlowStage).toHaveBeenCalledWith("teleop");
    expect(actions.markWidgetPulse).toHaveBeenCalledWith("teleop");
  });

  it("handles measure refresh through the plugin button hook", () => {
    const actions = createRuntimeActions();
    const args: ApplicationRuntimeButtonArgs = {
      application: null,
      activeScreenId: "play_petanque_measures",
      widget: {
        id: "refresh",
        kind: "button",
        label: "Refresh",
        topic: PLAY_PETANQUE_MEASURE_REFRESH_TOPIC,
        payload: "",
        x: 0,
        y: 0,
        width: 10,
        height: 10,
      } as never,
      widgets: [],
      state: createRuntimeState(),
      actions,
    };

    expect(petanqueRuntimePlugin.handleButtonTrigger?.(args)).toBe(true);
    expect(actions.sendMessage).toHaveBeenCalledWith({ type: "measure_refresh" });
    expect(actions.setMeasureViewMode).toHaveBeenCalledWith("result");
    expect(actions.markWidgetPulse).toHaveBeenCalledWith("refresh");
  });
});
