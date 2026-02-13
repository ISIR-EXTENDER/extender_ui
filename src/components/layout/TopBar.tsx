import { useEffect, useMemo, useState } from "react";

import { Button } from "../ui/Button";
import { useTeleopStore } from "../../store/teleopStore";
import { useUiStore } from "../../store/uiStore";

type TopBarProps = {
  onStop: () => void;
};

export function TopBar({ onStop }: TopBarProps) {
  const focusMode = useUiStore((s) => s.focusMode);
  const setFocusMode = useUiStore((s) => s.setFocusMode);
  const isEditorMode = useUiStore((s) => s.isEditorMode);
  const setEditorMode = useUiStore((s) => s.setEditorMode);
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
      <h1>Extender Tablet Interface</h1>
      <div className="header-actions">
        <div className={`connection-status connection-status-${connectionIndicator.level}`}>
          <span className="connection-led" aria-hidden />
          <span>{connectionIndicator.label}</span>
        </div>
        <Button type="button" onClick={() => setEditorMode(!isEditorMode)}>
          {isEditorMode ? "Editor On" : "Editor Off"}
        </Button>
        <Button
          className="focus"
          type="button"
          onClick={() => setFocusMode(!focusMode)}
        >
          {focusMode ? "Exit Focus" : "Focus"}
        </Button>
        <Button className="home" type="button">
          🏠 Home
        </Button>
        <Button className="stop" type="button" onClick={onStop}>
          STOP
        </Button>
      </div>
    </header>
  );
}
