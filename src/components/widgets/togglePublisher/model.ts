import type { TogglePublisherWidget } from "../widgetTypes";

export type TogglePublisherWsMessage =
  | {
      type: "ui_bool";
      topic: string;
      value: boolean;
      widget_id: string;
    }
  | {
      type: "ui_scalar";
      topic: string;
      value: number;
      widget_id: string;
    };

export const normalizeTogglePublisherWidget = (
  widget: TogglePublisherWidget
): TogglePublisherWidget => ({
  ...widget,
  outputMode: widget.outputMode === "boolean" ? "boolean" : "numeric",
});

export const buildTogglePublisherWsMessage = (
  widget: TogglePublisherWidget,
  nextState: "on" | "off"
): TogglePublisherWsMessage => {
  const normalized = normalizeTogglePublisherWidget(widget);
  if (normalized.outputMode === "boolean") {
    return {
      type: "ui_bool",
      topic: normalized.topic,
      value: nextState === "on",
      widget_id: normalized.id,
    };
  }

  return {
    type: "ui_scalar",
    topic: normalized.topic,
    value: nextState === "on" ? 1 : 0,
    widget_id: normalized.id,
  };
};
