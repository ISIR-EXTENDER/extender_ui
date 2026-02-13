import type {
  CanvasWidget,
  JoystickWidget,
  LoadPoseButtonWidget,
  SavePoseButtonWidget,
  SliderWidget,
} from "./widgetTypes";
import { nextWidgetId } from "./widgetTypes";

export type WidgetCatalogType =
  | "joystick"
  | "slider"
  | "save-pose-button"
  | "load-pose-button"
  | "linear-joystick"
  | "button"
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
  { type: "save-pose-button", label: "Save Pose Button", enabled: true, defaultSize: { w: 130, h: 52 } },
  { type: "load-pose-button", label: "Load Pose Button", enabled: true, defaultSize: { w: 130, h: 52 } },
  { type: "linear-joystick", label: "Linear Joystick", enabled: false, defaultSize: { w: 250, h: 60 } },
  { type: "button", label: "Button", enabled: false, defaultSize: { w: 120, h: 50 } },
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

  return null;
}
