import { useMemo } from "react";

import { Button } from "../ui/Button";
import { useTeleopStore } from "../../store/teleopStore";
import { useUiStore } from "../../store/uiStore";

type TopBarProps = {
  onStop: () => void;
  onHome: () => void;
  onOpenCanvasDesign: () => void;
  isCanvasDesign: boolean;
  isRuntimeView?: boolean;
  pageTitle?: string;
};

export function TopBar({
  onStop,
  onHome,
  onOpenCanvasDesign,
  isCanvasDesign,
  isRuntimeView = false,
  pageTitle,
}: TopBarProps) {
  const focusMode = useUiStore((s) => s.focusMode);
  const setFocusMode = useUiStore((s) => s.setFocusMode);
  const wsStatus = useTeleopStore((s) => s.wsStatus);

  const connectionIndicator = useMemo(() => {
    if (wsStatus === "connected") {
      return { level: "ok", label: "Backend connected" };
    }
    if (wsStatus === "connecting") {
      return { level: "warn", label: "WebSocket issue" };
    }
    return { level: "error", label: "Backend off" };
  }, [wsStatus]);

  const modeIndicator = useMemo(() => {
    if (!isCanvasDesign) {
      return {
        level: "runtime" as const,
        label: "Operational Mode",
      };
    }

    if (focusMode) {
      return {
        level: "runtime" as const,
        label: "Operational Preview",
      };
    }

    return {
      level: "editor" as const,
      label: "Screen Builder",
    };
  }, [focusMode, isCanvasDesign]);
  const showRuntimeCompact = (isRuntimeView && !isCanvasDesign) || (isCanvasDesign && focusMode);

  return (
    <header className={`header ${showRuntimeCompact ? "header-runtime" : ""}`.trim()}>
      <div className="header-main">
        <div className="header-title-area">
          <h1>{pageTitle || "Extender Tablet Interface"}</h1>
          <div className="header-feedback" role="status" aria-live="polite">
            {showRuntimeCompact ? null : (
              <div className={`mode-status mode-status-${modeIndicator.level}`}>
                <span>{modeIndicator.label}</span>
              </div>
            )}
            <div className={`connection-status connection-status-${connectionIndicator.level}`}>
              <span className="connection-led" aria-hidden />
              <span>{connectionIndicator.label}</span>
            </div>
          </div>
        </div>
        <div className="header-actions">
          {isCanvasDesign ? (
            <Button
              className="focus"
              type="button"
              onClick={() => setFocusMode(!focusMode)}
            >
              {focusMode ? "Exit Preview" : "Enter Preview"}
            </Button>
          ) : null}
          {!isCanvasDesign && !showRuntimeCompact ? (
            <Button className="focus" type="button" onClick={onOpenCanvasDesign}>
              Screen Builder
            </Button>
          ) : null}
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
