import { CanvasItem } from "../layout/CanvasItem";
import type { CanvasRect } from "../layout/CanvasItem";
import * as Slider from "@radix-ui/react-slider";
import { InlineEditableText } from "./InlineEditableText";
import type {
  ButtonWidget as ButtonWidgetModel,
  GripperControlWidget as GripperControlWidgetModel,
  MaxVelocityWidget as MaxVelocityWidgetModel,
  NavigationBarWidget as NavigationBarWidgetModel,
  NavigationButtonWidget as NavigationButtonWidgetModel,
  RosbagControlWidget as RosbagControlWidgetModel,
  StreamDisplayWidget as StreamDisplayWidgetModel,
  TextareaWidget as TextareaWidgetModel,
  TextWidget as TextWidgetModel,
  WidgetIcon,
} from "./widgetTypes";

type BaseWidgetProps = {
  selected: boolean;
  onSelect: () => void;
  onRectChange: (next: CanvasRect) => void;
};

type TextWidgetProps = BaseWidgetProps & {
  widget: TextWidgetModel;
  onTextChange: (nextText: string) => void;
};

type TextareaWidgetProps = BaseWidgetProps & {
  widget: TextareaWidgetModel;
  onTextChange: (nextText: string) => void;
};

type ActionButtonWidgetProps = BaseWidgetProps & {
  widget: ButtonWidgetModel;
  onLabelChange: (nextLabel: string) => void;
  onTrigger: () => void;
};

type NavigationButtonWidgetProps = BaseWidgetProps & {
  widget: NavigationButtonWidgetModel;
  onLabelChange: (nextLabel: string) => void;
  onNavigate: (screenId: string) => void;
  canNavigate: boolean;
};

type NavigationBarWidgetProps = BaseWidgetProps & {
  widget: NavigationBarWidgetModel;
  onNavigate: (screenId: string) => void;
  allowedScreenIds?: Set<string>;
};

type RosbagControlWidgetProps = BaseWidgetProps & {
  widget: RosbagControlWidgetModel;
  onLabelChange: (nextLabel: string) => void;
  isRecording: boolean;
  statusText: string;
  onToggleRecording: () => void;
};

type MaxVelocityWidgetProps = BaseWidgetProps & {
  widget: MaxVelocityWidgetModel;
  onLabelChange: (nextLabel: string) => void;
  value: number;
  onValueChange: (value: number) => void;
};

type GripperControlWidgetProps = BaseWidgetProps & {
  widget: GripperControlWidgetModel;
  onLabelChange: (nextLabel: string) => void;
  speed: number;
  force: number;
  onSpeedChange: (value: number) => void;
  onForceChange: (value: number) => void;
  onOpen: () => void;
  onClose: () => void;
};

type StreamDisplayWidgetProps = BaseWidgetProps & {
  widget: StreamDisplayWidgetModel;
  onLabelChange: (nextLabel: string) => void;
  statusText: string;
};

const renderIcon = (icon: WidgetIcon) => {
  if (icon === "home") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 10.6L12 3l9 7.6" />
        <path d="M6.5 9.8V20h11V9.8" />
      </svg>
    );
  }
  if (icon === "save") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 4h11l3 3v13H5z" />
        <path d="M8 4v6h8V4" />
        <path d="M8 20v-6h8v6" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
};

export function TextWidget({
  widget,
  selected,
  onSelect,
  onRectChange,
  onTextChange,
}: TextWidgetProps) {
  return (
    <CanvasItem
      x={widget.rect.x}
      y={widget.rect.y}
      w={widget.rect.w}
      h={widget.rect.h}
      onChange={onRectChange}
      onSelect={onSelect}
      selected={selected}
      minSize={{ w: 120, h: 46 }}
      className="controls-text-item"
    >
      <div
        className={`controls-text-widget controls-align-${widget.align}`}
        style={{ fontSize: `${widget.fontSize}px` }}
      >
        <InlineEditableText value={widget.text} onCommit={onTextChange} className="controls-inline-label" />
      </div>
    </CanvasItem>
  );
}

