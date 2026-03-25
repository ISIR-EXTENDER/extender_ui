import {
  PLAY_PETANQUE_MEASURE_CAPTURE_TOPIC,
  PLAY_PETANQUE_MEASURE_REFRESH_TOPIC,
  PLAY_PETANQUE_MEASURE_REQUEST_TOPIC,
  PLAY_PETANQUE_MEASURE_VIEW_LIVE_TOPIC,
  PLAY_PETANQUE_MEASURE_VIEW_RESULT_TOPIC,
} from "./applicationTopics";
import type { MeasureViewMode } from "./applicationMeasureRuntime";

export type PetanqueStateCommand =
  | "teleop"
  | "activate_throw"
  | "go_to_start"
  | "throw"
  | "pick_up"
  | "stop"
  | "test_loop";

export type PetanqueAlphaPreset = "pointer" | "tirer";
export type PetanqueFlowStage = "teleop" | "start_ready";

export type RuntimeButtonTone = "default" | "accent" | "success" | "danger";

export type RuntimeButtonState = {
  disabled: boolean;
  active: boolean;
  tone: RuntimeButtonTone;
};

export const isMeasureButtonTopic = (topic: string) =>
  topic === PLAY_PETANQUE_MEASURE_CAPTURE_TOPIC ||
  topic === PLAY_PETANQUE_MEASURE_REQUEST_TOPIC ||
  topic === PLAY_PETANQUE_MEASURE_REFRESH_TOPIC ||
  topic === PLAY_PETANQUE_MEASURE_VIEW_LIVE_TOPIC ||
  topic === PLAY_PETANQUE_MEASURE_VIEW_RESULT_TOPIC;

const PETANQUE_COMMANDS = [
  "teleop",
  "activate_throw",
  "go_to_start",
  "throw",
  "pick_up",
  "stop",
  "test_loop",
] as const;

export const isPetanqueStateCommand = (value: string): value is PetanqueStateCommand =>
  (PETANQUE_COMMANDS as readonly string[]).includes(value);

export const resolvePetanqueAlphaPreset = (value: string): PetanqueAlphaPreset | null => {
  const normalized = value.trim().toLowerCase();
  if (normalized === "pointer") return "pointer";
  if (normalized === "tirer") return "tirer";
  return null;
};

export const getPetanqueButtonState = (
  command: PetanqueStateCommand,
  flowStage: PetanqueFlowStage
): RuntimeButtonState => {
  if (command === "teleop") {
    return {
      disabled: false,
      active: flowStage === "teleop",
      tone: "default",
    };
  }
  if (command === "activate_throw") {
    return {
      disabled: false,
      active: flowStage === "start_ready",
      tone: "accent",
    };
  }
  if (command === "go_to_start") {
    return {
      disabled: flowStage === "teleop",
      active: flowStage === "start_ready",
      tone: "success",
    };
  }
  if (command === "throw") {
    return {
      disabled: flowStage !== "start_ready",
      active: false,
      tone: "danger",
    };
  }
  if (command === "pick_up") {
    return {
      disabled: false,
      active: false,
      tone: "accent",
    };
  }
  if (command === "stop") {
    return {
      disabled: flowStage !== "start_ready",
      active: false,
      tone: "danger",
    };
  }
  if (command === "test_loop") {
    return {
      disabled: false,
      active: false,
      tone: "accent",
    };
  }
  return {
    disabled: false,
    active: false,
    tone: "danger",
  };
};

export const resolvePetanqueFlowStageAfterCommand = (
  command: PetanqueStateCommand
): PetanqueFlowStage | null => {
  if (command === "teleop" || command === "stop" || command === "pick_up") {
    return "teleop";
  }
  if (command === "activate_throw" || command === "go_to_start" || command === "throw") {
    return "start_ready";
  }
  return null;
};

export const getMeasureButtonState = (
  topic: string,
  measureViewMode: MeasureViewMode,
  measureRequestPending: boolean,
  fallbackTone: RuntimeButtonTone
): RuntimeButtonState => {
  const active =
    topic === PLAY_PETANQUE_MEASURE_VIEW_LIVE_TOPIC
      ? measureViewMode === "live"
      : topic === PLAY_PETANQUE_MEASURE_VIEW_RESULT_TOPIC
        ? measureViewMode === "result"
        : false;

  const tone =
    topic === PLAY_PETANQUE_MEASURE_REQUEST_TOPIC
      ? "success"
      : topic === PLAY_PETANQUE_MEASURE_CAPTURE_TOPIC
        ? "accent"
        : topic === PLAY_PETANQUE_MEASURE_VIEW_RESULT_TOPIC && active
          ? "accent"
          : topic === PLAY_PETANQUE_MEASURE_VIEW_LIVE_TOPIC && active
            ? "accent"
            : fallbackTone;

  const disabled =
    topic === PLAY_PETANQUE_MEASURE_REQUEST_TOPIC && measureRequestPending;

  return { active, tone, disabled };
};
