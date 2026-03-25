import type { CanvasWidget } from "../../components/widgets";
import {
  PETANQUE_ALPHA_TOPIC,
  PETANQUE_ANGLE_TOPIC,
  PETANQUE_TOTAL_DURATION_TOPIC,
} from "../../pages/applicationTopics";
import type { PetanqueAlphaPreset, PetanqueStateCommand } from "./buttonRuntime";

export const PETANQUE_ALPHA_SAFE_MAX = 20;
export const PETANQUE_ALPHA_MAX = 40;
export const PETANQUE_ALPHA_POINTER = 20;
export const PETANQUE_ALPHA_TIRER = 0;
export const PETANQUE_TOTAL_DURATION_MIN_S = 0.9;
export const PETANQUE_TOTAL_DURATION_MAX_S = 3.0;
export const PETANQUE_DEFAULT_TOTAL_DURATION_S = 1.1;
export const PETANQUE_DEFAULT_ALPHA = 0;

export const isPetanqueMaxVelocityTopic = (topic: string) =>
  topic === PETANQUE_TOTAL_DURATION_TOPIC ||
  topic === PETANQUE_ANGLE_TOPIC ||
  topic === PETANQUE_ALPHA_TOPIC;

export const clampPetanqueDuration = (durationSeconds: number) =>
  Math.max(PETANQUE_TOTAL_DURATION_MIN_S, Math.min(PETANQUE_TOTAL_DURATION_MAX_S, durationSeconds));

export const formatPetanquePowerPercent = (
  value: number,
  min: number,
  max: number,
  reverseDirection: boolean
) => {
  const span = Math.max(1e-6, max - min);
  const normalized = reverseDirection ? (max - value) / span : (value - min) / span;
  const percent = Math.max(0, Math.min(100, normalized * 100));
  return `Power ${percent.toFixed(0)}%`;
};

export const resolvePetanqueAlphaPresetValue = (preset: PetanqueAlphaPreset) =>
  preset === "pointer" ? PETANQUE_ALPHA_POINTER : PETANQUE_ALPHA_TIRER;

export const syncPetanqueAlphaWidgets = (
  widgets: CanvasWidget[],
  resolvedAlpha: number,
  prevThrowDrawAlphaValues: Record<string, number>,
  prevMaxVelocityWidgetValues: Record<string, number>
) => {
  const nextThrowDrawAlphaValues = { ...prevThrowDrawAlphaValues };
  const nextMaxVelocityWidgetValues = { ...prevMaxVelocityWidgetValues };

  for (const widget of widgets) {
    if (widget.kind === "throw-draw" && widget.alphaTopic === PETANQUE_ALPHA_TOPIC) {
      nextThrowDrawAlphaValues[widget.id] = resolvedAlpha;
    }
    if (widget.kind === "max-velocity" && widget.topic === PETANQUE_ALPHA_TOPIC) {
      nextMaxVelocityWidgetValues[widget.id] = resolvedAlpha;
    }
  }

  return {
    nextThrowDrawAlphaValues,
    nextMaxVelocityWidgetValues,
  };
};

export const resolvePetanqueThrowDrawValue = (
  widget: Extract<CanvasWidget, { kind: "throw-draw" }>,
  throwDrawWidgetValues: Record<string, { angle: number; duration: number }>,
  throwDrawAlphaValues: Record<string, number>,
  alphaWidgetValue?: number
) => {
  const angleMin = Math.min(widget.angleMin, widget.angleMax);
  const angleMax = Math.max(widget.angleMin, widget.angleMax);
  const durationMin = Math.min(widget.durationMin, widget.durationMax);
  const durationMax = Math.max(widget.durationMin, widget.durationMax);
  const hasAlphaControl =
    typeof widget.alphaTopic === "string" && widget.alphaTopic.trim().length > 0;
  const alphaMin = Math.min(widget.alphaMin ?? 0, widget.alphaMax ?? PETANQUE_ALPHA_MAX);
  const alphaMax = Math.max(widget.alphaMin ?? 0, widget.alphaMax ?? PETANQUE_ALPHA_MAX);
  const drawAlphaValueFromState = throwDrawAlphaValues[widget.id];
  const drawAlphaValue = hasAlphaControl
    ? typeof drawAlphaValueFromState === "number"
      ? drawAlphaValueFromState
      : typeof alphaWidgetValue === "number"
        ? alphaWidgetValue
      : widget.alphaTopic === PETANQUE_ALPHA_TOPIC
        ? PETANQUE_DEFAULT_ALPHA
        : alphaMin
    : undefined;
  const defaultDuration =
    widget.powerTopic === PETANQUE_TOTAL_DURATION_TOPIC
      ? PETANQUE_DEFAULT_TOTAL_DURATION_S
      : durationMax;
  const drawValue = throwDrawWidgetValues[widget.id] ?? {
    angle: Math.max(angleMin, Math.min(angleMax, 0)),
    duration: Math.max(durationMin, Math.min(durationMax, defaultDuration)),
  };

  return {
    angleMin,
    angleMax,
    durationMin,
    durationMax,
    hasAlphaControl,
    alphaMin,
    alphaMax,
    drawAlphaValue,
    clampedAngle: Math.max(angleMin, Math.min(angleMax, drawValue.angle)),
    clampedDuration: Math.max(durationMin, Math.min(durationMax, drawValue.duration)),
  };
};

