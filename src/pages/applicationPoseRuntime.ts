import type { CanvasWidget, PoseSnapshot, PoseTopicValue } from "../components/widgets";

export type SliderChannel = "z" | "rz";

export const clampSignedUnit = (value: number) => Math.max(-1, Math.min(1, value));

export const resolveSliderChannel = (
  widget: Extract<CanvasWidget, { kind: "slider" }>
): SliderChannel => {
  const topic = widget.topic.toLowerCase();
  const looksLikeRotationZ =
    topic.includes("joystick_rz") ||
    topic.includes("angular_z") ||
    topic.endsWith("/rz");
  if (looksLikeRotationZ) return "rz";

  const looksLikeTranslationZ =
    topic.includes("joystick_z") ||
    topic.includes("linear_z") ||
    topic.endsWith("/z");
  if (looksLikeTranslationZ) return "z";

  return widget.binding === "z" ? "z" : "rz";
};

export const upsertPose = (poses: PoseSnapshot[], pose: PoseSnapshot) => {
  const index = poses.findIndex((item) => item.name === pose.name);
  if (index === -1) return [...poses, pose].sort((a, b) => a.name.localeCompare(b.name));
  return poses.map((item, itemIndex) => (itemIndex === index ? pose : item));
};

export const collectCurrentPoseTopics = (
  widgets: CanvasWidget[],
  values: {
    joyX: number;
    joyY: number;
    rotX: number;
    rotY: number;
    z: number;
    rz: number;
  }
): Record<string, PoseTopicValue> => {
  const topics: Record<string, PoseTopicValue> = {};

  for (const widget of widgets) {
    if (widget.kind === "slider") {
      const channel = resolveSliderChannel(widget);
      const value = channel === "z" ? values.z : values.rz;
      topics[widget.topic] = { kind: "scalar", value };
      continue;
    }
    if (widget.kind === "joystick") {
      const source =
        widget.binding === "joy"
          ? { x: values.joyX, y: values.joyY }
          : { x: values.rotX, y: values.rotY };
      topics[widget.topic] = { kind: "vector2", x: source.x, y: source.y };
    }
  }

  return topics;
};

export const applyPoseSnapshot = (
  widgets: CanvasWidget[],
  pose: PoseSnapshot,
  actions: {
    setZ: (value: number) => void;
    setRz: (value: number) => void;
    setJoy: (x: number, y: number) => void;
    setRot: (x: number, y: number) => void;
    markWidgetPulse: (widgetId: string) => void;
  }
) => {
  for (const widget of widgets) {
    const topicValue = pose.topics[widget.topic];
    if (!topicValue) continue;

    if (widget.kind === "slider" && topicValue.kind === "scalar") {
      const clamped = Math.min(widget.max, Math.max(widget.min, topicValue.value));
      const channel = resolveSliderChannel(widget);
      if (channel === "z") {
        actions.setZ(clamped);
      } else {
        actions.setRz(clamped);
      }
      actions.markWidgetPulse(widget.id);
      continue;
    }

    if (widget.kind === "joystick" && topicValue.kind === "vector2") {
      const x = clampSignedUnit(topicValue.x);
      const y = clampSignedUnit(topicValue.y);
      if (widget.binding === "joy") {
        actions.setJoy(x, y);
      } else {
        actions.setRot(x, y);
      }
      actions.markWidgetPulse(widget.id);
    }
  }
};
