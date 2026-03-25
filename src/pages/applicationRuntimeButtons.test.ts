import { describe, expect, it } from "vitest";

import {
  PLAY_PETANQUE_MEASURE_CAPTURE_TOPIC,
  PLAY_PETANQUE_MEASURE_REQUEST_TOPIC,
  PLAY_PETANQUE_MEASURE_VIEW_LIVE_TOPIC,
  PLAY_PETANQUE_MEASURE_VIEW_RESULT_TOPIC,
} from "./applicationTopics";
import {
  getMeasureButtonState,
  getPetanqueButtonState,
  isMeasureButtonTopic,
  isPetanqueStateCommand,
  resolvePetanqueAlphaPreset,
  resolvePetanqueFlowStageAfterCommand,
} from "./applicationRuntimeButtons";

describe("applicationRuntimeButtons", () => {
  it("detects measure and petanque command topics", () => {
    expect(isMeasureButtonTopic(PLAY_PETANQUE_MEASURE_CAPTURE_TOPIC)).toBe(true);
    expect(isMeasureButtonTopic("/custom/topic")).toBe(false);
    expect(isPetanqueStateCommand("throw")).toBe(true);
    expect(isPetanqueStateCommand("launch")).toBe(false);
  });

  it("resolves petanque alpha presets", () => {
    expect(resolvePetanqueAlphaPreset("Pointer")).toBe("pointer");
    expect(resolvePetanqueAlphaPreset("tirer")).toBe("tirer");
    expect(resolvePetanqueAlphaPreset("unknown")).toBeNull();
  });

  it("computes petanque flow transitions", () => {
    expect(resolvePetanqueFlowStageAfterCommand("teleop")).toBe("teleop");
    expect(resolvePetanqueFlowStageAfterCommand("pick_up")).toBe("teleop");
    expect(resolvePetanqueFlowStageAfterCommand("activate_throw")).toBe("start_ready");
    expect(resolvePetanqueFlowStageAfterCommand("throw")).toBe("start_ready");
  });

  it("derives petanque button state for each command family", () => {
    expect(getPetanqueButtonState("teleop", "teleop")).toEqual({
      disabled: false,
      active: true,
      tone: "default",
    });
    expect(getPetanqueButtonState("activate_throw", "start_ready")).toEqual({
      disabled: false,
      active: true,
      tone: "accent",
    });
    expect(getPetanqueButtonState("go_to_start", "teleop")).toEqual({
      disabled: true,
      active: false,
      tone: "success",
    });
    expect(getPetanqueButtonState("throw", "teleop")).toEqual({
      disabled: true,
      active: false,
      tone: "danger",
    });
    expect(getPetanqueButtonState("pick_up", "start_ready")).toEqual({
      disabled: false,
      active: false,
      tone: "accent",
    });
    expect(getPetanqueButtonState("stop", "start_ready")).toEqual({
      disabled: false,
      active: false,
      tone: "danger",
    });
    expect(getPetanqueButtonState("test_loop", "teleop")).toEqual({
      disabled: false,
      active: false,
      tone: "accent",
    });
  });

  it("computes measure button state from view mode and request status", () => {
    expect(getMeasureButtonState(PLAY_PETANQUE_MEASURE_REQUEST_TOPIC, "live", true, "default")).toEqual({
      active: false,
      tone: "success",
      disabled: true,
    });
    expect(getMeasureButtonState(PLAY_PETANQUE_MEASURE_CAPTURE_TOPIC, "live", false, "default")).toEqual({
      active: false,
      tone: "accent",
      disabled: false,
    });
    expect(getMeasureButtonState(PLAY_PETANQUE_MEASURE_VIEW_LIVE_TOPIC, "live", false, "default")).toEqual({
      active: true,
      tone: "accent",
      disabled: false,
    });
    expect(
      getMeasureButtonState(PLAY_PETANQUE_MEASURE_VIEW_RESULT_TOPIC, "result", false, "danger")
    ).toEqual({
      active: true,
      tone: "accent",
      disabled: false,
    });
  });
});