export const resolvePetanqueMaxVelocityValue = (
  topic: string,
  widgetId: string,
  maxVelocityWidgetValues: Record<string, number>
) => {
  if (typeof maxVelocityWidgetValues[widgetId] === "number") {
    return maxVelocityWidgetValues[widgetId];
  }
  if (topic === PETANQUE_TOTAL_DURATION_TOPIC) return PETANQUE_DEFAULT_TOTAL_DURATION_S;
  if (topic === PETANQUE_ANGLE_TOPIC) return 0;
  if (topic === PETANQUE_ALPHA_TOPIC) return PETANQUE_DEFAULT_ALPHA;
  return null;
};

export const resolvePetanqueMaxVelocityPresentation = (
  widget: Extract<CanvasWidget, { kind: "max-velocity" }>
) => {
  const reverseDirection =
    widget.reverseDirection ?? widget.topic === PETANQUE_TOTAL_DURATION_TOPIC;
  const endpointLabels =
    widget.endpointLeftLabel || widget.endpointRightLabel
      ? {
          left: widget.endpointLeftLabel,
          right: widget.endpointRightLabel,
        }
      : widget.topic === PETANQUE_TOTAL_DURATION_TOPIC
        ? { left: "Slow", right: "Fast" }
        : widget.topic === PETANQUE_ANGLE_TOPIC
          ? { left: "Left", right: "Right" }
          : widget.topic === PETANQUE_ALPHA_TOPIC
            ? { left: "Tirer", right: "Pointer" }
            : undefined;
  const bubbleMode =
    widget.bubbleMode ??
    (widget.topic === PETANQUE_ANGLE_TOPIC
      ? "degrees"
      : widget.topic === PETANQUE_ALPHA_TOPIC
        ? "degrees-unit"
        : widget.topic === PETANQUE_TOTAL_DURATION_TOPIC
          ? "power"
          : "number");
  const bubbleValueFormatter =
    bubbleMode === "degrees"
      ? (rawValue: number) => `${((rawValue * 180) / Math.PI).toFixed(1)}°`
      : bubbleMode === "degrees-unit"
        ? (rawValue: number) => `${rawValue.toFixed(1)}°`
        : bubbleMode === "power"
          ? (rawValue: number) =>
              formatPetanquePowerPercent(rawValue, widget.min, widget.max, reverseDirection)
          : undefined;
  const unsafeThreshold =
    typeof widget.unsafeThreshold === "number"
      ? widget.unsafeThreshold
      : widget.topic === PETANQUE_ALPHA_TOPIC
        ? PETANQUE_ALPHA_SAFE_MAX
        : undefined;

  return {
    reverseDirection,
    endpointLabels,
    bubbleMode,
    bubbleValueFormatter,
    unsafeThreshold,
  };
};

export const buildPetanqueCfgUpdate = (topic: string, value: number) => {
  if (topic === PETANQUE_TOTAL_DURATION_TOPIC) {
    return {
      type: "petanque_cfg" as const,
      total_duration: clampPetanqueDuration(value),
    };
  }
  if (topic === PETANQUE_ANGLE_TOPIC) {
    return {
      type: "petanque_cfg" as const,
      angle_between_start_and_finish: value,
    };
  }
  if (topic === PETANQUE_ALPHA_TOPIC) {
    return {
      type: "petanque_cfg" as const,
      alpha: value,
    };
  }
  return null;
};

export const buildPetanqueThrowCfgUpdate = (
  widget: Extract<CanvasWidget, { kind: "throw-draw" }>,
  resolvedAngle: number,
  resolvedDuration: number
) => {
  const cfg: {
    total_duration?: number;
    angle_between_start_and_finish?: number;
  } = {};
  if (widget.powerTopic === PETANQUE_TOTAL_DURATION_TOPIC) {
    cfg.total_duration = clampPetanqueDuration(resolvedDuration);
  }
  if (widget.angleTopic === PETANQUE_ANGLE_TOPIC) {
    cfg.angle_between_start_and_finish = resolvedAngle;
  }
  return cfg;
};

export const isPetanqueCfgUpdateEmpty = (cfg: {
  total_duration?: number;
  angle_between_start_and_finish?: number;
}) => cfg.total_duration === undefined && cfg.angle_between_start_and_finish === undefined;

export const buildPetanqueStateCommandMessage = (command: PetanqueStateCommand) => ({
  type: "state_cmd" as const,
  command,
});
