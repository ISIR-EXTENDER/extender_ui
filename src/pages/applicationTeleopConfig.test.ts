import { describe, expect, it, vi } from "vitest";

import {
  TELEOP_CONFIG_ANGULAR_SCALE_X_TOPIC,
  TELEOP_CONFIG_ANGULAR_SCALE_Y_TOPIC,
  TELEOP_CONFIG_ANGULAR_SCALE_Z_TOPIC,
  TELEOP_CONFIG_INVERT_ANGULAR_X_TOPIC,
  TELEOP_CONFIG_INVERT_ANGULAR_Y_TOPIC,
  TELEOP_CONFIG_INVERT_ANGULAR_Z_TOPIC,
  TELEOP_CONFIG_INVERT_LINEAR_X_TOPIC,
  TELEOP_CONFIG_LEGACY_SCALE_X_TOPIC,
  TELEOP_CONFIG_LEGACY_SCALE_Y_TOPIC,
  TELEOP_CONFIG_LEGACY_SCALE_Z_TOPIC,
  TELEOP_CONFIG_RESET_TOPIC,
  TELEOP_CONFIG_ROTATION_GAIN_TOPIC,
  TELEOP_CONFIG_SAVE_PROFILE_TOPIC,
  TELEOP_CONFIG_SWAP_XY_TOPIC,
  TELEOP_CONFIG_TRANSLATION_GAIN_TOPIC,
} from "./applicationTopics";
import {
  applyTeleopConfigScalarValue,
  getTeleopConfigButtonLabel,
  getTeleopConfigButtonState,
  isTeleopConfigButtonTopic,
  resolveTeleopConfigScalarValue,
  triggerTeleopConfigButton,
  type TeleopConfigButtonActions,
  type TeleopConfigButtonSnapshot,
  type TeleopConfigScalarActions,
  type TeleopConfigScalarSnapshot,
} from "./applicationTeleopConfig";

const buttonSnapshot: TeleopConfigButtonSnapshot = {
  swapXY: true,
  invertLinearX: false,
  invertLinearY: false,
  invertLinearZ: false,
  invertAngularX: false,
  invertAngularY: false,
  invertAngularZ: false,
};

const scalarSnapshot: TeleopConfigScalarSnapshot = {
  maxVelocity: 0.8,
  translationGain: 0.7,
  rotationGain: 0.6,
  scaleX: 0.5,
  scaleY: 0.4,
  scaleZ: 0.3,
  angularScaleX: 0.2,
  angularScaleY: 0.1,
  angularScaleZ: 0.9,
};

const createButtonActions = (): TeleopConfigButtonActions => ({
  setSwapXY: vi.fn(),
  setInvertLinearX: vi.fn(),
  setInvertLinearY: vi.fn(),
  setInvertLinearZ: vi.fn(),
  setInvertAngularX: vi.fn(),
  setInvertAngularY: vi.fn(),
  setInvertAngularZ: vi.fn(),
  resetTeleopConfig: vi.fn(),
  saveTeleopProfile: vi.fn(),
});

const createScalarActions = (): TeleopConfigScalarActions => ({
  setMaxVelocity: vi.fn(),
  setTranslationGain: vi.fn(),
  setRotationGain: vi.fn(),
  setScaleX: vi.fn(),
  setScaleY: vi.fn(),
  setScaleZ: vi.fn(),
  setAngularScaleX: vi.fn(),
  setAngularScaleY: vi.fn(),
  setAngularScaleZ: vi.fn(),
});

