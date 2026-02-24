import type {
  ButtonWidget,
  CanvasWidget,
  CurvesWidget,
  GripperControlWidget,
  JoystickWidget,
  LogsWidget,
  LoadPoseButtonWidget,
  ModeButtonWidget,
  MaxVelocityWidget,
  NavigationBarWidget,
  NavigationButtonWidget,
  RosbagControlWidget,
  StreamDisplayWidget,
  SavePoseButtonWidget,
  SliderWidget,
  TextareaWidget,
  TextWidget,
} from "./widgetTypes";
import { nextWidgetId } from "./widgetTypes";

export type WidgetCatalogType =
  | "joystick"
  | "slider"
  | "mode-button"
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
  | "stream-display"
  | "curves"
  | "logs"
  | "linear-joystick"
  | "gauge"
  | "toggle"
  | "display"
  | "camera";

export type WidgetCatalogEntry = {
  type: WidgetCatalogType;
  label: string;
  enabled: boolean;
  defaultSize: { w: number; h: number };
};

export const WIDGET_CATALOG: WidgetCatalogEntry[] = [
  { type: "joystick", label: "Joystick", enabled: true, defaultSize: { w: 150, h: 150 } },
  { type: "slider", label: "Slider", enabled: true, defaultSize: { w: 60, h: 120 } },
  { type: "mode-button", label: "Mode Button", enabled: true, defaultSize: { w: 170, h: 52 } },
  { type: "save-pose-button", label: "Save Pose Button", enabled: true, defaultSize: { w: 130, h: 52 } },
  { type: "load-pose-button", label: "Load Pose Button", enabled: true, defaultSize: { w: 130, h: 52 } },
  { type: "navigation-button", label: "Navigation Button", enabled: true, defaultSize: { w: 160, h: 52 } },
  { type: "navigation-bar", label: "Navigation Bar", enabled: true, defaultSize: { w: 220, h: 140 } },
  { type: "text", label: "Text", enabled: true, defaultSize: { w: 280, h: 64 } },
  { type: "textarea", label: "Textarea", enabled: true, defaultSize: { w: 300, h: 160 } },
  { type: "button", label: "Action Button", enabled: true, defaultSize: { w: 140, h: 52 } },
  { type: "rosbag-control", label: "Rosbag Control", enabled: true, defaultSize: { w: 300, h: 180 } },
  { type: "max-velocity", label: "Max Velocity", enabled: true, defaultSize: { w: 260, h: 90 } },
  { type: "gripper-control", label: "Gripper Control", enabled: true, defaultSize: { w: 300, h: 170 } },
  { type: "stream-display", label: "Stream Display", enabled: true, defaultSize: { w: 360, h: 260 } },
  { type: "curves", label: "Curves", enabled: true, defaultSize: { w: 420, h: 240 } },
  { type: "logs", label: "Logs", enabled: true, defaultSize: { w: 360, h: 220 } },
  { type: "linear-joystick", label: "Linear Joystick", enabled: false, defaultSize: { w: 250, h: 60 } },
  { type: "gauge", label: "Gauge", enabled: false, defaultSize: { w: 150, h: 150 } },
  { type: "toggle", label: "Toggle", enabled: false, defaultSize: { w: 120, h: 80 } },
  { type: "display", label: "Display", enabled: false, defaultSize: { w: 150, h: 80 } },
  { type: "camera", label: "Camera", enabled: false, defaultSize: { w: 320, h: 240 } },
];

const topicForType = (type: WidgetCatalogType) => `/cmd/${type}`;

