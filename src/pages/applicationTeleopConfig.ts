import {
  TELEOP_CONFIG_ANGULAR_SCALE_X_TOPIC,
  TELEOP_CONFIG_ANGULAR_SCALE_Y_TOPIC,
  TELEOP_CONFIG_ANGULAR_SCALE_Z_TOPIC,
  TELEOP_CONFIG_INVERT_ANGULAR_X_TOPIC,
  TELEOP_CONFIG_INVERT_ANGULAR_Y_TOPIC,
  TELEOP_CONFIG_INVERT_ANGULAR_Z_TOPIC,
  TELEOP_CONFIG_INVERT_LINEAR_X_TOPIC,
  TELEOP_CONFIG_INVERT_LINEAR_Y_TOPIC,
  TELEOP_CONFIG_INVERT_LINEAR_Z_TOPIC,
  TELEOP_CONFIG_RESET_TOPIC,
  TELEOP_CONFIG_ROTATION_GAIN_TOPIC,
  TELEOP_CONFIG_SAVE_PROFILE_TOPIC,
  TELEOP_CONFIG_SWAP_XY_TOPIC,
  TELEOP_CONFIG_TRANSLATION_GAIN_TOPIC,
  isTeleopLinearScaleXTopic,
  isTeleopLinearScaleYTopic,
  isTeleopLinearScaleZTopic,
} from "./applicationTopics";

export type TeleopConfigButtonState = {
  active: boolean;
  tone: "default" | "accent" | "success" | "danger";
};

export type TeleopConfigButtonSnapshot = {
  swapXY: boolean;
  invertLinearX: boolean;
  invertLinearY: boolean;
  invertLinearZ: boolean;
  invertAngularX: boolean;
  invertAngularY: boolean;
  invertAngularZ: boolean;
};

export type TeleopConfigButtonActions = {
  setSwapXY: (value: boolean) => void;
  setInvertLinearX: (value: boolean) => void;
  setInvertLinearY: (value: boolean) => void;
  setInvertLinearZ: (value: boolean) => void;
  setInvertAngularX: (value: boolean) => void;
  setInvertAngularY: (value: boolean) => void;
  setInvertAngularZ: (value: boolean) => void;
  resetTeleopConfig: () => void;
  saveTeleopProfile: (robot?: string) => void;
};

export type TeleopConfigScalarSnapshot = {
  maxVelocity: number;
  translationGain: number;
  rotationGain: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  angularScaleX: number;
  angularScaleY: number;
  angularScaleZ: number;
};

export type TeleopConfigScalarActions = {
  setMaxVelocity: (value: number) => void;
  setTranslationGain: (value: number) => void;
  setRotationGain: (value: number) => void;
  setScaleX: (value: number) => void;
  setScaleY: (value: number) => void;
  setScaleZ: (value: number) => void;
  setAngularScaleX: (value: number) => void;
  setAngularScaleY: (value: number) => void;
  setAngularScaleZ: (value: number) => void;
};

export const isTeleopConfigButtonTopic = (topic: string) =>
  topic === TELEOP_CONFIG_SWAP_XY_TOPIC ||
  topic === TELEOP_CONFIG_INVERT_LINEAR_X_TOPIC ||
  topic === TELEOP_CONFIG_INVERT_LINEAR_Y_TOPIC ||
  topic === TELEOP_CONFIG_INVERT_LINEAR_Z_TOPIC ||
  topic === TELEOP_CONFIG_INVERT_ANGULAR_X_TOPIC ||
  topic === TELEOP_CONFIG_INVERT_ANGULAR_Y_TOPIC ||
  topic === TELEOP_CONFIG_INVERT_ANGULAR_Z_TOPIC ||
  topic === TELEOP_CONFIG_RESET_TOPIC ||
  topic === TELEOP_CONFIG_SAVE_PROFILE_TOPIC;

