import type { CSSProperties, ReactNode } from "react";
import { NippleJoystick } from "./NippleJoystick";
import { JoystickCard } from "./JoystickCard";

type JoystickCardNippleProps = {
  title: string;
  onMove: (x: number, y: number) => void;
  onEnd?: () => void;
  color?: string;
  size?: number;
  deadzone?: number;
  labels?: { top: string; right: string; bottom: string; left: string };
  children?: ReactNode; // For vector display or other footer info
  style?: CSSProperties;
  className?: string; // To allow external styling/positioning
};

export function JoystickCardNipple({
  title,
  onMove,
  onEnd,
  color,
  size = 320,
  deadzone = 0.1,
  labels,
  children,
  style,
  className,
}: JoystickCardNippleProps) {
  return (
    <div style={style} className={className}>
      <JoystickCard title={title}>
        <div className="joystick-wrap">
          <NippleJoystick
            onMove={onMove}
            onEnd={onEnd}
            color={color}
            size={size}
            deadzone={deadzone}
          />
          {labels && (
            <div className="axis-labels">
              <span className="axis-label axis-top">{labels.top}</span>
              <span className="axis-label axis-right">{labels.right}</span>
              <span className="axis-label axis-bottom">{labels.bottom}</span>
              <span className="axis-label axis-left">{labels.left}</span>
            </div>
          )}
        </div>
        {children}
      </JoystickCard>
    </div>
  );
}
