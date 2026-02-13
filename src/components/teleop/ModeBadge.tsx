import { useTeleopStore, selectModeLabel } from "../../store/teleopStore";

export function ModeBadge() {
  const mode = useTeleopStore((s) => s.mode);
  return <span className="mode-badge">{selectModeLabel(mode)}</span>;
}
