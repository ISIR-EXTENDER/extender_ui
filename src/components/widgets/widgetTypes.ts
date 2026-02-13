import type { CanvasRect } from "../layout/CanvasItem";

export type JoystickBinding = "joy" | "rot";
export type SliderBinding = "z" | "rz";
export type SliderDirection = "vertical" | "horizontal";
export type WidgetIcon = "home" | "save" | "arrow-right";
export type NavigationOrientation = "horizontal" | "vertical";
export type TextAlign = "left" | "center" | "right";
export type StreamSource = "camera" | "rviz";

export type WidgetKind =
  | "joystick"
  | "slider"
  | "save-pose-button"
  | "load-pose-button"
  | "navigation-button"
  | "navigation-bar"
  | "text"
  | "textarea"
  | "button"
  | "rosbag-control"
  | "max-velocity"
  | "gripper-control"
  | "stream-display";

type WidgetBase = {
  id: string;
  kind: WidgetKind;
  label: string;
  topic: string;
  rect: CanvasRect;
};

export type JoystickWidget = WidgetBase & {
  kind: "joystick";
  binding: JoystickBinding;
  color: string;
  deadzone: number;
  diskSize: number;
  labels: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
};

export type SliderWidget = WidgetBase & {
  kind: "slider";
  binding: SliderBinding;
  direction: SliderDirection;
  min: number;
  max: number;
  step: number;
};

export type SavePoseButtonWidget = WidgetBase & {
  kind: "save-pose-button";
};

export type LoadPoseButtonWidget = WidgetBase & {
  kind: "load-pose-button";
  poseName: string;
  icon: WidgetIcon;
};

export type NavigationButtonWidget = WidgetBase & {
  kind: "navigation-button";
  targetScreenId: string;
  icon: WidgetIcon;
};

export type NavigationBarWidget = WidgetBase & {
  kind: "navigation-bar";
  orientation: NavigationOrientation;
  items: Array<{
    id: string;
    label: string;
    targetScreenId: string;
  }>;
};

export type TextWidget = WidgetBase & {
  kind: "text";
  text: string;
  fontSize: number;
  align: TextAlign;
};

export type TextareaWidget = WidgetBase & {
  kind: "textarea";
  text: string;
  fontSize: number;
};

export type ButtonWidget = WidgetBase & {
  kind: "button";
  payload: string;
};

export type RosbagControlWidget = WidgetBase & {
  kind: "rosbag-control";
  bagName: string;
  autoTimestamp: boolean;
};

export type MaxVelocityWidget = WidgetBase & {
  kind: "max-velocity";
  min: number;
  max: number;
  step: number;
};

export type GripperControlWidget = WidgetBase & {
  kind: "gripper-control";
};

export type StreamDisplayWidget = WidgetBase & {
  kind: "stream-display";
  source: StreamSource;
  streamUrl: string;
};

export type CanvasWidget =
  | JoystickWidget
  | SliderWidget
  | SavePoseButtonWidget
  | LoadPoseButtonWidget
  | NavigationButtonWidget
  | NavigationBarWidget
  | TextWidget
  | TextareaWidget
  | ButtonWidget
  | RosbagControlWidget
  | MaxVelocityWidget
  | GripperControlWidget
  | StreamDisplayWidget;

export const DEFAULT_WIDGETS: CanvasWidget[] = [
  {
    id: "slider-rz",
    kind: "slider",
    binding: "rz",
    label: "RZ",
    topic: "/cmd/joystick_rz",
    direction: "horizontal",
    min: -1,
    max: 1,
    step: 0.01,
    rect: { x: 105, y: 25, w: 100, h: 50 },
  },
  {
    id: "slider-z",
    kind: "slider",
    binding: "z",
    label: "Z",
    topic: "/cmd/joystick_z",
    direction: "vertical",
    min: -1,
    max: 1,
    step: 0.01,
    rect: { x: 0, y: 100, w: 50, h: 100 },
  },
  {
    id: "joystick-translation",
    kind: "joystick",
    binding: "joy",
    label: "Translation",
    topic: "/cmd/joystick_xy",
    color: "#4a9eff",
    deadzone: 0.1,
    diskSize: 64,
    labels: { top: "Y+", right: "X+", bottom: "Y-", left: "X-" },
    rect: { x: 0, y: 100, w: 100, h: 100 },
  },
  {
    id: "joystick-rotation",
    kind: "joystick",
    binding: "rot",
    label: "Rotation",
    topic: "/cmd/joystick_rxry",
    color: "#f97316",
    deadzone: 0.1,
    diskSize: 64,
    labels: { top: "RY+", right: "RX+", bottom: "RY-", left: "RX-" },
    rect: { x: 105, y: 100, w: 100, h: 100 },
  },
];

export const nextWidgetId = () => `widget-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
