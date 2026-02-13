import { useTeleopStore, selectModeLabel } from "../../store/teleopStore";

export function ModeSelector() {
  const mode = useTeleopStore((s) => s.mode);
  const cycleMode = useTeleopStore((s) => s.cycleMode);

  return (
    <button className="deadman compact" onClick={cycleMode}>
      {selectModeLabel(mode)}
    </button>
  );
}
