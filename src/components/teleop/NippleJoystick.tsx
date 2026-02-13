import { useEffect, useRef } from "react";
import type { JoystickManager } from "nipplejs";

const clamp = (v: number, min = -1, max = 1) => Math.max(min, Math.min(max, v));

export type NippleJoystickProps = {
  onMove: (x: number, y: number) => void;
  onEnd?: () => void;
  color?: string;
  size?: number;
  deadzone?: number;
  className?: string;
};

export function NippleJoystick({
  onMove,
  onEnd,
  color = "#4a9eff",
  size = 160,
  deadzone = 0.1,
  className,
}: NippleJoystickProps) {
  const zoneRef = useRef<HTMLDivElement | null>(null);
  const managerRef = useRef<JoystickManager | null>(null);
  const onMoveRef = useRef(onMove);
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onMoveRef.current = onMove;
    onEndRef.current = onEnd;
  }, [onMove, onEnd]);

  useEffect(() => {
    if (!zoneRef.current) return;

    let active = true;

    // Static positioning keeps the stick centered inside a fixed-size container.
    import("nipplejs")
      .then((module) => {
        if (!active || !zoneRef.current) return;
        type NippleModule = typeof import("nipplejs");
        const api = (module as NippleModule & { default?: NippleModule }).default ?? module;
        managerRef.current = api.create({
          zone: zoneRef.current,
          mode: "static",
          position: { left: `${size / 2}px`, top: `${size / 2}px` },
          color,
          size,
          restOpacity: 0.8,
          lockX: false,
          lockY: false,
        });

        managerRef.current.on("move", (_, data) => {
          const x = clamp(data.vector.x);
          const y = clamp(data.vector.y);
          onMoveRef.current(x, y);
        });

        managerRef.current.on("end", () => {
          if (onEndRef.current) {
            onEndRef.current();
          } else {
            onMoveRef.current(0, 0);
          }
        });
      })
      .catch(() => {
        onMoveRef.current(0, 0);
      });

    return () => {
      active = false;
      managerRef.current?.destroy();
      managerRef.current = null;
    };
  }, [color, size]);

  return (
    <div
      className={`joystick-shell ${className ?? ""}`.trim()}
      style={{
        ["--joy-size" as string]: `${size}px`,
        ["--joy-deadzone" as string]: `${deadzone}`,
      }}
    >
      <div className="joystick-deadzone" />
      <div className="joystick-zone" ref={zoneRef} />
    </div>
  );
}