export const getTeleopConfigButtonState = (
  topic: string,
  snapshot: TeleopConfigButtonSnapshot
): TeleopConfigButtonState | null => {
  if (topic === TELEOP_CONFIG_SWAP_XY_TOPIC) {
    return { active: snapshot.swapXY, tone: snapshot.swapXY ? "accent" : "default" };
  }
  if (topic === TELEOP_CONFIG_INVERT_LINEAR_X_TOPIC) {
    return {
      active: snapshot.invertLinearX,
      tone: snapshot.invertLinearX ? "success" : "default",
    };
  }
  if (topic === TELEOP_CONFIG_INVERT_LINEAR_Y_TOPIC) {
    return {
      active: snapshot.invertLinearY,
      tone: snapshot.invertLinearY ? "success" : "default",
    };
  }
  if (topic === TELEOP_CONFIG_INVERT_LINEAR_Z_TOPIC) {
    return {
      active: snapshot.invertLinearZ,
      tone: snapshot.invertLinearZ ? "success" : "default",
    };
  }
  if (topic === TELEOP_CONFIG_INVERT_ANGULAR_X_TOPIC) {
    return {
      active: snapshot.invertAngularX,
      tone: snapshot.invertAngularX ? "danger" : "default",
    };
  }
  if (topic === TELEOP_CONFIG_INVERT_ANGULAR_Y_TOPIC) {
    return {
      active: snapshot.invertAngularY,
      tone: snapshot.invertAngularY ? "danger" : "default",
    };
  }
  if (topic === TELEOP_CONFIG_INVERT_ANGULAR_Z_TOPIC) {
    return {
      active: snapshot.invertAngularZ,
      tone: snapshot.invertAngularZ ? "danger" : "default",
    };
  }
  if (topic === TELEOP_CONFIG_RESET_TOPIC) {
    return { active: false, tone: "accent" };
  }
  if (topic === TELEOP_CONFIG_SAVE_PROFILE_TOPIC) {
    return { active: false, tone: "success" };
  }
  return null;
};

export const getTeleopConfigButtonLabel = (
  topic: string,
  fallbackLabel: string,
  snapshot: TeleopConfigButtonSnapshot
) => {
  if (topic === TELEOP_CONFIG_SWAP_XY_TOPIC) {
    return snapshot.swapXY ? "Swap XY ON" : "Swap XY OFF";
  }
  if (topic === TELEOP_CONFIG_INVERT_LINEAR_X_TOPIC) {
    return snapshot.invertLinearX ? "LX -" : "LX +";
  }
  if (topic === TELEOP_CONFIG_INVERT_LINEAR_Y_TOPIC) {
    return snapshot.invertLinearY ? "LY -" : "LY +";
  }
  if (topic === TELEOP_CONFIG_INVERT_LINEAR_Z_TOPIC) {
    return snapshot.invertLinearZ ? "LZ -" : "LZ +";
  }
  if (topic === TELEOP_CONFIG_INVERT_ANGULAR_X_TOPIC) {
    return snapshot.invertAngularX ? "AX -" : "AX +";
  }
  if (topic === TELEOP_CONFIG_INVERT_ANGULAR_Y_TOPIC) {
    return snapshot.invertAngularY ? "AY -" : "AY +";
  }
  if (topic === TELEOP_CONFIG_INVERT_ANGULAR_Z_TOPIC) {
    return snapshot.invertAngularZ ? "AZ -" : "AZ +";
  }
  return fallbackLabel;
};

