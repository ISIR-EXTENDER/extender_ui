import { useEffect, useMemo, useState } from "react";

import { Button } from "../ui/Button";
import { useTeleopStore } from "../../store/teleopStore";
import { useUiStore } from "../../store/uiStore";

type TopBarProps = {
  onStop: () => void;
  onHome: () => void;
  onOpenCanvasDesign: () => void;
  isCanvasDesign: boolean;
  pageTitle?: string;
};

export function TopBar({
  onStop,
  onHome,
  onOpenCanvasDesign,
  isCanvasDesign,
  pageTitle,
}: TopBarProps) {
  const focusMode = useUiStore((s) => s.focusMode);
  const setFocusMode = useUiStore((s) => s.setFocusMode);
  const wsStatus = useTeleopStore((s) => s.wsStatus);
  const [everConnected, setEverConnected] = useState(false);

  useEffect(() => {
    if (wsStatus === "connected") {
      setEverConnected(true);
    }
  }, [wsStatus]);

  const connectionIndicator = useMemo(() => {
    if (wsStatus === "connected") {
      return { level: "ok", label: "Backend connected" };
    }
    if (wsStatus === "connecting" || everConnected) {
      return { level: "warn", label: "WebSocket issue" };
    }
    return { level: "error", label: "Backend off" };
  }, [everConnected, wsStatus]);

  return (
    <header className="header">
      <div className="header-main">
        <h1>{pageTitle || "Extender Tablet Interface"}</h1>
        <div className="header-actions">
          <div className={`connection-status connection-status-${connectionIndicator.level}`}>
            <span className="connection-led" aria-hidden />
            <span>{connectionIndicator.label}</span>
          </div>
          {isCanvasDesign ? (
            <Button
              className="focus"
              type="button"
              onClick={() => setFocusMode(!focusMode)}
            >
              {focusMode ? "Exit Preview" : "Preview"}
            </Button>
          ) : null}
          <Button className="focus" type="button" onClick={onOpenCanvasDesign}>
            Screen Builder
          </Button>
          <Button className="home" type="button" onClick={onHome}>
            Home
          </Button>
          <Button className="stop" type="button" onClick={onStop}>
            STOP
          </Button>
        </div>
      </div>
      <div id="topbar-controls-slot" className="topbar-controls-slot" />
    </header>
  );
}
