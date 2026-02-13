import { CanvasItem } from "../layout/CanvasItem";
import type { CanvasRect } from "../layout/CanvasItem";
import type {
  LoadPoseButtonWidget as LoadPoseButtonWidgetModel,
  SavePoseButtonWidget as SavePoseButtonWidgetModel,
} from "./widgetTypes";

type SavePoseButtonWidgetProps = {
  widget: SavePoseButtonWidgetModel;
  selected: boolean;
  onSelect: () => void;
  onRectChange: (next: CanvasRect) => void;
  onTrigger: () => void;
};

type LoadPoseButtonWidgetProps = {
  widget: LoadPoseButtonWidgetModel;
  selected: boolean;
  onSelect: () => void;
  onRectChange: (next: CanvasRect) => void;
  onTrigger: () => void;
  poseAvailable: boolean;
};

const iconSvg = (icon: "home" | "save") => {
  if (icon === "home") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M3 10.6L12 3l9 7.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.5 9.8V20h11V9.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 4h11l3 3v13H5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 4v6h8V4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 20v-6h8v6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export function SavePoseButtonWidget({
  widget,
  selected,
  onSelect,
  onRectChange,
  onTrigger,
}: SavePoseButtonWidgetProps) {
  return (
    <CanvasItem
      x={widget.rect.x}
      y={widget.rect.y}
      w={widget.rect.w}
      h={widget.rect.h}
      onChange={onRectChange}
      onSelect={onSelect}
      selected={selected}
      minSize={{ w: 92, h: 42 }}
      className="controls-pose-button-item"
    >
      <button type="button" className="controls-pose-button" onClick={onTrigger}>
        <span className="controls-pose-button-icon">{iconSvg("save")}</span>
        <span className="controls-pose-button-label">{widget.label}</span>
      </button>
    </CanvasItem>
  );
}

export function LoadPoseButtonWidget({
  widget,
  selected,
  onSelect,
  onRectChange,
  onTrigger,
  poseAvailable,
}: LoadPoseButtonWidgetProps) {
  return (
    <CanvasItem
      x={widget.rect.x}
      y={widget.rect.y}
      w={widget.rect.w}
      h={widget.rect.h}
      onChange={onRectChange}
      onSelect={onSelect}
      selected={selected}
      minSize={{ w: 92, h: 42 }}
      className="controls-pose-button-item"
    >
      <button
        type="button"
        className="controls-pose-button"
        onClick={onTrigger}
        disabled={!poseAvailable || !widget.poseName}
      >
        <span className="controls-pose-button-icon">{iconSvg(widget.icon)}</span>
        <span className="controls-pose-button-label">
          {widget.poseName || widget.label}
        </span>
      </button>
    </CanvasItem>
  );
}