export const triggerTeleopConfigButton = (
  topic: string,
  snapshot: TeleopConfigButtonSnapshot,
  actions: TeleopConfigButtonActions
) => {
  if (topic === TELEOP_CONFIG_SWAP_XY_TOPIC) {
    actions.setSwapXY(!snapshot.swapXY);
    return true;
  }
  if (topic === TELEOP_CONFIG_INVERT_LINEAR_X_TOPIC) {
    actions.setInvertLinearX(!snapshot.invertLinearX);
    return true;
  }
  if (topic === TELEOP_CONFIG_INVERT_LINEAR_Y_TOPIC) {
    actions.setInvertLinearY(!snapshot.invertLinearY);
    return true;
  }
  if (topic === TELEOP_CONFIG_INVERT_LINEAR_Z_TOPIC) {
    actions.setInvertLinearZ(!snapshot.invertLinearZ);
    return true;
  }
  if (topic === TELEOP_CONFIG_INVERT_ANGULAR_X_TOPIC) {
    actions.setInvertAngularX(!snapshot.invertAngularX);
    return true;
  }
  if (topic === TELEOP_CONFIG_INVERT_ANGULAR_Y_TOPIC) {
    actions.setInvertAngularY(!snapshot.invertAngularY);
    return true;
  }
  if (topic === TELEOP_CONFIG_INVERT_ANGULAR_Z_TOPIC) {
    actions.setInvertAngularZ(!snapshot.invertAngularZ);
    return true;
  }
  if (topic === TELEOP_CONFIG_RESET_TOPIC) {
    actions.resetTeleopConfig();
    return true;
  }
  if (topic === TELEOP_CONFIG_SAVE_PROFILE_TOPIC) {
    actions.saveTeleopProfile("explorer");
    return true;
  }
  return false;
};

export const resolveTeleopConfigScalarValue = (
  topic: string,
  snapshot: TeleopConfigScalarSnapshot
) => {
  if (topic === "/cmd/max_velocity") return snapshot.maxVelocity;
  if (topic === TELEOP_CONFIG_TRANSLATION_GAIN_TOPIC) return snapshot.translationGain;
  if (topic === TELEOP_CONFIG_ROTATION_GAIN_TOPIC) return snapshot.rotationGain;
  if (isTeleopLinearScaleXTopic(topic)) return snapshot.scaleX;
  if (isTeleopLinearScaleYTopic(topic)) return snapshot.scaleY;
  if (isTeleopLinearScaleZTopic(topic)) return snapshot.scaleZ;
  if (topic === TELEOP_CONFIG_ANGULAR_SCALE_X_TOPIC) return snapshot.angularScaleX;
  if (topic === TELEOP_CONFIG_ANGULAR_SCALE_Y_TOPIC) return snapshot.angularScaleY;
  if (topic === TELEOP_CONFIG_ANGULAR_SCALE_Z_TOPIC) return snapshot.angularScaleZ;
  return null;
};

export const applyTeleopConfigScalarValue = (
  topic: string,
  value: number,
  actions: TeleopConfigScalarActions
) => {
  if (topic === "/cmd/max_velocity") {
    actions.setMaxVelocity(value);
    return true;
  }
  if (topic === TELEOP_CONFIG_TRANSLATION_GAIN_TOPIC) {
    actions.setTranslationGain(value);
    return true;
  }
  if (topic === TELEOP_CONFIG_ROTATION_GAIN_TOPIC) {
    actions.setRotationGain(value);
    return true;
  }
  if (isTeleopLinearScaleXTopic(topic)) {
    actions.setScaleX(value);
    return true;
  }
  if (isTeleopLinearScaleYTopic(topic)) {
    actions.setScaleY(value);
    return true;
  }
  if (isTeleopLinearScaleZTopic(topic)) {
    actions.setScaleZ(value);
    return true;
  }
  if (topic === TELEOP_CONFIG_ANGULAR_SCALE_X_TOPIC) {
    actions.setAngularScaleX(value);
    return true;
  }
  if (topic === TELEOP_CONFIG_ANGULAR_SCALE_Y_TOPIC) {
    actions.setAngularScaleY(value);
    return true;
  }
  if (topic === TELEOP_CONFIG_ANGULAR_SCALE_Z_TOPIC) {
    actions.setAngularScaleZ(value);
    return true;
  }
  return false;
};
