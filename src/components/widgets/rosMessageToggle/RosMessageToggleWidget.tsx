import type { CanvasRect } from "../../layout/CanvasItem";
import { ToggleSwitchCard } from "../toggleControls/ToggleSwitchCard";
import type { RosMessageToggleWidget as RosMessageToggleWidgetModel } from "../widgetTypes";

type RosMessageToggleWidgetProps = {
  widget: RosMessageToggleWidgetModel;
  selected: boolean;
  onSelect: () => void;
  onRectChange: (next: CanvasRect) => void;
  onLabelChange: (nextLabel: string) => void;
  onActivate: () => void;
  onDeactivate: () => void;
  activeState?: "on" | "off" | null;
};

export function RosMessageToggleWidget({
  widget,
  selected,
  onSelect,
  onRectChange,
  onLabelChange,
  onActivate,
  onDeactivate,
  activeState,
}: RosMessageToggleWidgetProps) {
  return (
    <ToggleSwitchCard
      rect={widget.rect}
      label={widget.label}
      selected={selected}
      onSelect={onSelect}
      onRectChange={onRectChange}
      onLabelChange={onLabelChange}
      onActivate={onActivate}
      onDeactivate={onDeactivate}
      activeState={activeState}
      ariaLabel={`${widget.label} ROS message toggle`}
    />
  );
}
