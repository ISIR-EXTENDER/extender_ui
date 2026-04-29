import { describe, expect, it } from "vitest";

import {
  PETANQUE_ALPHA_MAX,
  PETANQUE_ALPHA_SAFE_MAX,
  PETANQUE_DEFAULT_ALPHA,
  PETANQUE_DEFAULT_TOTAL_DURATION_S,
  buildPetanqueCfgUpdate,
  buildPetanqueStateCommandMessage,
  buildPetanqueThrowCfgUpdate,
  clampPetanqueDuration,
  formatPetanquePowerPercent,
  isPetanqueCfgUpdateEmpty,
  resolvePetanqueAlphaPresetValue,
  resolvePetanqueMaxVelocityPresentation,
  resolvePetanqueMaxVelocityValue,
  resolvePetanqueThrowDrawValue,
  syncPetanqueAlphaWidgets,
} from "./controlRuntime";
import {
  PETANQUE_ALPHA_TOPIC,
  PETANQUE_ANGLE_TOPIC,
  PETANQUE_TOTAL_DURATION_TOPIC,
} from "../../pages/applicationTopics";

describe("petanque control runtime", () => {
  it("clamps durations and formats power percentage", () => {
    expect(clampPetanqueDuration(0.1)).toBeGreaterThanOrEqual(0.9);
    expect(clampPetanqueDuration(99)).toBeLessThanOrEqual(3);
    expect(formatPetanquePowerPercent(1, 0, 2, false)).toBe("Power 50%");
  });

  it("resolves preset values and state command messages", () => {
    expect(resolvePetanqueAlphaPresetValue("pointer")).toBe(20);
    expect(resolvePetanqueAlphaPresetValue("tirer")).toBe(0);
    expect(buildPetanqueStateCommandMessage("throw")).toEqual({
      type: "state_cmd",
      command: "throw",
    });
  });

  it("syncs petanque alpha across related widgets", () => {
    const synced = syncPetanqueAlphaWidgets(
      [
        {
          id: "draw-alpha",
          kind: "throw-draw",
          label: "Draw",
          topic: "/petanque_throw/draw",
          angleTopic: PETANQUE_ANGLE_TOPIC,
          powerTopic: PETANQUE_TOTAL_DURATION_TOPIC,
          alphaTopic: PETANQUE_ALPHA_TOPIC,
          angleMin: -1,
          angleMax: 1,
          durationMin: 0.5,
          durationMax: 2,
          holdToMaxMs: 1000,
          rect: { x: 0, y: 0, w: 10, h: 10 },
        } as never,
        {
          id: "max-alpha",
          kind: "max-velocity",
          label: "Alpha",
          topic: PETANQUE_ALPHA_TOPIC,
          min: 0,
          max: 40,
          step: 1,
          rect: { x: 0, y: 0, w: 10, h: 10 },
        } as never,
      ],
      12,
      {},
      {}
    );

    expect(synced.nextThrowDrawAlphaValues["draw-alpha"]).toBe(12);
    expect(synced.nextMaxVelocityWidgetValues["max-alpha"]).toBe(12);
  });

  it("derives throw-draw runtime defaults", () => {
    const resolved = resolvePetanqueThrowDrawValue(
      {
        id: "draw",
        kind: "throw-draw",
        label: "Draw",
        topic: "/petanque_throw/draw",
        angleTopic: PETANQUE_ANGLE_TOPIC,
        powerTopic: PETANQUE_TOTAL_DURATION_TOPIC,
        alphaTopic: PETANQUE_ALPHA_TOPIC,
        angleMin: -1,
        angleMax: 1,
        durationMin: 0.5,
        durationMax: 2,
        holdToMaxMs: 1000,
        rect: { x: 0, y: 0, w: 10, h: 10 },
      } as never,
      {},
      {},
      undefined
    );

    expect(resolved.clampedAngle).toBe(0);
    expect(resolved.clampedDuration).toBe(PETANQUE_DEFAULT_TOTAL_DURATION_S);
    expect(resolved.drawAlphaValue).toBe(PETANQUE_DEFAULT_ALPHA);
    expect(resolved.alphaMax).toBe(PETANQUE_ALPHA_MAX);
  });

  it("derives petanque max-velocity presentation and defaults", () => {
    const presentation = resolvePetanqueMaxVelocityPresentation({
      id: "duration",
      kind: "max-velocity",
      label: "Duration",
      topic: PETANQUE_TOTAL_DURATION_TOPIC,
      min: 0.9,
      max: 3,
      step: 0.1,
      rect: { x: 0, y: 0, w: 10, h: 10 },
    } as never);

    expect(presentation.reverseDirection).toBe(true);
    expect(presentation.endpointLabels).toEqual({ left: "Slow", right: "Fast" });
    expect(presentation.bubbleValueFormatter?.(1.95)).toContain("Power");

    expect(resolvePetanqueMaxVelocityValue(PETANQUE_TOTAL_DURATION_TOPIC, "missing", {})).toBe(
      PETANQUE_DEFAULT_TOTAL_DURATION_S
    );
    expect(resolvePetanqueMaxVelocityValue(PETANQUE_ANGLE_TOPIC, "missing", {})).toBe(0);
    expect(resolvePetanqueMaxVelocityValue(PETANQUE_ALPHA_TOPIC, "missing", {})).toBe(
      PETANQUE_DEFAULT_ALPHA
    );
    expect(resolvePetanqueMaxVelocityValue("/custom", "missing", {})).toBeNull();
  });

  it("builds petanque config updates for scalar and throw-draw widgets", () => {
    expect(buildPetanqueCfgUpdate(PETANQUE_TOTAL_DURATION_TOPIC, 9)).toEqual({
      type: "petanque_cfg",
      total_duration: 3,
    });
    expect(buildPetanqueCfgUpdate(PETANQUE_ANGLE_TOPIC, 0.4)).toEqual({
      type: "petanque_cfg",
      angle_between_start_and_finish: 0.4,
    });
    expect(buildPetanqueCfgUpdate(PETANQUE_ALPHA_TOPIC, PETANQUE_ALPHA_SAFE_MAX + 1)).toEqual({
      type: "petanque_cfg",
      alpha: PETANQUE_ALPHA_SAFE_MAX + 1,
    });
    expect(buildPetanqueCfgUpdate("/custom", 1)).toBeNull();

    const cfg = buildPetanqueThrowCfgUpdate(
      {
        id: "draw",
        kind: "throw-draw",
        label: "Draw",
        topic: "/petanque_throw/draw",
        angleTopic: PETANQUE_ANGLE_TOPIC,
        powerTopic: PETANQUE_TOTAL_DURATION_TOPIC,
        angleMin: -1,
        angleMax: 1,
        durationMin: 0.5,
        durationMax: 2,
        holdToMaxMs: 1000,
        rect: { x: 0, y: 0, w: 10, h: 10 },
      } as never,
      0.25,
      4
    );

    expect(cfg).toEqual({
      total_duration: 3,
      angle_between_start_and_finish: 0.25,
    });
    expect(isPetanqueCfgUpdateEmpty(cfg)).toBe(false);
    expect(isPetanqueCfgUpdateEmpty({})).toBe(true);
  });
});
