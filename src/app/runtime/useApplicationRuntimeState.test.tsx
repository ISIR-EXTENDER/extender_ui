import { renderHook, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { wsClient } from "../../services/wsClient";
import { useApplicationRuntimeState } from "./useApplicationRuntimeState";

describe("useApplicationRuntimeState", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends the default petanque duration once when the petanque runtime connects", () => {
    const sendSpy = vi.spyOn(wsClient, "send").mockImplementation(() => {});
    vi.spyOn(wsClient, "onMessage").mockImplementation(() => () => true);

    renderHook(() =>
      useApplicationRuntimeState({
        activeApplication: null,
        activeScreenId: "petanque",
        activeRuntimePlugins: [],
        widgets: [
          {
            id: "duration",
            kind: "max-velocity",
            label: "Throw duration",
            topic: "/petanque_throw/total_duration",
            min: 0.9,
            max: 3,
            step: 0.1,
            rect: { x: 0, y: 0, w: 10, h: 10 },
          } as never,
        ],
        wsStatus: "connected",
        markWidgetPulse: vi.fn(),
      })
    );

    expect(sendSpy).toHaveBeenCalledWith({
      type: "petanque_cfg",
      total_duration: 1.1,
    });
  });

  it("updates petanque alpha-linked widget state through the runtime action API", () => {
    const sendSpy = vi.spyOn(wsClient, "send").mockImplementation(() => {});
    vi.spyOn(wsClient, "onMessage").mockImplementation(() => () => true);

    const { result } = renderHook(() =>
      useApplicationRuntimeState({
        activeApplication: null,
        activeScreenId: "play_petanque_lancer_draw",
        activeRuntimePlugins: [],
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
          {
            id: "draw-widget",
            kind: "throw-draw",
            label: "Draw",
            topic: "/petanque_throw/draw",
            angleTopic: "/petanque_throw/angle_between_start_and_finish",
            powerTopic: "/petanque_throw/total_duration",
            alphaTopic: "/petanque_throw/alpha",
            angleMin: -1,
            angleMax: 1,
            durationMin: 0.9,
            durationMax: 3,
            holdToMaxMs: 1000,
            rect: { x: 0, y: 0, w: 10, h: 10 },
          } as never,
        ],
        wsStatus: "disconnected",
        markWidgetPulse: vi.fn(),
      })
    );

    act(() => {
      result.current.runtimePluginActions.setPetanqueAlpha(18);
    });

    expect(sendSpy).toHaveBeenCalledWith({
      type: "petanque_cfg",
      alpha: 18,
    });
    expect(result.current.runtimePluginState.maxVelocityWidgetValues["alpha-widget"]).toBe(18);
    expect(result.current.runtimePluginState.throwDrawAlphaValues["draw-widget"]).toBe(18);
  });

  it("lets runtime plugins update state from incoming websocket messages", () => {
    const sendSpy = vi.spyOn(wsClient, "send").mockImplementation(() => {});
    let messageHandler: ((message: unknown) => void) | null = null;
    vi.spyOn(wsClient, "onMessage").mockImplementation((handler) => {
      messageHandler = handler as (message: unknown) => void;
      return () => {
        messageHandler = null;
        return true;
      };
    });

    const { result } = renderHook(() =>
      useApplicationRuntimeState({
        activeApplication: null,
        activeScreenId: "sandbox_control",
        activeRuntimePlugins: [
          {
            id: "test-plugin",
            matches: () => true,
            handleIncomingMessage: ({ actions, message }) => {
              if (message.type !== "event") return false;
              actions.setMeasureStatusText("Injected status");
              return true;
            },
          },
        ],
        widgets: [],
        wsStatus: "disconnected",
        markWidgetPulse: vi.fn(),
      })
    );

    act(() => {
      messageHandler?.({
        type: "event",
        severity: "info",
        code: "TEST",
        message: "hello",
      });
    });

    expect(sendSpy).not.toHaveBeenCalled();
    expect(result.current.runtimePluginState.measureStatusText).toBe("Injected status");
  });
});
