import { describe, expect, it } from "vitest";

import {
  buildTogglePublisherWsMessage,
  normalizeTogglePublisherWidget,
} from "./model";

describe("togglePublisher/model", () => {
  it("normalizes unsupported output modes back to numeric", () => {
    const widget = normalizeTogglePublisherWidget({
      id: "toggle-1",
      kind: "toggle-publisher",
      label: "Toggle",
      topic: "/sandbox/digital_output",
      outputMode: "numeric",
      rect: { x: 0, y: 0, w: 200, h: 100 },
    });

    expect(widget.outputMode).toBe("numeric");
  });

  it("builds bool messages for boolean mode", () => {
    const message = buildTogglePublisherWsMessage(
      {
        id: "toggle-1",
        kind: "toggle-publisher",
        label: "Toggle",
        topic: "/sandbox/digital_output",
        outputMode: "boolean",
        rect: { x: 0, y: 0, w: 200, h: 100 },
      },
      "off"
    );

    expect(message).toEqual({
      type: "ui_bool",
      topic: "/sandbox/digital_output",
      value: false,
      widget_id: "toggle-1",
    });
  });

  it("builds scalar messages for numeric mode", () => {
    const message = buildTogglePublisherWsMessage(
      {
        id: "toggle-2",
        kind: "toggle-publisher",
        label: "Toggle",
        topic: "/sandbox/digital_output",
        outputMode: "numeric",
        rect: { x: 0, y: 0, w: 200, h: 100 },
      },
      "on"
    );

    expect(message).toEqual({
      type: "ui_scalar",
      topic: "/sandbox/digital_output",
      value: 1,
      widget_id: "toggle-2",
    });
  });
});
