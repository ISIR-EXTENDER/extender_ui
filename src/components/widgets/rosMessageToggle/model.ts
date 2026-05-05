import type { RosMessageToggleWidget } from "../widgetTypes";

export const DEFAULT_ROS_MESSAGE_TOGGLE_MESSAGE_TYPE = "std_msgs/msg/Float64";
export const DEFAULT_ROS_MESSAGE_TOGGLE_ON_PAYLOAD = "{data: 1.0}";
export const DEFAULT_ROS_MESSAGE_TOGGLE_OFF_PAYLOAD = "{data: 0.0}";

type LegacyRosMessageToggleWidget = Omit<
  RosMessageToggleWidget,
  "kind" | "presetId" | "messageType" | "onPayload" | "offPayload"
> & {
  kind?: "ros-message-toggle" | "toggle-publisher";
  presetId?: string;
  messageType?: string;
  onPayload?: string;
  offPayload?: string;
  outputMode?: "numeric" | "boolean";
};

export type RosMessageToggleWsMessage = {
  type: "ui_typed";
  topic: string;
  message_type: string;
  payload_text: string;
  widget_id: string;
};

export type RosMessageTogglePreset = {
  id: string;
  label: string;
  description: string;
  messageType: string;
  onPayload: string;
  offPayload: string;
};

export const COMMON_ROS_MESSAGE_TYPES = [
  "std_msgs/msg/Bool",
  "std_msgs/msg/Float64",
  "std_msgs/msg/Int32",
  "std_msgs/msg/String",
  "std_msgs/msg/Int32MultiArray",
  "std_msgs/msg/UInt8MultiArray",
  "geometry_msgs/msg/Vector3",
] as const;

export const ROS_MESSAGE_TOGGLE_PRESETS: RosMessageTogglePreset[] = [
  {
    id: "bool",
    label: "Bool true / false",
    description: "Publish a standard ROS bool for ON and OFF.",
    messageType: "std_msgs/msg/Bool",
    onPayload: "{data: true}",
    offPayload: "{data: false}",
  },
  {
    id: "float64",
    label: "Float64 1 / 0",
    description: "Publish numeric ON/OFF values for simple bridge topics.",
    messageType: "std_msgs/msg/Float64",
    onPayload: "{data: 1.0}",
    offPayload: "{data: 0.0}",
  },
  {
    id: "int32",
    label: "Int32 1 / 0",
    description: "Publish integer ON/OFF values when the subscriber expects Int32.",
    messageType: "std_msgs/msg/Int32",
    onPayload: "{data: 1}",
    offPayload: "{data: 0}",
  },
  {
    id: "string-on-off",
    label: "String on / off",
    description: "Send text commands while keeping the ON/OFF interaction.",
    messageType: "std_msgs/msg/String",
    onPayload: "{data: 'on'}",
    offPayload: "{data: 'off'}",
  },
  {
    id: "state-machine",
    label: "Petanque state commands",
    description: "Example for toggling between two state machine commands.",
    messageType: "std_msgs/msg/String",
    onPayload: "{data: 'activate_throw'}",
    offPayload: "{data: 'teleop'}",
  },
  {
    id: "digital-output-array",
    label: "Digital output array",
    description: "Useful for Arduino-style bridges that expect [pin, state].",
    messageType: "std_msgs/msg/Int32MultiArray",
    onPayload: "{data: [13, 1]}",
    offPayload: "{data: [13, 0]}",
  },
  {
    id: "vector3",
    label: "Vector3 mapping",
    description: "Example of a structured payload with named ROS fields.",
    messageType: "geometry_msgs/msg/Vector3",
    onPayload: "{x: 0.1, y: 0.0, z: 0.0}",
    offPayload: "{x: 0.0, y: 0.0, z: 0.0}",
  },
];

const normalizeMessageType = (raw: string | undefined, legacyMode?: "numeric" | "boolean") => {
  const trimmed = raw?.trim();
  if (trimmed) {
    return trimmed;
  }

  if (legacyMode === "boolean") {
    return "std_msgs/msg/Bool";
  }

  return DEFAULT_ROS_MESSAGE_TOGGLE_MESSAGE_TYPE;
};

