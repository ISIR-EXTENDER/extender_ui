import { describe, expect, it } from "vitest";

import {
  buildRosMessageToggleCliExample,
  buildRosMessageToggleWsMessage,
  findMatchingRosMessageTogglePreset,
  getDefaultRosMessageTogglePayloads,
  normalizeRosMessageToggleWidget,
} from "./model";

describe("rosMessageToggle/model", () => {
  it("migrates legacy boolean toggles into typed ROS message toggles", () => {
    const widget = normalizeRosMessageToggleWidget({
      id: "legacy-bool",
      kind: "toggle-publisher",
      label: "Legacy toggle",
      topic: "/sandbox/digital_output",
      outputMode: "boolean",
      rect: { x: 0, y: 0, w: 200, h: 100 },
    });

    expect(widget).toMatchObject({
      kind: "ros-message-toggle",
      messageType: "std_msgs/msg/Bool",
      onPayload: "{data: true}",
      offPayload: "{data: false}",
    });
  });

  it("preserves explicit structured payloads", () => {
    const widget = normalizeRosMessageToggleWidget({
      id: "typed-array",
      kind: "ros-message-toggle",
      label: "Digital output array",
      topic: "/hub/digital_output",
      presetId: "digital-output-array",
      messageType: "std_msgs/msg/Int32MultiArray",
      onPayload: "{data: [7, 1]}",
      offPayload: "{data: [7, 0]}",
      rect: { x: 0, y: 0, w: 200, h: 100 },
    });

    const message = buildRosMessageToggleWsMessage(widget, "on");
    expect(message).toEqual({
      type: "ui_typed",
      topic: "/hub/digital_output",
      message_type: "std_msgs/msg/Int32MultiArray",
      payload_text: "{data: [7, 1]}",
      widget_id: "typed-array",
    });
  });

  it("preserves an explicit custom template selection", () => {
    const widget = normalizeRosMessageToggleWidget({
      id: "typed-custom",
      kind: "ros-message-toggle",
      label: "Custom toggle",
      topic: "/petanque_state_machine/change_state",
      presetId: "custom",
      messageType: "std_msgs/msg/String",
      onPayload: "{data: 'activate_throw'}",
      offPayload: "{data: 'teleop'}",
      rect: { x: 0, y: 0, w: 200, h: 100 },
    });

    expect(widget.presetId).toBe("custom");
  });

  it("matches presets for common message templates", () => {
    const preset = findMatchingRosMessageTogglePreset({
      messageType: "std_msgs/msg/String",
      onPayload: "{data: 'activate_throw'}",
      offPayload: "{data: 'teleop'}",
    });

    expect(preset?.id).toBe("state-machine");
  });

  it("returns structured defaults for array payloads", () => {
    expect(getDefaultRosMessageTogglePayloads("std_msgs/msg/UInt8MultiArray")).toEqual({
      onPayload: "{data: [13, 1]}",
      offPayload: "{data: [13, 0]}",
    });
  });

  it("builds a CLI-style preview string for non-web users", () => {
    const command = buildRosMessageToggleCliExample(
      {
        topic: "/petanque_state_machine/change_state",
        messageType: "std_msgs/msg/String",
        onPayload: "{data: 'activate_throw'}",
        offPayload: "{data: 'teleop'}",
      },
      "on"
    );

    expect(command).toBe(
      'ros2 topic pub -1 /petanque_state_machine/change_state std_msgs/msg/String "{data: \'activate_throw\'}"'
    );
  });
});