export function TextareaWidget({
  widget,
  selected,
  onSelect,
  onRectChange,
  onTextChange,
}: TextareaWidgetProps) {
  return (
    <CanvasItem
      x={widget.rect.x}
      y={widget.rect.y}
      w={widget.rect.w}
      h={widget.rect.h}
      onChange={onRectChange}
      onSelect={onSelect}
      selected={selected}
      minSize={{ w: 140, h: 80 }}
      className="controls-textarea-item"
    >
      <div className="controls-textarea-widget" style={{ fontSize: `${widget.fontSize}px` }}>
        <InlineEditableText value={widget.text} onCommit={onTextChange} className="controls-inline-label" />
      </div>
    </CanvasItem>
  );
}

export function ActionButtonWidget({
  widget,
  selected,
  onSelect,
  onRectChange,
  onLabelChange,
  onTrigger,
}: ActionButtonWidgetProps) {
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
      className="controls-action-button-item"
    >
      <button type="button" className="controls-action-button-widget" onClick={onTrigger}>
        <InlineEditableText value={widget.label} onCommit={onLabelChange} className="controls-inline-label" />
      </button>
    </CanvasItem>
  );
}

export function NavigationButtonWidget({
  widget,
  selected,
  onSelect,
  onRectChange,
  onLabelChange,
  onNavigate,
  canNavigate,
}: NavigationButtonWidgetProps) {
  return (
    <CanvasItem
      x={widget.rect.x}
      y={widget.rect.y}
      w={widget.rect.w}
      h={widget.rect.h}
      onChange={onRectChange}
      onSelect={onSelect}
      selected={selected}
      minSize={{ w: 110, h: 42 }}
      className="controls-navigation-button-item"
    >
      <button
        type="button"
        className="controls-navigation-button-widget"
        disabled={!canNavigate || !widget.targetScreenId}
        onClick={() => onNavigate(widget.targetScreenId)}
      >
        <span className="controls-navigation-icon">{renderIcon(widget.icon)}</span>
        <span className="controls-navigation-label">
          <InlineEditableText value={widget.label} onCommit={onLabelChange} className="controls-inline-label" />
        </span>
      </button>
    </CanvasItem>
  );
}

export function NavigationBarWidget({
  widget,
  selected,
  onSelect,
  onRectChange,
  onNavigate,
  allowedScreenIds,
}: NavigationBarWidgetProps) {
  return (
    <CanvasItem
      x={widget.rect.x}
      y={widget.rect.y}
      w={widget.rect.w}
      h={widget.rect.h}
      onChange={onRectChange}
      onSelect={onSelect}
      selected={selected}
      minSize={{ w: 150, h: 80 }}
      className="controls-navigation-bar-item"
    >
      <div
        className={`controls-navigation-bar-widget ${
          widget.orientation === "horizontal" ? "is-horizontal" : "is-vertical"
        }`}
      >
        {widget.items.length === 0 ? (
          <div className="controls-navigation-empty">No links configured.</div>
        ) : (
          widget.items.map((item) => {
            const allowed = allowedScreenIds ? allowedScreenIds.has(item.targetScreenId) : true;
            return (
              <button
                key={item.id}
                type="button"
                className="controls-navigation-link"
                disabled={!allowed || !item.targetScreenId}
                onClick={() => onNavigate(item.targetScreenId)}
              >
                {item.label}
              </button>
            );
          })
        )}
      </div>
    </CanvasItem>
  );
}

export function RosbagControlWidget({
  widget,
  selected,
  onSelect,
  onRectChange,
  onLabelChange,
  isRecording,
  statusText,
  onToggleRecording,
}: RosbagControlWidgetProps) {
  return (
    <CanvasItem
      x={widget.rect.x}
      y={widget.rect.y}
      w={widget.rect.w}
      h={widget.rect.h}
      onChange={onRectChange}
      onSelect={onSelect}
      selected={selected}
      minSize={{ w: 220, h: 120 }}
      className="controls-rosbag-item"
    >
      <div className="controls-rosbag-widget">
        <div className="controls-rosbag-title">
          <InlineEditableText value={widget.label} onCommit={onLabelChange} className="controls-inline-label" />
        </div>
        <div className="controls-rosbag-status-row">
          <span className={`controls-rosbag-led ${isRecording ? "is-on" : "is-off"}`} />
          <span className="controls-rosbag-status">{statusText}</span>
        </div>
        <div className="controls-rosbag-meta">
          <div>name: {widget.bagName || "n/a"}</div>
          <div>auto timestamp: {widget.autoTimestamp ? "on" : "off"}</div>
        </div>
        <button
          type="button"
          className={`controls-rosbag-toggle ${isRecording ? "is-stop" : "is-start"}`}
          onClick={onToggleRecording}
        >
          {isRecording ? "Stop recording" : "Start recording"}
        </button>
      </div>
    </CanvasItem>
  );
}