export function createWidgetFromCatalogType(
  type: WidgetCatalogType,
  x: number,
  y: number
): CanvasWidget | null {
  if (type === "slider") {
    const slider: SliderWidget = {
      id: nextWidgetId(),
      kind: "slider",
      binding: "z",
      label: "Slider",
      topic: topicForType(type),
      direction: "vertical",
      showLabel: true,
      showTopicInfo: true,
      labelAlign: "center",
      min: -1,
      max: 1,
      step: 0.01,
      rect: { x, y, w: 60, h: 120 },
    };
    return slider;
  }

  if (type === "joystick") {
    const joystick: JoystickWidget = {
      id: nextWidgetId(),
      kind: "joystick",
      binding: "joy",
      label: "Joystick",
      topic: topicForType(type),
      showTopicInfo: true,
      color: "#4a9eff",
      deadzone: 0.1,
      diskSize: 80,
      labels: { top: "Y+", right: "X+", bottom: "Y-", left: "X-" },
      rect: { x, y, w: 150, h: 150 },
    };
    return joystick;
  }

  if (type === "save-pose-button") {
    const saveButton: SavePoseButtonWidget = {
      id: nextWidgetId(),
      kind: "save-pose-button",
      label: "Save Pose",
      topic: "/ui/save_pose",
      rect: { x, y, w: 130, h: 52 },
    };
    return saveButton;
  }

  if (type === "mode-button") {
    const modeButton: ModeButtonWidget = {
      id: nextWidgetId(),
      kind: "mode-button",
      label: "Mode",
      topic: "/cmd/mode",
      rect: { x, y, w: 170, h: 52 },
    };
    return modeButton;
  }

  if (type === "load-pose-button") {
    const loadButton: LoadPoseButtonWidget = {
      id: nextWidgetId(),
      kind: "load-pose-button",
      label: "Load Pose",
      topic: "/ui/load_pose",
      poseName: "",
      icon: "home",
      rect: { x, y, w: 130, h: 52 },
    };
    return loadButton;
  }

  if (type === "navigation-button") {
    const widget: NavigationButtonWidget = {
      id: nextWidgetId(),
      kind: "navigation-button",
      label: "Open Screen",
      topic: "/ui/navigation",
      targetScreenId: "",
      icon: "arrow-right",
      rect: { x, y, w: 160, h: 52 },
    };
    return widget;
  }

  if (type === "navigation-bar") {
    const widget: NavigationBarWidget = {
      id: nextWidgetId(),
      kind: "navigation-bar",
      label: "Navigation",
      topic: "/ui/navigation",
      orientation: "vertical",
      items: [],
      rect: { x, y, w: 220, h: 140 },
    };
    return widget;
  }

  if (type === "text") {
    const widget: TextWidget = {
      id: nextWidgetId(),
      kind: "text",
      label: "Text",
      topic: "/ui/text",
      text: "Text widget",
      fontSize: 20,
      align: "left",
      rect: { x, y, w: 280, h: 64 },
    };
    return widget;
  }

  if (type === "textarea") {
    const widget: TextareaWidget = {
      id: nextWidgetId(),
      kind: "textarea",
      label: "Textarea",
      topic: "/ui/textarea",
      text: "Multiline text",
      fontSize: 15,
      rect: { x, y, w: 300, h: 160 },
    };
    return widget;
  }

  if (type === "button") {
    const widget: ButtonWidget = {
      id: nextWidgetId(),
      kind: "button",
      label: "Action",
      topic: "/ui/button",
      payload: "pressed",
      tone: "default",
      rect: { x, y, w: 140, h: 52 },
    };
    return widget;
  }

  if (type === "rosbag-control") {
    const widget: RosbagControlWidget = {
      id: nextWidgetId(),
      kind: "rosbag-control",
      label: "Rosbag",
      topic: "/rosbag/control",
      bagName: "session_01",
      autoTimestamp: true,
      rect: { x, y, w: 300, h: 180 },
    };
    return widget;
  }

  if (type === "max-velocity") {
    const widget: MaxVelocityWidget = {
      id: nextWidgetId(),
      kind: "max-velocity",
      label: "Max Velocity",
      topic: "/cmd/max_velocity",
      min: 0,
      max: 2,
      step: 0.01,
      rect: { x, y, w: 260, h: 90 },
    };
    return widget;
  }

  if (type === "gripper-control") {
    const widget: GripperControlWidget = {
      id: nextWidgetId(),
      kind: "gripper-control",
      label: "Gripper Control",
      topic: "/cmd/gripper",
      showAdvancedControls: true,
      rect: { x, y, w: 300, h: 170 },
    };
    return widget;
  }

  if (type === "stream-display") {
    const widget: StreamDisplayWidget = {
      id: nextWidgetId(),
      kind: "stream-display",
      label: "Camera Stream",
      topic: "/ui/stream",
      source: "camera",
      streamUrl: "webrtc://localhost:8001/stream",
      fitMode: "contain",
      showStatus: true,
      showUrl: true,
      overlayText: "stream preview",
      rect: { x, y, w: 360, h: 260 },
    };
    return widget;
  }

  if (type === "curves") {
    const widget: CurvesWidget = {
      id: nextWidgetId(),
      kind: "curves",
      label: "Control Curves",
      topic: "/ui/curves",
      sampleRateHz: 10,
      historySeconds: 8,
      showLegend: true,
      showSpeed: true,
      rect: { x, y, w: 420, h: 240 },
    };
    return widget;
  }

  if (type === "logs") {
    const widget: LogsWidget = {
      id: nextWidgetId(),
      kind: "logs",
      label: "Runtime Logs",
      topic: "/ui/logs",
      maxEntries: 120,
      levelFilter: "all",
      autoScroll: true,
      showTimestamp: true,
      rect: { x, y, w: 360, h: 220 },
    };
    return widget;
  }

  return null;
}
