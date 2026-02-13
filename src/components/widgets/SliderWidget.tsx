import { CanvasItem } from "../layout/CanvasItem";
import type { CanvasRect } from "../layout/CanvasItem";
import { RzSlider, ZSlider } from "../teleop/AxisSliders";
import type { SliderWidget as SliderWidgetModel } from "./widgetTypes";

type SliderWidgetProps = {
  widget: SliderWidgetModel;
  value: number;
  onValueChange: (value: number) => void;
  topicPreview: string;
  isTopicFresh: boolean;
  selected: boolean;
  onSelect: () => void;
  onRectChange: (next: CanvasRect) => void;
};

export function SliderWidget({
  widget,
  value,
  onValueChange,
  topicPreview,
  isTopicFresh,
  selected,
  onSelect,
  onRectChange,
}: SliderWidgetProps) {
  const minSize = widget.direction === "vertical" ? { w: 40, h: 90 } : { w: 90, h: 40 };

  return (
    <CanvasItem
      x={widget.rect.x}
      y={widget.rect.y}
      w={widget.rect.w}
      h={widget.rect.h}
      onChange={onRectChange}
      onSelect={onSelect}
      selected={selected}
      minSize={minSize}
      className={`controls-slider-item ${widget.direction === "vertical" ? "is-vertical" : "is-horizontal"}`}
    >
      <div className="card controls-mini-card">
        {widget.direction === "vertical" ? (
          <ZSlider
            value={value}
            onChange={onValueChange}
            min={widget.min}
            max={widget.max}
            step={widget.step}
            label={widget.label}
            showLabel={false}
            showReadout={false}
          />
        ) : (
          <RzSlider
            value={value}
            onChange={onValueChange}
            min={widget.min}
            max={widget.max}
            step={widget.step}
            label={widget.label}
            showLabel={false}
            showReadout={false}
          />
        )}
      </div>
      <div className={`widget-topic-readout ${isTopicFresh ? "is-fresh" : "is-stale"}`}>
        {topicPreview}
      </div>
    </CanvasItem>
  );
}
