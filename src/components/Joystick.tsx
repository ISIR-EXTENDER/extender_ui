import { useEffect, useRef } from "react";
import type { JoystickManager } from "nipplejs";

import { useTeleopStore } from "../store";

const clamp = (v: number, min = -1, max = 1) => Math.max(min, Math.min(max, v));

export function Joystick() {
  const zoneRef = useRef<HTMLDivElement | null>(null);
  const managerRef = useRef<JoystickManager | null>(null);
  const setJoy = useTeleopStore((s) => s.setJoy);

  useEffect(() => {
    if (!zoneRef.current) return;

    let active = true;

    import("nipplejs")
      .then((module) => {
        if (!active || !zoneRef.current) return;
        const api = (module as any).default ?? module;

        if (typeof api.create !== "function") {
          return;
        }

        managerRef.current = api.create({
          zone: zoneRef.current,
          mode: "static",
          position: { left: "50%", top: "50%" },
          color: "#4f46e5",
          size: 160,
          restOpacity: 0.8,
          lockX: false,
          lockY: false,
        });

        managerRef.current.on("move", (_, data) => {
          const x = clamp(data.vector.x);
          const y = clamp(data.vector.y);
          setJoy(x, y);
        });

        managerRef.current.on("end", () => {
          setJoy(0, 0);
        });
      })
      .catch(() => {
        setJoy(0, 0);
      });

    return () => {
      active = false;
      managerRef.current?.destroy();
      managerRef.current = null;
    };
  }, [setJoy]);

  return <div className="joystick-zone" ref={zoneRef} />;
}
