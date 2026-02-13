import { Button } from "../ui/Button";
import { useUiStore } from "../../store/uiStore";

type TopBarProps = {
  onStop: () => void;
};

export function TopBar({ onStop }: TopBarProps) {
  const focusMode = useUiStore((s) => s.focusMode);
  const setFocusMode = useUiStore((s) => s.setFocusMode);
  const isEditorMode = useUiStore((s) => s.isEditorMode);
  const setEditorMode = useUiStore((s) => s.setEditorMode);

  return (
    <header className="header">
      <h1>Extender Tablet Interface</h1>
      <div className="header-actions">
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
