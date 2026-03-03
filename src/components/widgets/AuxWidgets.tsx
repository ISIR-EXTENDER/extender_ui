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
};

type GripperControlWidgetProps = BaseWidgetProps & {
  widget: GripperControlWidgetModel;
  onLabelChange: (nextLabel: string) => void;
  onOpen: () => void;
  onClose: () => void;
};

type MagnetControlWidgetProps = BaseWidgetProps & {
  widget: MagnetControlWidgetModel;
  onLabelChange: (nextLabel: string) => void;
  onActivate: () => void;
  onDeactivate: () => void;
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
  onOpen,
  onClose,
}: GripperControlWidgetProps) {
  const [activeSide, setActiveSide] = useState<"open" | "close" | null>(null);

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
              setActiveSide("open");
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
              setActiveSide("close");
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
}: MagnetControlWidgetProps) {
  const [activeSide, setActiveSide] = useState<"on" | "off" | null>(null);

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
              setActiveSide("on");
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
              setActiveSide("off");
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
  const canEmbedVisualization =
    widget.source === "visualization" && /^https?:\/\//i.test(widget.streamUrl);
  const sourceLabel =
    widget.source === "rviz"
      ? "RViz"
      : widget.source === "visualization"
        ? "Visualization"
        : "Camera";

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
        <div className="controls-stream-title-row">
          <div className="controls-stream-title">
            <InlineEditableText value={widget.label} onCommit={onLabelChange} className="controls-inline-label" />
          </div>
          <span className="controls-stream-source">{sourceLabel}</span>
        </div>
        <div className={`controls-stream-view controls-stream-fit-${widget.fitMode}`}>
          {canEmbedVisualization ? (
            <iframe
              className="controls-stream-iframe"
              src={widget.streamUrl}
              title={`${widget.label} visualization`}
              loading="lazy"
            />
          ) : (
            <div className="stream-placeholder">
              {widget.overlayText?.trim() || statusText}
            </div>
          )}
        </div>
        {widget.showStatus ? <div className="controls-stream-status">{statusText}</div> : null}
        {widget.showUrl ? <div className="controls-stream-url">{widget.streamUrl || "no stream url"}</div> : null}
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
