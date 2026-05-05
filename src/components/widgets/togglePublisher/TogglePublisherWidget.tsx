import { ToggleSwitchCard } from "../toggleControls/ToggleSwitchCard";
import type { TogglePublisherWidget as TogglePublisherWidgetModel } from "../widgetTypes";
import type { CanvasRect } from "../../layout/CanvasItem";

type TogglePublisherWidgetProps = {
  widget: TogglePublisherWidgetModel;
  selected: boolean;
  onSelect: () => void;
  onRectChange: (next: CanvasRect) => void;
  onLabelChange: (nextLabel: string) => void;
  onActivate: () => void;
  onDeactivate: () => void;
  activeState?: "on" | "off" | null;
};

export function TogglePublisherWidget({
  widget,
  selected,
  onSelect,
  onRectChange,
  onLabelChange,
  onActivate,
  onDeactivate,
  activeState,
}: TogglePublisherWidgetProps) {
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
    />
  );
}
