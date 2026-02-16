export type TabId =
  | "controls"
  | "live_teleop"
  | "articular"
  | "camera"
  | "visual_servoing"
  | "logs"
  | "poses"
  | "petanque"
  | "curves"
  | "configurations"
  | "debug";

export type AppTab = {
  id: TabId;
  label: string;
};

export const APP_TABS: AppTab[] = [
  { id: "controls", label: "Controls" },
  { id: "live_teleop", label: "Live Teleop" },
  { id: "articular", label: "Articular" },
  { id: "camera", label: "Camera" },
  { id: "visual_servoing", label: "Visual Servoing" },
  { id: "logs", label: "Logs" },
  { id: "poses", label: "Poses" },
  { id: "petanque", label: "Petanque" },
  { id: "curves", label: "Curves" },
  { id: "configurations", label: "Configurations" },
  { id: "debug", label: "Debug" },
];