export const getDefaultRosMessageTogglePayloads = (messageType: string) => {
  const normalizedType = messageType.trim().toLowerCase();

  if (normalizedType === "std_msgs/msg/bool") {
    return {
      onPayload: "{data: true}",
      offPayload: "{data: false}",
    };
  }

  if (normalizedType === "std_msgs/msg/string") {
    return {
      onPayload: "{data: 'on'}",
      offPayload: "{data: 'off'}",
    };
  }

  if (normalizedType === "std_msgs/msg/int32") {
    return {
      onPayload: "{data: 1}",
      offPayload: "{data: 0}",
    };
  }

  if (
    normalizedType === "std_msgs/msg/int32multiarray" ||
    normalizedType === "std_msgs/msg/uint8multiarray"
  ) {
    return {
      onPayload: "{data: [13, 1]}",
      offPayload: "{data: [13, 0]}",
    };
  }

  if (normalizedType === "geometry_msgs/msg/vector3") {
    return {
      onPayload: "{x: 0.1, y: 0.0, z: 0.0}",
      offPayload: "{x: 0.0, y: 0.0, z: 0.0}",
    };
  }

  return {
    onPayload: DEFAULT_ROS_MESSAGE_TOGGLE_ON_PAYLOAD,
    offPayload: DEFAULT_ROS_MESSAGE_TOGGLE_OFF_PAYLOAD,
  };
};

export const normalizeRosMessageToggleWidget = (
  widget: RosMessageToggleWidget | LegacyRosMessageToggleWidget
): RosMessageToggleWidget => {
  const legacyMode = "outputMode" in widget ? widget.outputMode : undefined;
  const resolvedMessageType = normalizeMessageType(widget.messageType, legacyMode);
  const defaults = getDefaultRosMessageTogglePayloads(resolvedMessageType);

  return {
    id: widget.id,
    label: widget.label,
    topic: widget.topic,
    rect: widget.rect,
    kind: "ros-message-toggle",
    presetId: typeof widget.presetId === "string" ? widget.presetId : undefined,
    messageType: resolvedMessageType,
    onPayload:
      typeof widget.onPayload === "string" && widget.onPayload.trim()
        ? widget.onPayload
        : defaults.onPayload,
    offPayload:
      typeof widget.offPayload === "string" && widget.offPayload.trim()
        ? widget.offPayload
        : defaults.offPayload,
  };
};

export const buildRosMessageToggleWsMessage = (
  widget: RosMessageToggleWidget,
  nextState: "on" | "off"
): RosMessageToggleWsMessage => {
  const normalized = normalizeRosMessageToggleWidget(widget);
  return {
    type: "ui_typed",
    topic: normalized.topic,
    message_type: normalized.messageType,
    payload_text: nextState === "on" ? normalized.onPayload : normalized.offPayload,
    widget_id: normalized.id,
  };
};

const normalizeText = (value: string | undefined) => value?.trim() ?? "";

export const findMatchingRosMessageTogglePreset = (
  widget: Pick<RosMessageToggleWidget, "messageType" | "onPayload" | "offPayload">
): RosMessageTogglePreset | null => {
  const normalizedMessageType = normalizeText(widget.messageType).toLowerCase();
  const normalizedOnPayload = normalizeText(widget.onPayload);
  const normalizedOffPayload = normalizeText(widget.offPayload);

  return (
    ROS_MESSAGE_TOGGLE_PRESETS.find(
      (preset) =>
        preset.messageType.trim().toLowerCase() === normalizedMessageType &&
        preset.onPayload.trim() === normalizedOnPayload &&
        preset.offPayload.trim() === normalizedOffPayload
    ) ?? null
  );
};

export const buildRosMessageToggleCliExample = (
  widget: Pick<RosMessageToggleWidget, "topic" | "messageType" | "onPayload" | "offPayload">,
  nextState: "on" | "off"
) => {
  const normalized = normalizeRosMessageToggleWidget({
    id: "preview",
    kind: "ros-message-toggle",
    label: "Preview",
    rect: { x: 0, y: 0, w: 0, h: 0 },
    ...widget,
  });
  const payload = (nextState === "on" ? normalized.onPayload : normalized.offPayload).replaceAll('"', '\\"');
  const topic = normalized.topic.trim() || "/example/topic";
  return `ros2 topic pub -1 ${topic} ${normalized.messageType} "${payload}"`;
};
