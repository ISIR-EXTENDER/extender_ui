import { useEffect, useMemo, useRef, useState } from "react";
import { CanvasItem } from "../layout/CanvasItem";
import type { CanvasRect } from "../layout/CanvasItem";
import * as Slider from "@radix-ui/react-slider";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { InlineEditableText } from "./InlineEditableText";
import { selectModeLabel, useTeleopStore } from "../../store/teleopStore";
import type {
  ButtonWidget as ButtonWidgetModel,
  CurvesWidget as CurvesWidgetModel,
  GripperControlWidget as GripperControlWidgetModel,
  LogsWidget as LogsWidgetModel,
  MagnetControlWidget as MagnetControlWidgetModel,
  ModeButtonWidget as ModeButtonWidgetModel,
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
  disabled?: boolean;
  active?: boolean;
  tone?: "default" | "accent" | "success" | "danger";
};

type ModeButtonWidgetProps = BaseWidgetProps & {
  widget: ModeButtonWidgetModel;
  onLabelChange: (nextLabel: string) => void;
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
  valueLabel?: string;
  reverseDirection?: boolean;
};

type GripperControlWidgetProps = BaseWidgetProps & {
  widget: GripperControlWidgetModel;
  onLabelChange: (nextLabel: string) => void;
  onOpen: () => void;
  onClose: () => void;
  activeState?: "open" | "close" | null;
};

type MagnetControlWidgetProps = BaseWidgetProps & {
  widget: MagnetControlWidgetModel;
  onLabelChange: (nextLabel: string) => void;
  onActivate: () => void;
  onDeactivate: () => void;
  activeState?: "on" | "off" | null;
};

type StreamDisplayWidgetProps = BaseWidgetProps & {
  widget: StreamDisplayWidgetModel;
  onLabelChange: (nextLabel: string) => void;
  statusText: string;
};

type CurvesWidgetProps = BaseWidgetProps & {
  widget: CurvesWidgetModel;
  onLabelChange: (nextLabel: string) => void;
};

type LogsWidgetProps = BaseWidgetProps & {
  widget: LogsWidgetModel;
  onLabelChange: (nextLabel: string) => void;
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
  disabled = false,
  active = false,
  tone = "default",
}: ActionButtonWidgetProps) {
  const className = [
    "controls-action-button-widget",
    `tone-${tone}`,
    active ? "is-active" : "",
    disabled ? "is-disabled" : "",
  ]
    .join(" ")
    .trim();

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
      <button
        type="button"
        className={className}
        onClick={onTrigger}
        disabled={disabled}
        data-canvas-interactive="true"
      >
        <InlineEditableText value={widget.label} onCommit={onLabelChange} className="controls-inline-label" />
      </button>
    </CanvasItem>
  );
}

export function ModeButtonWidget({
  widget,
  selected,
  onSelect,
  onRectChange,
  onLabelChange,
}: ModeButtonWidgetProps) {
  const mode = useTeleopStore((s) => s.mode);
  const cycleMode = useTeleopStore((s) => s.cycleMode);

  return (
    <CanvasItem
      x={widget.rect.x}
      y={widget.rect.y}
      w={widget.rect.w}
      h={widget.rect.h}
      onChange={onRectChange}
      onSelect={onSelect}
      selected={selected}
      minSize={{ w: 132, h: 42 }}
      className="controls-mode-button-item"
    >
      <button
        type="button"
        className="controls-mode-button-widget"
        data-canvas-interactive="true"
        onClick={cycleMode}
      >
        <span className="controls-mode-button-label">
          <InlineEditableText value={widget.label} onCommit={onLabelChange} className="controls-inline-label" />
        </span>
        <span className="controls-mode-button-value">{selectModeLabel(mode)}</span>
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
  valueLabel,
  reverseDirection = false,
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
          dir={reverseDirection ? "rtl" : "ltr"}
          value={[value]}
          onValueChange={(next) => onValueChange(next[0] ?? value)}
        >
          <Slider.Track className="slider-track">
            <Slider.Range className="slider-range" />
          </Slider.Track>
          <Slider.Thumb className="slider-thumb" />
        </Slider.Root>
        <div className="controls-max-velocity-value">
          {valueLabel ?? `gain: ${value.toFixed(2)}`}
        </div>
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
  onOpen,
  onClose,
  activeState,
}: GripperControlWidgetProps) {
  const [localActiveSide, setLocalActiveSide] = useState<"open" | "close" | null>(null);
  const activeSide = activeState ?? localActiveSide;

  return (
    <CanvasItem
      x={widget.rect.x}
      y={widget.rect.y}
      w={widget.rect.w}
      h={widget.rect.h}
      onChange={onRectChange}
      onSelect={onSelect}
      selected={selected}
      minSize={{ w: 180, h: 92 }}
      className="controls-gripper-item"
    >
      <div className="controls-gripper-widget">
        <div className="controls-gripper-title">
          <InlineEditableText value={widget.label} onCommit={onLabelChange} className="controls-inline-label" />
        </div>
        <div className="controls-gripper-actions">
          <button
            type="button"
            className={`action-button open ${activeSide === "open" ? "is-active" : ""}`.trim()}
            aria-pressed={activeSide === "open"}
            onClick={() => {
              setLocalActiveSide("open");
              onOpen();
            }}
          >
            Open
          </button>
          <button
            type="button"
            className={`action-button close ${activeSide === "close" ? "is-active" : ""}`.trim()}
            aria-pressed={activeSide === "close"}
            onClick={() => {
              setLocalActiveSide("close");
              onClose();
            }}
          >
            Close
          </button>
        </div>
      </div>
    </CanvasItem>
  );
}

