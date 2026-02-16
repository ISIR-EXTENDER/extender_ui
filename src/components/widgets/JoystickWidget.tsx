import { CanvasItem } from "../layout/CanvasItem";
import type { CanvasRect } from "../layout/CanvasItem";
import { JoystickCardNipple } from "../teleop/JoystickCardNipple";
import { InlineEditableText } from "./InlineEditableText";
import type { JoystickWidget as JoystickWidgetModel } from "./widgetTypes";

type JoystickWidgetProps = {
  widget: JoystickWidgetModel;
  selected: boolean;
  onSelect: () => void;
  onRectChange: (next: CanvasRect) => void;
  onLabelChange: (nextLabel: string) => void;
  onMove: (x: number, y: number) => void;
  topicPreview: string;
  isTopicFresh: boolean;
  metrics: {
    x: number;
    y: number;
    magnitude?: number;
  };
};

export function JoystickWidget({
  widget,
  selected,
  onSelect,
  onRectChange,
  onLabelChange,
  onMove,
  topicPreview,
  isTopicFresh,
  metrics,
}: JoystickWidgetProps) {
  // Keep a visible inner padding and title/readout room while maximizing joystick area.
  const diskSize = Math.max(48, Math.min(widget.rect.w, widget.rect.h) - 58);

  const handleRectChange = (next: CanvasRect) => {
    const isMoveOnly = next.w === widget.rect.w && next.h === widget.rect.h;
    if (isMoveOnly) {
      onRectChange(next);
      return;
    }

    // Joystick widgets stay square during resize.
    const size = Math.max(90, Math.min(next.w, next.h));
    onRectChange({
      ...next,
      w: size,
      h: size,
    });
  };

  return (
    <CanvasItem
      x={widget.rect.x}
      y={widget.rect.y}
      w={widget.rect.w}
      h={widget.rect.h}
      onChange={handleRectChange}
      onSelect={onSelect}
      selected={selected}
      minSize={{ w: 90, h: 90 }}
      className="controls-joystick-item"
    >
      <JoystickCardNipple
        title={
          <InlineEditableText
            value={widget.label}
            onCommit={onLabelChange}
            className="controls-inline-label"
          />
        }
        onMove={onMove}
        deadzone={widget.deadzone}
        size={diskSize}
        color={widget.color}
        labels={widget.labels}
        className="joystickCardNipple"
      >
        <div className="vector">
          <div>x: {metrics.x.toFixed(2)}</div>
          <div>y: {metrics.y.toFixed(2)}</div>
          {typeof metrics.magnitude === "number" ? <div>mag: {metrics.magnitude.toFixed(2)}</div> : null}
        </div>
      </JoystickCardNipple>
      <div className={`widget-topic-readout ${isTopicFresh ? "is-fresh" : "is-stale"}`}>
        {topicPreview}
      </div>
    </CanvasItem>
  );
}
