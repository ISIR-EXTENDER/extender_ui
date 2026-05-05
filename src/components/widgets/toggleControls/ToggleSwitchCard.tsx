import { useState } from "react";

import { CanvasItem } from "../../layout/CanvasItem";
import type { CanvasRect } from "../../layout/CanvasItem";
import { InlineEditableText } from "../InlineEditableText";

type ToggleSwitchCardProps = {
  rect: CanvasRect;
  label: string;
  selected: boolean;
  onSelect: () => void;
  onRectChange: (next: CanvasRect) => void;
  onLabelChange: (nextLabel: string) => void;
  onActivate: () => void;
  onDeactivate: () => void;
  activeState?: "on" | "off" | null;
  ariaLabel?: string;
};

export function ToggleSwitchCard({
  rect,
  label,
  selected,
  onSelect,
  onRectChange,
  onLabelChange,
  onActivate,
  onDeactivate,
  activeState,
  ariaLabel,
}: ToggleSwitchCardProps) {
  const [localActiveSide, setLocalActiveSide] = useState<"on" | "off" | null>(null);
  const resolvedActiveSide = activeState ?? localActiveSide;
  const isOn = resolvedActiveSide === "on";
  const statusLabel = isOn ? "ON" : resolvedActiveSide === "off" ? "OFF" : "Unknown";

  return (
    <CanvasItem
      x={rect.x}
      y={rect.y}
      w={rect.w}
      h={rect.h}
      onChange={onRectChange}
      onSelect={onSelect}
      selected={selected}
      minSize={{ w: 180, h: 92 }}
      className="controls-magnet-item"
    >
      <div className="controls-magnet-widget">
        <div className="controls-magnet-title">
          <InlineEditableText value={label} onCommit={onLabelChange} className="controls-inline-label" />
        </div>
        <div className="controls-switch-row">
          <div className="controls-switch-meta" aria-live="polite">
            <span className="controls-switch-caption">State</span>
            <span className="controls-switch-state">{statusLabel}</span>
          </div>
          <button
            type="button"
            className={`controls-toggle-switch ${isOn ? "is-on" : "is-off"}`.trim()}
            role="switch"
            aria-checked={isOn}
            aria-label={ariaLabel ?? `${label} toggle`}
            onClick={() => {
              if (isOn) {
                setLocalActiveSide("off");
                onDeactivate();
                return;
              }

              setLocalActiveSide("on");
              onActivate();
            }}
          >
            <span className="controls-toggle-switch-thumb" />
          </button>
        </div>
      </div>
    </CanvasItem>
  );
}
