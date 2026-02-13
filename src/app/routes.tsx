import type { ComponentType } from "react";

import type { TabId } from "./tabs";

import { ControlsPage } from "../pages/ControlsPage";
import { LiveTeleopPage } from "../pages/LiveTeleopPage";
import { ArticularPage } from "../pages/ArticularPage";
import { CameraPage } from "../pages/CameraPage";
import { VisualServoingPage } from "../pages/VisualServoingPage";
import { LogsRosbagsPage } from "../pages/LogsRosbagsPage";
import { PosesTrajectoriesPage } from "../pages/PosesTrajectoriesPage";
import { PetanquePage } from "../pages/PetanquePage";
import { CourbesPage } from "../pages/CourbesPage";
import { ConfigurationsPage } from "../pages/ConfigurationsPage";
import { DebugPage } from "../pages/DebugPage";

export const tabs = [
  {
    id: "controls",
    label: "Controls",
    accentClass: "tab-accent tab-controls",
    component: ControlsPage,
  },
  {
    id: "live_teleop",
    label: "Live Teleop",
    accentClass: "tab-accent tab-live",
    component: LiveTeleopPage,
  },
  {
    id: "articular",
    label: "Articular",
    accentClass: "tab-accent tab-articular",
    component: ArticularPage,
  },
  {
    id: "camera",
    label: "Camera",
    accentClass: "tab-accent tab-camera",
    component: CameraPage,
  },
  {
    id: "visual_servoing",
    label: "Visual Servoing",
    accentClass: "tab-accent tab-camera",
    component: VisualServoingPage,
  },
  {
    id: "logs",
    label: "Logs/Rosbags",
    accentClass: "tab-accent tab-logs",
    component: LogsRosbagsPage,
  },
  {
    id: "poses",
    label: "Poses/Trajectories",
    accentClass: "tab-accent tab-poses",
    component: PosesTrajectoriesPage,
  },
  {
    id: "petanque",
    label: "Pétanque",
    accentClass: "tab-accent tab-petanque",
    component: PetanquePage,
  },
  {
    id: "curves",
    label: "Courbes",
    accentClass: "tab-accent tab-controls",
    component: CourbesPage,
  },
  {
    id: "configurations",
    label: "Configurations",
    accentClass: "tab-accent tab-config",
    component: ConfigurationsPage,
  },
  {
    id: "debug",
    label: "Debug",
    accentClass: "tab-accent tab-controls",
    component: DebugPage,
  },
] as const satisfies ReadonlyArray<{
  id: TabId;
  label: string;
  accentClass: string;
  component: ComponentType;
}>;

export type { TabId };

export const tabMap: Record<TabId, ComponentType> = tabs.reduce((acc, tab) => {
  acc[tab.id as TabId] = tab.component;
  return acc;
}, {} as Record<TabId, ComponentType>);