describe("applicationTeleopConfig", () => {
  it("detects teleop config button topics", () => {
    expect(isTeleopConfigButtonTopic(TELEOP_CONFIG_SWAP_XY_TOPIC)).toBe(true);
    expect(isTeleopConfigButtonTopic("/custom/topic")).toBe(false);
  });

  it("derives button state and label from the snapshot", () => {
    expect(getTeleopConfigButtonState(TELEOP_CONFIG_SWAP_XY_TOPIC, buttonSnapshot)).toEqual({
      active: true,
      tone: "accent",
    });
    expect(getTeleopConfigButtonLabel(TELEOP_CONFIG_SWAP_XY_TOPIC, "Swap", buttonSnapshot)).toBe(
      "Swap XY ON"
    );
    expect(
      getTeleopConfigButtonState(TELEOP_CONFIG_INVERT_LINEAR_X_TOPIC, buttonSnapshot)
    ).toEqual({
      active: false,
      tone: "default",
    });
    expect(
      getTeleopConfigButtonState(TELEOP_CONFIG_INVERT_ANGULAR_Z_TOPIC, {
        ...buttonSnapshot,
        invertAngularZ: true,
      })
    ).toEqual({
      active: true,
      tone: "danger",
    });
    expect(
      getTeleopConfigButtonLabel(TELEOP_CONFIG_INVERT_ANGULAR_Y_TOPIC, "AY", {
        ...buttonSnapshot,
        invertAngularY: true,
      })
    ).toBe("AY -");
    expect(getTeleopConfigButtonState("/unknown/topic", buttonSnapshot)).toBeNull();
  });

  it("triggers teleop config button actions with the expected semantics", () => {
    const actions = createButtonActions();

    expect(triggerTeleopConfigButton(TELEOP_CONFIG_SWAP_XY_TOPIC, buttonSnapshot, actions)).toBe(
      true
    );
    expect(actions.setSwapXY).toHaveBeenCalledWith(false);

    expect(triggerTeleopConfigButton(TELEOP_CONFIG_RESET_TOPIC, buttonSnapshot, actions)).toBe(
      true
    );
    expect(actions.resetTeleopConfig).toHaveBeenCalled();

    expect(
      triggerTeleopConfigButton(TELEOP_CONFIG_SAVE_PROFILE_TOPIC, buttonSnapshot, actions)
    ).toBe(true);
    expect(actions.saveTeleopProfile).toHaveBeenCalledWith("explorer");

    expect(
      triggerTeleopConfigButton(
        TELEOP_CONFIG_INVERT_ANGULAR_X_TOPIC,
        { ...buttonSnapshot, invertAngularX: true },
        actions
      )
    ).toBe(true);
    expect(actions.setInvertAngularX).toHaveBeenCalledWith(false);
    expect(triggerTeleopConfigButton("/unknown/topic", buttonSnapshot, actions)).toBe(false);
  });

  it("maps scalar topics to the correct snapshot value and action", () => {
    expect(resolveTeleopConfigScalarValue("/cmd/max_velocity", scalarSnapshot)).toBe(0.8);
    expect(resolveTeleopConfigScalarValue(TELEOP_CONFIG_LEGACY_SCALE_X_TOPIC, scalarSnapshot)).toBe(
      0.5
    );
    expect(resolveTeleopConfigScalarValue(TELEOP_CONFIG_TRANSLATION_GAIN_TOPIC, scalarSnapshot)).toBe(
      0.7
    );
    expect(resolveTeleopConfigScalarValue(TELEOP_CONFIG_ROTATION_GAIN_TOPIC, scalarSnapshot)).toBe(
      0.6
    );
    expect(resolveTeleopConfigScalarValue(TELEOP_CONFIG_LEGACY_SCALE_Y_TOPIC, scalarSnapshot)).toBe(
      0.4
    );
    expect(resolveTeleopConfigScalarValue(TELEOP_CONFIG_LEGACY_SCALE_Z_TOPIC, scalarSnapshot)).toBe(
      0.3
    );
    expect(resolveTeleopConfigScalarValue(TELEOP_CONFIG_ANGULAR_SCALE_X_TOPIC, scalarSnapshot)).toBe(
      0.2
    );
    expect(resolveTeleopConfigScalarValue(TELEOP_CONFIG_ANGULAR_SCALE_Y_TOPIC, scalarSnapshot)).toBe(
      0.1
    );
    expect(resolveTeleopConfigScalarValue(TELEOP_CONFIG_ANGULAR_SCALE_Z_TOPIC, scalarSnapshot)).toBe(
      0.9
    );

    const actions = createScalarActions();
    expect(applyTeleopConfigScalarValue(TELEOP_CONFIG_LEGACY_SCALE_X_TOPIC, 0.25, actions)).toBe(
      true
    );
    expect(actions.setScaleX).toHaveBeenCalledWith(0.25);
    expect(applyTeleopConfigScalarValue(TELEOP_CONFIG_LEGACY_SCALE_Y_TOPIC, 0.35, actions)).toBe(
      true
    );
    expect(actions.setScaleY).toHaveBeenCalledWith(0.35);
    expect(applyTeleopConfigScalarValue(TELEOP_CONFIG_LEGACY_SCALE_Z_TOPIC, 0.45, actions)).toBe(
      true
    );
    expect(actions.setScaleZ).toHaveBeenCalledWith(0.45);
    expect(
      applyTeleopConfigScalarValue(TELEOP_CONFIG_TRANSLATION_GAIN_TOPIC, 0.55, actions)
    ).toBe(true);
    expect(actions.setTranslationGain).toHaveBeenCalledWith(0.55);
    expect(applyTeleopConfigScalarValue(TELEOP_CONFIG_ROTATION_GAIN_TOPIC, 0.65, actions)).toBe(
      true
    );
    expect(actions.setRotationGain).toHaveBeenCalledWith(0.65);
    expect(
      applyTeleopConfigScalarValue(TELEOP_CONFIG_ANGULAR_SCALE_X_TOPIC, 0.15, actions)
    ).toBe(true);
    expect(actions.setAngularScaleX).toHaveBeenCalledWith(0.15);
    expect(
      applyTeleopConfigScalarValue(TELEOP_CONFIG_ANGULAR_SCALE_Y_TOPIC, 0.16, actions)
    ).toBe(true);
    expect(actions.setAngularScaleY).toHaveBeenCalledWith(0.16);
    expect(
      applyTeleopConfigScalarValue(TELEOP_CONFIG_ANGULAR_SCALE_Z_TOPIC, 0.17, actions)
    ).toBe(true);
    expect(actions.setAngularScaleZ).toHaveBeenCalledWith(0.17);
    expect(applyTeleopConfigScalarValue("/unknown/topic", 0.25, actions)).toBe(false);
  });
});
