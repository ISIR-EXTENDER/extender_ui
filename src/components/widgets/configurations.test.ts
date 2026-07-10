import { afterEach, describe, expect, it } from "vitest";

import { DEFAULT_CANVAS_SETTINGS } from "./canvasSettings";
import {
  loadConfigurationsFromLocalStorage,
  upsertConfiguration,
  type WidgetConfiguration,
} from "./configurations";
import type { CanvasWidget } from "./widgetTypes";

const STORAGE_KEY = "extender.controls.widget-configurations.v1";

const buttonWidget: CanvasWidget = {
  id: "test-button",
  kind: "button",
  label: "Test",
  topic: "/test",
  payload: "test",
  rect: { x: 0, y: 0, w: 100, h: 50 },
};

const createConfiguration = (
  overrides: Partial<WidgetConfiguration> = {}
): WidgetConfiguration => ({
  name: "test_screen",
  widgets: [],
  poses: [],
  canvas: DEFAULT_CANVAS_SETTINGS,
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("upsertConfiguration", () => {
  it("preserves updatedAt when the screen content did not change", () => {
    const existing = createConfiguration();
    const configurations = [existing];

    const result = upsertConfiguration(
      configurations,
      existing.name,
      existing.widgets,
      existing.poses,
      existing.canvas,
      "2026-07-09T12:00:00.000Z"
    );

    expect(result).toBe(configurations);
    expect(result[0]?.updatedAt).toBe(existing.updatedAt);
  });

  it("uses the provided updatedAt when the screen content changed", () => {
    const existing = createConfiguration();

    const result = upsertConfiguration(
      [existing],
      existing.name,
      [buttonWidget],
      existing.poses,
      existing.canvas,
      "2026-07-09T12:00:00.000Z"
    );

    expect(result[0]?.widgets).toEqual([buttonWidget]);
    expect(result[0]?.updatedAt).toBe("2026-07-09T12:00:00.000Z");
  });
});

describe("widget configuration migrations", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("normalizes existing generic teleop max velocity widgets", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          name: "control_panel",
          widgets: [
            {
              id: "control-panel-max-velocity",
              kind: "max-velocity",
              label: "Max Velocity",
              topic: "/cmd/max_velocity",
              min: 0.1,
              max: 3,
              step: 0.1,
              rect: { x: 610, y: 20, w: 640, h: 145 },
            },
          ],
          poses: [],
          canvas: { presetId: "hd", runtimeMode: "fit" },
          updatedAt: "2026-02-24T00:00:00.000Z",
        },
      ])
    );

    const controlPanel = loadConfigurationsFromLocalStorage().find(
      (configuration) => configuration.name === "control_panel"
    );
    const maxVelocityWidget = controlPanel?.widgets.find(
      (widget) => widget.id === "control-panel-max-velocity"
    );

    expect(maxVelocityWidget).toMatchObject({
      kind: "max-velocity",
      topic: "/cmd/max_velocity",
      min: 0,
      max: 1,
      step: 0.01,
    });
  });
});