export function MagnetControlWidget({
  widget,
  selected,
  onSelect,
  onRectChange,
  onLabelChange,
  onActivate,
  onDeactivate,
  activeState,
}: MagnetControlWidgetProps) {
  const [localActiveSide, setLocalActiveSide] = useState<"on" | "off" | null>(null);
  const activeSide = activeState ?? localActiveSide;

  return (
    <CanvasItem
      x={widget.rect.x}
      y={widget.rect.y}
      w={widget.rect.w}
      h={widget.rect.h}
      onChange={onRectChange}
      onSelect={onSelect}
      selected={selected}
      minSize={{ w: 180, h: 92 }}
      className="controls-magnet-item"
    >
      <div className="controls-magnet-widget">
        <div className="controls-magnet-title">
          <InlineEditableText value={widget.label} onCommit={onLabelChange} className="controls-inline-label" />
        </div>
        <div className="controls-magnet-actions">
          <button
            type="button"
            className={`action-button on ${activeSide === "on" ? "is-active" : ""}`.trim()}
            aria-pressed={activeSide === "on"}
            onClick={() => {
              setLocalActiveSide("on");
              onActivate();
            }}
          >
            ON
          </button>
          <button
            type="button"
            className={`action-button off ${activeSide === "off" ? "is-active" : ""}`.trim()}
            aria-pressed={activeSide === "off"}
            onClick={() => {
              setLocalActiveSide("off");
              onDeactivate();
            }}
          >
            OFF
          </button>
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
  type WebcamOption = {
    deviceId: string;
    label: string;
  };
  const [remoteImageFailed, setRemoteImageFailed] = useState(false);
  const [webcamLoading, setWebcamLoading] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [webcamFrameReady, setWebcamFrameReady] = useState(false);
  const [webcamOptions, setWebcamOptions] = useState<WebcamOption[]>([]);
  const [activeWebcamDeviceId, setActiveWebcamDeviceId] = useState("");
  const [preferredWebcamDeviceId, setPreferredWebcamDeviceId] = useState("");
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const webcamPreferenceKey = `extender.controls.webcam.device.${widget.id}`;
  const webcamPickerId = `stream-webcam-picker-${widget.id}`;
  const trimmedStreamUrl = widget.streamUrl.trim();
  const isHttpStream = /^https?:\/\//i.test(trimmedStreamUrl);
  const isInlineImageStream = /^data:image\//i.test(trimmedStreamUrl);
  const wantsWebcam =
    widget.source === "webcam" || /^webcam:\/\//i.test(trimmedStreamUrl);
  const canEmbedVisualization =
    widget.source === "visualization" && isHttpStream;
  type WebcamSelector =
    | { mode: "default" }
    | { mode: "device_id"; value: string }
    | { mode: "label_hint"; value: string };
  const parseWebcamSelector = (rawUrl: string): WebcamSelector => {
    const prefix = "webcam://";
    if (!rawUrl.toLowerCase().startsWith(prefix)) return { mode: "default" };
    const encodedSelector = rawUrl.slice(prefix.length).trim();
    if (!encodedSelector || encodedSelector.toLowerCase() === "default") {
      return { mode: "default" };
    }

    let decodedSelector = encodedSelector;
    try {
      decodedSelector = decodeURIComponent(encodedSelector);
    } catch {
      decodedSelector = encodedSelector;
    }
    const normalizedSelector = decodedSelector.trim().toLowerCase();
    if (
      normalizedSelector.startsWith("/dev/video") ||
      /^video\d+$/i.test(normalizedSelector)
    ) {
      return { mode: "label_hint", value: normalizedSelector };
    }
    return { mode: "device_id", value: decodedSelector.trim() };
  };
  const normalizeVideoLabelHint = (value: string) =>
    value.trim().toLowerCase().replace(/^\/dev\//, "");
  const parseVideoNodeIndex = (hint: string): number | null => {
    const match = hint.trim().toLowerCase().match(/(?:^|\/)video(\d+)$/);
    if (!match) return null;
    const index = Number.parseInt(match[1], 10);
    return Number.isFinite(index) ? index : null;
  };
  const resolveVideoInputDeviceIdByLabelHint = async (hint: string) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return null;
    }
    const hintLower = hint.toLowerCase();
    const normalizedHint = normalizeVideoLabelHint(hintLower);
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter((device) => device.kind === "videoinput");

    for (const device of devices) {
      if (device.kind !== "videoinput" || !device.label) continue;
      const labelLower = device.label.toLowerCase();
      const normalizedLabel = normalizeVideoLabelHint(labelLower);
      if (
        labelLower.includes(hintLower) ||
        normalizedLabel.includes(normalizedHint)
      ) {
        return device.deviceId;
      }
    }

    const nodeIndex = parseVideoNodeIndex(hintLower);
    if (nodeIndex != null && videoInputs.length) {
      const indexCandidates = [nodeIndex, Math.floor(nodeIndex / 2), nodeIndex - 1];
      const uniqueIndices = [...new Set(indexCandidates)];
      for (const candidate of uniqueIndices) {
        if (candidate >= 0 && candidate < videoInputs.length) {
          const mapped = videoInputs[candidate];
          if (mapped) return mapped.deviceId;
        }
      }
    }
    return null;
  };
  const describeWebcamError = (error: unknown) => {
    if (error instanceof DOMException) {
      if (error.name === "NotAllowedError") {
        return "Webcam access denied.";
      }
      if (error.name === "NotFoundError") {
        return "No webcam found.";
      }
      if (error.name === "NotReadableError") {
        return "Webcam is busy.";
      }
      if (error.name === "OverconstrainedError") {
        return "Requested webcam device is unavailable.";
      }
    }
    return "Unable to start webcam.";
  };
  const listWebcamOptions = async (): Promise<WebcamOption[]> => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return [];
    }
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter((device) => device.kind === "videoinput");
    return videoInputs.map((device, index) => ({
      deviceId: device.deviceId,
      label: device.label?.trim() || `Camera ${index + 1}`,
    }));
  };
  const sourceLabel =
    widget.source === "rviz"
      ? "RViz"
      : widget.source === "visualization"
        ? "Visualization"
        : widget.source === "webcam"
          ? "Webcam"
        : "Camera";
  const showHeader = widget.showHeader ?? true;
  const showSourceBadge = widget.showSourceBadge ?? true;
  const showStatusRow = widget.showStatus ?? true;
  const showUrlRow = widget.showUrl ?? true;
  const showWebcamPicker = wantsWebcam && (widget.showWebcamPicker ?? true);
  const streamGridTemplateRows = [
    showHeader ? "auto" : null,
    showWebcamPicker ? "auto" : null,
    "1fr",
    showStatusRow ? "auto" : null,
    showUrlRow ? "auto" : null,
  ]
    .filter((row): row is string => row !== null)
    .join(" ");

  useEffect(() => {
    setRemoteImageFailed(false);
  }, [widget.source, widget.streamUrl]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(webcamPreferenceKey) ?? "";
      setPreferredWebcamDeviceId(saved);
    } catch {
      setPreferredWebcamDeviceId("");
    }
  }, [webcamPreferenceKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (!preferredWebcamDeviceId) {
        window.localStorage.removeItem(webcamPreferenceKey);
        return;
      }
      window.localStorage.setItem(webcamPreferenceKey, preferredWebcamDeviceId);
    } catch {
      // ignore storage errors
    }
  }, [preferredWebcamDeviceId, webcamPreferenceKey]);

  useEffect(() => {
    const stopCurrentStream = () => {
      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = null;
      }
      if (!webcamStreamRef.current) return;
      for (const track of webcamStreamRef.current.getTracks()) {
        track.stop();
      }
      webcamStreamRef.current = null;
    };

    if (!wantsWebcam) {
      stopCurrentStream();
      setWebcamLoading(false);
      setWebcamError(null);
      setWebcamFrameReady(false);
      setWebcamOptions([]);
      setActiveWebcamDeviceId("");
      return;
    }

    let cancelled = false;
    const startWebcam = async () => {
      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setWebcamError("Webcam API not available in this browser.");
        setWebcamLoading(false);
        return;
      }

      setWebcamLoading(true);
      setWebcamError(null);
      setWebcamFrameReady(false);
      stopCurrentStream();

      try {
        const selector = preferredWebcamDeviceId
          ? ({ mode: "device_id", value: preferredWebcamDeviceId } as const)
          : parseWebcamSelector(trimmedStreamUrl);
        let stream: MediaStream;
        if (selector.mode === "default") {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } else if (selector.mode === "device_id") {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: selector.value } },
            audio: false,
          });
        } else {
          const probeStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
          const hintedDeviceId = await resolveVideoInputDeviceIdByLabelHint(
            selector.value
          );
          if (!hintedDeviceId) {
            stream = probeStream;
          } else {
            const probeDeviceId =
              probeStream.getVideoTracks()[0]?.getSettings().deviceId ?? null;
            if (probeDeviceId === hintedDeviceId) {
              stream = probeStream;
            } else {
              for (const track of probeStream.getTracks()) {
                track.stop();
              }
              stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: hintedDeviceId } },
                audio: false,
              });
            }
          }
        }
        if (cancelled) {
          for (const track of stream.getTracks()) {
            track.stop();
          }
          return;
        }
        webcamStreamRef.current = stream;
        const streamDeviceId =
          stream.getVideoTracks()[0]?.getSettings().deviceId ?? "";
        setActiveWebcamDeviceId(streamDeviceId);
        const options = await listWebcamOptions();
        if (!cancelled) {
          setWebcamOptions(options);
        }
        if (webcamVideoRef.current) {
          webcamVideoRef.current.srcObject = stream;
          webcamVideoRef.current.onloadedmetadata = () => {
            void webcamVideoRef.current?.play().catch(() => {
              // autoplay can fail until user interaction; browser controls this.
            });
          };
          webcamVideoRef.current.onplaying = () => {
            setWebcamFrameReady(true);
            setWebcamLoading(false);
          };
        }
      } catch (error) {
        if (cancelled) return;
        setWebcamError(describeWebcamError(error));
        setWebcamLoading(false);
        setWebcamFrameReady(false);
      }
    };

    void startWebcam();

    return () => {
      cancelled = true;
      stopCurrentStream();
    };
  }, [preferredWebcamDeviceId, trimmedStreamUrl, wantsWebcam]);

  const hasPreferredOption = webcamOptions.some(
    (option) => option.deviceId === preferredWebcamDeviceId
  );
  const webcamPickerValue =
    preferredWebcamDeviceId || activeWebcamDeviceId || "";

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
      <div className="controls-stream-widget" style={{ gridTemplateRows: streamGridTemplateRows }}>
        {showHeader ? (
          <div className="controls-stream-title-row">
            <div className="controls-stream-title">
              <InlineEditableText value={widget.label} onCommit={onLabelChange} className="controls-inline-label" />
            </div>
            {showSourceBadge ? <span className="controls-stream-source">{sourceLabel}</span> : null}
          </div>
        ) : null}
        {showWebcamPicker ? (
          <div className="controls-stream-picker-row">
            <label className="controls-stream-picker-label" htmlFor={webcamPickerId}>
              Camera
            </label>
            <select
              id={webcamPickerId}
              className="controls-stream-picker"
              value={webcamPickerValue}
              onChange={(event) => setPreferredWebcamDeviceId(event.target.value)}
              data-canvas-interactive="true"
            >
              <option value="">Auto</option>
              {preferredWebcamDeviceId && !hasPreferredOption ? (
                <option value={preferredWebcamDeviceId}>
                  Saved camera (unavailable)
                </option>
              ) : null}
              {webcamOptions.map((option) => (
                <option key={option.deviceId} value={option.deviceId}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div className={`controls-stream-view controls-stream-fit-${widget.fitMode}`}>
          {wantsWebcam ? (
            webcamError ? (
              <div className="stream-placeholder">{webcamError}</div>
            ) : (
              <>
                {!webcamFrameReady || webcamLoading ? (
                  <div className="stream-placeholder">Starting webcam stream...</div>
                ) : null}
                <video
                  ref={webcamVideoRef}
                  className="controls-stream-media"
                  autoPlay
                  playsInline
                  muted
                  data-stream-widget-id={widget.id}
                  style={{
                    objectFit: widget.fitMode,
                    display: webcamFrameReady ? "block" : "none",
                  }}
                />
              </>
            )
          ) : canEmbedVisualization ? (
            <iframe
              className="controls-stream-iframe"
              src={widget.streamUrl}
              title={`${widget.label} visualization`}
              loading="lazy"
            />
          ) : (isHttpStream || isInlineImageStream) && !remoteImageFailed ? (
            <img
              className="controls-stream-media"
              src={widget.streamUrl}
              alt={`${widget.label} stream`}
              loading="lazy"
              data-stream-widget-id={widget.id}
              style={{ objectFit: widget.fitMode }}
              onError={() => setRemoteImageFailed(true)}
            />
          ) : (
            <div className="stream-placeholder">
              {widget.overlayText?.trim() || statusText}
            </div>
          )}
        </div>
        {showStatusRow ? <div className="controls-stream-status">{statusText}</div> : null}
        {showUrlRow ? <div className="controls-stream-url">{widget.streamUrl || "no stream url"}</div> : null}
      </div>
    </CanvasItem>
  );
}

type CurveSample = {
  tick: number;
  joyX: number;
  joyY: number;
  rotX: number;
  rotY: number;
  z: number;
  rz: number;
  tcpSpeed: number;
};

export function CurvesWidget({
  widget,
  selected,
  onSelect,
  onRectChange,
  onLabelChange,
}: CurvesWidgetProps) {
  const joyX = useTeleopStore((s) => s.joyX);
  const joyY = useTeleopStore((s) => s.joyY);
  const rotX = useTeleopStore((s) => s.rotX);
  const rotY = useTeleopStore((s) => s.rotY);
  const z = useTeleopStore((s) => s.z);
  const rz = useTeleopStore((s) => s.rz);
  const tcpSpeed = useTeleopStore((s) => s.wsState?.tcp_speed_mps ?? 0);
  const [samples, setSamples] = useState<CurveSample[]>([]);

  useEffect(() => {
    const sampleRate = Math.max(1, Math.round(widget.sampleRateHz));
    const historySeconds = Math.max(2, Math.round(widget.historySeconds));
    const maxPoints = Math.max(16, sampleRate * historySeconds);
    const intervalMs = Math.round(1000 / sampleRate);

    // TODO: Replace client-side sampled values with backend telemetry history stream.
    const timer = window.setInterval(() => {
      setSamples((prev) => {
        const next: CurveSample = {
          tick: Date.now(),
          joyX,
          joyY,
          rotX,
          rotY,
          z,
          rz,
          tcpSpeed,
        };
        const merged = [...prev, next];
        if (merged.length <= maxPoints) return merged;
        return merged.slice(merged.length - maxPoints);
      });
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [joyX, joyY, rotX, rotY, z, rz, tcpSpeed, widget.historySeconds, widget.sampleRateHz]);

  const chartData = useMemo(
    () =>
      samples.map((sample) => ({
        ...sample,
        t: new Date(sample.tick).toLocaleTimeString([], {
          minute: "2-digit",
          second: "2-digit",
        }),
      })),
    [samples]
  );

  return (
    <CanvasItem
      x={widget.rect.x}
      y={widget.rect.y}
      w={widget.rect.w}
      h={widget.rect.h}
      onChange={onRectChange}
      onSelect={onSelect}
      selected={selected}
      minSize={{ w: 280, h: 180 }}
      className="controls-curves-item"
    >
      <div className="controls-curves-widget">
        <div className="controls-curves-header">
          <div className="controls-curves-title">
            <InlineEditableText value={widget.label} onCommit={onLabelChange} className="controls-inline-label" />
          </div>
          <div className="controls-curves-meta">
            {widget.sampleRateHz}Hz / {widget.historySeconds}s
          </div>
        </div>
        <div className="controls-curves-chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="t" minTickGap={18} />
              <YAxis yAxisId="axes" domain={[-1, 1]} width={24} />
              <YAxis yAxisId="speed" orientation="right" domain={[0, 2]} width={24} />
              <Tooltip />
              {widget.showLegend ? <Legend /> : null}
              <Line yAxisId="axes" type="monotone" dataKey="joyX" name="joyX" dot={false} stroke="#60a5fa" strokeWidth={2} />
              <Line yAxisId="axes" type="monotone" dataKey="joyY" name="joyY" dot={false} stroke="#93c5fd" strokeWidth={2} />
              <Line yAxisId="axes" type="monotone" dataKey="rotX" name="rotX" dot={false} stroke="#f59e0b" strokeWidth={2} />
              <Line yAxisId="axes" type="monotone" dataKey="rotY" name="rotY" dot={false} stroke="#fb7185" strokeWidth={2} />
              <Line yAxisId="axes" type="monotone" dataKey="z" name="z" dot={false} stroke="#34d399" strokeWidth={2} />
              <Line yAxisId="axes" type="monotone" dataKey="rz" name="rz" dot={false} stroke="#22d3ee" strokeWidth={2} />
              {widget.showSpeed ? (
                <Line
                  yAxisId="speed"
                  type="monotone"
                  dataKey="tcpSpeed"
                  name="tcpSpeed"
                  dot={false}
                  stroke="#facc15"
                  strokeWidth={2}
                />
              ) : null}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </CanvasItem>
  );
}

type LogEntry = {
  id: string;
  ts: number;
  level: "info" | "warn" | "error";
  message: string;
};

export function LogsWidget({
  widget,
  selected,
  onSelect,
  onRectChange,
  onLabelChange,
}: LogsWidgetProps) {
  const wsStatus = useTeleopStore((s) => s.wsStatus);
  const wsState = useTeleopStore((s) => s.wsState);
  const mode = useTeleopStore((s) => s.mode);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const listRef = useRef<HTMLDivElement | null>(null);

  const appendEntry = (level: LogEntry["level"], message: string) => {
    const maxEntries = Math.max(10, Math.round(widget.maxEntries));
    setEntries((prev) => {
      const entry: LogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        ts: Date.now(),
        level,
        message,
      };
      const merged = [...prev, entry];
      if (merged.length <= maxEntries) return merged;
      return merged.slice(merged.length - maxEntries);
    });
  };

  useEffect(() => {
    const level = wsStatus === "connected" ? "info" : wsStatus === "connecting" ? "warn" : "error";
    appendEntry(level, `WebSocket status: ${wsStatus}`);
  }, [wsStatus]);

  useEffect(() => {
    appendEntry("info", `Control mode: ${selectModeLabel(mode)}`);
  }, [mode]);

  useEffect(() => {
    // TODO: Replace synthetic heartbeat events with backend log stream subscription.
    const timer = window.setInterval(() => {
      const cmdAge = wsState?.cmd_age_ms ?? null;
      if (cmdAge != null && cmdAge > 300) {
        appendEntry("warn", `Command latency elevated (${cmdAge}ms)`);
        return;
      }
      appendEntry("info", "Runtime heartbeat");
    }, 3000);

    return () => window.clearInterval(timer);
  }, [wsState?.cmd_age_ms]);

  const filteredEntries = useMemo(() => {
    if (widget.levelFilter === "all") return entries;
    return entries.filter((entry) => entry.level === widget.levelFilter);
  }, [entries, widget.levelFilter]);

  useEffect(() => {
    if (!widget.autoScroll) return;
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [filteredEntries, widget.autoScroll]);

  return (
    <CanvasItem
      x={widget.rect.x}
      y={widget.rect.y}
      w={widget.rect.w}
      h={widget.rect.h}
      onChange={onRectChange}
      onSelect={onSelect}
      selected={selected}
      minSize={{ w: 260, h: 170 }}
      className="controls-logs-item"
    >
      <div className="controls-logs-widget">
        <div className="controls-logs-header">
          <div className="controls-logs-title">
            <InlineEditableText value={widget.label} onCommit={onLabelChange} className="controls-inline-label" />
          </div>
          <div className="controls-logs-meta">{filteredEntries.length} entries</div>
        </div>
        <div className="controls-logs-list" ref={listRef}>
          {filteredEntries.length ? (
            filteredEntries.map((entry) => (
              <div key={entry.id} className={`controls-log-entry is-${entry.level}`}>
                {widget.showTimestamp ? (
                  <span className="controls-log-ts">
                    {new Date(entry.ts).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                ) : null}
                <span className="controls-log-level">{entry.level.toUpperCase()}</span>
                <span className="controls-log-message">{entry.message}</span>
              </div>
            ))
          ) : (
            <div className="controls-log-empty">No logs for current filter.</div>
          )}
        </div>
        <div className="controls-logs-footer">filter: {widget.levelFilter}</div>
      </div>
    </CanvasItem>
  );
}
