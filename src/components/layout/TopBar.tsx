import { useMemo } from "react";

import { Button } from "../ui/Button";
import { useTeleopStore } from "../../store/teleopStore";
import { useUiStore } from "../../store/uiStore";

type TopBarProps = {
  onHome: () => void;
  onOpenCanvasDesign: () => void;
  isCanvasDesign: boolean;
  isRuntimeView?: boolean;
  pageTitle?: string;
  gripperCardsVisible?: boolean;
  onToggleGripperCards?: () => void;
  modeButtonsVisible?: boolean;
  onToggleModeButtons?: () => void;
};

export function TopBar({
  onHome,
  onOpenCanvasDesign,
  isCanvasDesign,
  isRuntimeView = false,
  pageTitle,
  gripperCardsVisible = true,
  onToggleGripperCards,
  modeButtonsVisible = true,
  onToggleModeButtons,
}: TopBarProps) {
  const focusMode = useUiStore((s) => s.focusMode);
  const setFocusMode = useUiStore((s) => s.setFocusMode);
  const wsStatus = useTeleopStore((s) => s.wsStatus);
  const showRuntimeCompact = (isRuntimeView && !isCanvasDesign) || (isCanvasDesign && focusMode);

  const connectionIndicator = useMemo(() => {
    if (wsStatus === "connected") {
      return { level: "ok", label: showRuntimeCompact ? "Connected" : "Backend connected" };
    }
    if (wsStatus === "connecting") {
      return { level: "warn", label: showRuntimeCompact ? "WS issue" : "WebSocket issue" };
    }
    return { level: "error", label: showRuntimeCompact ? "Backend off" : "Backend off" };
  }, [showRuntimeCompact, wsStatus]);

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
        {isRuntimeView && !isCanvasDesign ? (
          <div id="topbar-controls-slot" className="topbar-controls-slot" />
        ) : null}
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
          {isRuntimeView && !isCanvasDesign ? (
            <Button
              className={`gripper-toggle ${gripperCardsVisible ? "is-visible" : "is-hidden"}`.trim()}
              type="button"
              onClick={onToggleGripperCards}
            >
              {gripperCardsVisible ? "Hide Gripper" : "Show Gripper"}
            </Button>
          ) : null}
          {isRuntimeView && !isCanvasDesign ? (
            <Button
              className={`mode-toggle ${modeButtonsVisible ? "is-visible" : "is-hidden"}`.trim()}
              type="button"
              onClick={onToggleModeButtons}
            >
              {modeButtonsVisible ? "Hide Mode" : "Show Mode"}
            </Button>
          ) : null}
          <Button className="home" type="button" onClick={onHome}>
            Home
          </Button>
        </div>
      </div>
      {isRuntimeView && !isCanvasDesign ? null : (
        <div id="topbar-controls-slot" className="topbar-controls-slot" />
      )}
    </header>
  );
}
