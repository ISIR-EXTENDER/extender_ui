import type {
  CanvasWidget,
  JoystickBinding,
  JoystickWidget,
  SliderBinding,
  SliderDirection,
  SliderWidget,
} from "./widgetTypes";
import { nextWidgetId } from "./widgetTypes";

type BasePresetWidget = {
  x: number;
  y: number;
  w?: number;
  h?: number;
  label?: string;
  topic?: string;
};

type SliderPresetWidget = BasePresetWidget & {
  kind: "slider";
  binding?: SliderBinding;
  direction?: SliderDirection;
  min?: number;
  max?: number;
  step?: number;
};

type JoystickPresetWidget = BasePresetWidget & {
  kind: "joystick";
  binding?: JoystickBinding;
  color?: string;
  deadzone?: number;
  diskSize?: number;
  labels?: Partial<JoystickWidget["labels"]>;
};

export type TsPresetWidget = SliderPresetWidget | JoystickPresetWidget;

export type TsWidgetPreset = {
  id: string;
  label: string;
  description?: string;
  widgets: TsPresetWidget[];
};

const clampPx = (value: number, fallback: number) => {
  const next = Number.isFinite(value) ? Math.round(value) : fallback;
  return Math.max(0, next);
};

const joystickLabelsForBinding = (binding: JoystickBinding) =>
  binding === "rot"
    ? { top: "RY+", right: "RX+", bottom: "RY-", left: "RX-" }
    : { top: "Y+", right: "X+", bottom: "Y-", left: "X-" };

const topicForJoystickBinding = (binding: JoystickBinding) =>
  binding === "rot" ? "/cmd/joystick_rxry" : "/cmd/joystick_xy";

const topicForSliderBinding = (binding: SliderBinding) =>
  binding === "rz" ? "/cmd/joystick_rz" : "/cmd/joystick_z";

const buildSliderWidget = (spec: SliderPresetWidget): SliderWidget => {
  const binding = spec.binding ?? "z";
  const direction = spec.direction ?? "vertical";
  const defaultW = direction === "horizontal" ? 100 : 50;
  const defaultH = direction === "horizontal" ? 50 : 100;

  return {
    id: nextWidgetId(),
    kind: "slider",
    binding,
    direction,
    label: spec.label ?? binding.toUpperCase(),
    topic: spec.topic ?? topicForSliderBinding(binding),
    min: spec.min ?? -1,
    max: spec.max ?? 1,
    step: spec.step ?? 0.01,
    rect: {
      x: clampPx(spec.x, 0),
      y: clampPx(spec.y, 0),
      w: clampPx(spec.w ?? defaultW, defaultW),
      h: clampPx(spec.h ?? defaultH, defaultH),
    },
  };
};

const buildJoystickWidget = (spec: JoystickPresetWidget): JoystickWidget => {
  const binding = spec.binding ?? "joy";
  const defaultLabels = joystickLabelsForBinding(binding);

  return {
    id: nextWidgetId(),
    kind: "joystick",
    binding,
    label: spec.label ?? (binding === "rot" ? "Rotation" : "Translation"),
    topic: spec.topic ?? topicForJoystickBinding(binding),
    color: spec.color ?? (binding === "rot" ? "#f97316" : "#4a9eff"),
    deadzone: spec.deadzone ?? 0.1,
    diskSize: clampPx(spec.diskSize ?? 64, 64),
    labels: {
      top: spec.labels?.top ?? defaultLabels.top,
      right: spec.labels?.right ?? defaultLabels.right,
      bottom: spec.labels?.bottom ?? defaultLabels.bottom,
      left: spec.labels?.left ?? defaultLabels.left,
    },
    rect: {
      x: clampPx(spec.x, 0),
      y: clampPx(spec.y, 0),
      w: clampPx(spec.w ?? 100, 100),
      h: clampPx(spec.h ?? 100, 100),
    },
  };
};

const buildWidgetFromPreset = (spec: TsPresetWidget): CanvasWidget =>
  spec.kind === "slider" ? buildSliderWidget(spec) : buildJoystickWidget(spec);

export const TS_WIDGET_PRESETS: TsWidgetPreset[] = [
  {
    id: "teleop_default",
    label: "Teleop Default",
    description: "2 joysticks + Z/RZ sliders",
    widgets: [
      { kind: "slider", binding: "rz", direction: "horizontal", x: 105, y: 25, w: 100, h: 50, label: "RZ" },
      { kind: "slider", binding: "z", direction: "vertical", x: 0, y: 100, w: 50, h: 100, label: "Z" },
      { kind: "joystick", binding: "joy", x: 0, y: 100, w: 100, h: 100, label: "Translation" },
      { kind: "joystick", binding: "rot", x: 105, y: 100, w: 100, h: 100, label: "Rotation" },
    ],
  },
  {
    id: "translation_only",
    label: "Translation Only",
    description: "1 joystick + vertical Z slider",
    widgets: [
      { kind: "slider", binding: "z", direction: "vertical", x: 0, y: 90, w: 50, h: 120, label: "Z" },
      { kind: "joystick", binding: "joy", x: 60, y: 90, w: 140, h: 140, label: "Translation" },
    ],
  },
];

export function instantiateTsPreset(presetId: string): CanvasWidget[] | null {
  const preset = TS_WIDGET_PRESETS.find((entry) => entry.id === presetId);
  if (!preset) return null;
  return preset.widgets.map(buildWidgetFromPreset);
}
