import { CanvasItem } from "../layout/CanvasItem";
import type { CanvasRect } from "../layout/CanvasItem";
import { JoystickCardNipple } from "../teleop/JoystickCardNipple";
import type { JoystickWidget as JoystickWidgetModel } from "./widgetTypes";

type JoystickWidgetProps = {
  widget: JoystickWidgetModel;
  selected: boolean;
  onSelect: () => void;
  onRectChange: (next: CanvasRect) => void;
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
  onMove,
  topicPreview,
  isTopicFresh,
  metrics,
}: JoystickWidgetProps) {
  const maxDisk = Math.max(36, Math.min(widget.rect.w, widget.rect.h) - 34);
  const diskSize = Math.min(widget.diskSize, maxDisk);

  return (
    <CanvasItem
      x={widget.rect.x}
      y={widget.rect.y}
      w={widget.rect.w}
      h={widget.rect.h}
      onChange={onRectChange}
      onSelect={onSelect}
      selected={selected}
      minSize={{ w: 90, h: 90 }}
      className="controls-joystick-item"
    >
      <JoystickCardNipple
        title={widget.label}
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