export function MaxVelocityWidget({
  widget,
  selected,
  onSelect,
  onRectChange,
  onLabelChange,
  value,
  onValueChange,
}: MaxVelocityWidgetProps) {
  return (
    <CanvasItem
      x={widget.rect.x}
      y={widget.rect.y}
      w={widget.rect.w}
      h={widget.rect.h}
      onChange={onRectChange}
      onSelect={onSelect}
      selected={selected}
      minSize={{ w: 180, h: 76 }}
      className="controls-max-velocity-item"
    >
      <div className="controls-max-velocity-widget">
        <div className="controls-max-velocity-title">
          <InlineEditableText value={widget.label} onCommit={onLabelChange} className="controls-inline-label" />
        </div>
        <Slider.Root
          className="slider"
          min={widget.min}
          max={widget.max}
          step={widget.step}
          value={[value]}
          onValueChange={(next) => onValueChange(next[0] ?? value)}
        >
          <Slider.Track className="slider-track">
            <Slider.Range className="slider-range" />
          </Slider.Track>
          <Slider.Thumb className="slider-thumb" />
        </Slider.Root>
        <div className="controls-max-velocity-value">gain: {value.toFixed(2)}</div>
      </div>
    </CanvasItem>
  );
}

export function GripperControlWidget({
  widget,
  selected,
  onSelect,
  onRectChange,
  onLabelChange,
  speed,
  force,
  onSpeedChange,
  onForceChange,
  onOpen,
  onClose,
}: GripperControlWidgetProps) {
  return (
    <CanvasItem
      x={widget.rect.x}
      y={widget.rect.y}
      w={widget.rect.w}
      h={widget.rect.h}
      onChange={onRectChange}
      onSelect={onSelect}
      selected={selected}
      minSize={{ w: 240, h: 140 }}
      className="controls-gripper-item"
    >
      <div className="controls-gripper-widget">
        <div className="controls-gripper-title">
          <InlineEditableText value={widget.label} onCommit={onLabelChange} className="controls-inline-label" />
        </div>
        <div className="controls-gripper-actions">
          <button type="button" className="action-button open" onClick={onOpen}>
            Open
          </button>
          <button type="button" className="action-button close" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="axis-row">
          <label>Speed: {speed.toFixed(2)}</label>
          <Slider.Root
            className="slider"
            min={0}
            max={1}
            step={0.01}
            value={[speed]}
            onValueChange={(next) => onSpeedChange(next[0] ?? speed)}
          >
            <Slider.Track className="slider-track">
              <Slider.Range className="slider-range" />
            </Slider.Track>
            <Slider.Thumb className="slider-thumb" />
          </Slider.Root>
        </div>
        <div className="axis-row">
          <label>Force: {force.toFixed(2)}</label>
          <Slider.Root
            className="slider"
            min={0}
            max={1}
            step={0.01}
            value={[force]}
            onValueChange={(next) => onForceChange(next[0] ?? force)}
          >
            <Slider.Track className="slider-track">
              <Slider.Range className="slider-range" />
            </Slider.Track>
            <Slider.Thumb className="slider-thumb" />
          </Slider.Root>
        </div>
      </div>
    </CanvasItem>
  );
}

export function StreamDisplayWidget({
  widget,
  selected,
  onSelect,
  onRectChange,
  onLabelChange,
  statusText,
}: StreamDisplayWidgetProps) {
  return (
    <CanvasItem
      x={widget.rect.x}
      y={widget.rect.y}
      w={widget.rect.w}
      h={widget.rect.h}
      onChange={onRectChange}
      onSelect={onSelect}
      selected={selected}
      minSize={{ w: 220, h: 160 }}
      className="controls-stream-item"
    >
      <div className="controls-stream-widget">
        <div className="controls-stream-title">
          <InlineEditableText value={widget.label} onCommit={onLabelChange} className="controls-inline-label" />
        </div>
        <div className="controls-stream-view">
          <div className="stream-placeholder">{statusText}</div>
        </div>
        <div className="controls-stream-url">{widget.streamUrl || "no stream url"}</div>
      </div>
    </CanvasItem>
  );
}
