import type { TabId } from "./tabs";
import type { WidgetInstance, WidgetType } from "../types/widgets";

export type WidgetCatalogItem = {
  type: WidgetType;
  title: string;
  defaultSize: { width: number; height: number };
  defaultParams?: WidgetInstance["params"];
};

export const widgetCatalog: WidgetCatalogItem[] = [
  { type: "motion", title: "Motion Controls", defaultSize: { width: 980, height: 620 } },
  { type: "maxVelocity", title: "Max Velocity", defaultSize: { width: 320, height: 190 } },
  { type: "gripper", title: "Gripper Control", defaultSize: { width: 320, height: 280 } },
  { type: "savedPoses", title: "Saved Poses", defaultSize: { width: 320, height: 240 } },
  { type: "dashboard", title: "Live Teleoperation Dashboard", defaultSize: { width: 860, height: 240 } },
  { type: "rviz", title: "RViz Live", defaultSize: { width: 460, height: 520 } },
  { type: "articularJoints", title: "Articular Control", defaultSize: { width: 980, height: 520 } },
  { type: "jointGraphs", title: "Joint Graphs", defaultSize: { width: 420, height: 260 } },
  { type: "cameraFeed", title: "Camera", defaultSize: { width: 760, height: 520 } },
  { type: "cameraSettings", title: "Camera Settings", defaultSize: { width: 320, height: 520 } },
  { type: "cameraActions", title: "Actions", defaultSize: { width: 1080, height: 120 } },
  { type: "posesSaved", title: "Saved Poses", defaultSize: { width: 320, height: 360 } },
  { type: "trajectoryBuilder", title: "Trajectory Builder", defaultSize: { width: 420, height: 360 } },
  { type: "trajectoryPreview", title: "Trajectory Preview", defaultSize: { width: 480, height: 360 } },
  { type: "petanqueStatus", title: "Pétanque Mode", defaultSize: { width: 980, height: 200 } },
  { type: "petanqueActions", title: "Robot Actions", defaultSize: { width: 360, height: 260 } },
  { type: "petanqueVision", title: "Vision & Trajectory", defaultSize: { width: 520, height: 260 } },
  { type: "servoControls", title: "Visual Servoing", defaultSize: { width: 380, height: 320 } },
  { type: "servoVisuals", title: "Live View", defaultSize: { width: 520, height: 320 } },
  { type: "curvesPlots", title: "Courbes", defaultSize: { width: 1080, height: 520 } },
  { type: "logsRecording", title: "Recording", defaultSize: { width: 360, height: 260 } },
  { type: "logsSession", title: "Active Session", defaultSize: { width: 360, height: 260 } },
  { type: "configAppearance", title: "Appearance", defaultSize: { width: 320, height: 180 } },
  { type: "configAdvanced", title: "Advanced Configuration", defaultSize: { width: 520, height: 360 } },
  { type: "configAxis", title: "Axis Inversion", defaultSize: { width: 520, height: 360 } },
  { type: "debugSummary", title: "Debug", defaultSize: { width: 420, height: 360 } },
  { type: "debugStreams", title: "Low-level Streams", defaultSize: { width: 720, height: 420 } },
];

export const widgetTypesByTab: Record<TabId, WidgetType[]> = {
  controls: ["motion", "maxVelocity", "gripper", "savedPoses"],
  live_teleop: ["dashboard", "rviz"],
  articular: ["articularJoints", "gripper", "savedPoses", "rviz", "jointGraphs"],
  camera: ["cameraFeed", "cameraSettings", "cameraActions"],
  visual_servoing: ["servoControls", "servoVisuals"],
  logs: ["logsRecording", "logsSession"],
  poses: ["posesSaved", "trajectoryBuilder", "trajectoryPreview"],
  petanque: ["petanqueStatus", "petanqueActions", "petanqueVision"],
  curves: ["curvesPlots"],
  configurations: ["configAppearance", "configAdvanced", "configAxis"],
  debug: ["debugSummary", "debugStreams"],
};

export const defaultWidgetsByTab: Record<TabId, WidgetInstance[]> = {
  controls: [
    { id: "controls-motion", tabId: "controls", type: "motion", title: "Motion Controls", x: 24, y: 24, width: 980, height: 620 },
    { id: "controls-maxVelocity", tabId: "controls", type: "maxVelocity", title: "Max Velocity", x: 1030, y: 24, width: 320, height: 190 },
    { id: "controls-gripper", tabId: "controls", type: "gripper", title: "Gripper Control", x: 1030, y: 230, width: 320, height: 280 },
    { id: "controls-savedPoses", tabId: "controls", type: "savedPoses", title: "Saved Poses", x: 1030, y: 530, width: 320, height: 240 },
  ],
  live_teleop: [
    { id: "live-dashboard", tabId: "live_teleop", type: "dashboard", title: "Live Teleoperation Dashboard", x: 24, y: 24, width: 860, height: 240 },
    { id: "live-rviz", tabId: "live_teleop", type: "rviz", title: "RViz Live", x: 900, y: 24, width: 460, height: 520 },
  ],
  articular: [
    { id: "articular-joints", tabId: "articular", type: "articularJoints", title: "Articular Control", x: 24, y: 24, width: 980, height: 520 },
    { id: "articular-gripper", tabId: "articular", type: "gripper", title: "Gripper", x: 24, y: 560, width: 320, height: 280 },
    { id: "articular-saved", tabId: "articular", type: "savedPoses", title: "Saved Poses", x: 360, y: 560, width: 320, height: 280 },
    { id: "articular-rviz", tabId: "articular", type: "rviz", title: "RViz Live", x: 1040, y: 24, width: 420, height: 420 },
    { id: "articular-graphs", tabId: "articular", type: "jointGraphs", title: "Joint Graphs", x: 1040, y: 460, width: 420, height: 280 },
  ],
  camera: [
    { id: "camera-feed", tabId: "camera", type: "cameraFeed", title: "Camera", x: 24, y: 24, width: 760, height: 520 },
    { id: "camera-settings", tabId: "camera", type: "cameraSettings", title: "Camera Settings", x: 800, y: 24, width: 320, height: 520 },
    { id: "camera-actions", tabId: "camera", type: "cameraActions", title: "Actions", x: 24, y: 560, width: 1096, height: 120 },
  ],
  visual_servoing: [
    { id: "servo-controls", tabId: "visual_servoing", type: "servoControls", title: "Visual Servoing", x: 24, y: 24, width: 380, height: 320 },
    { id: "servo-visuals", tabId: "visual_servoing", type: "servoVisuals", title: "Live View", x: 420, y: 24, width: 520, height: 320 },
  ],
  logs: [
    { id: "logs-recording", tabId: "logs", type: "logsRecording", title: "Recording", x: 24, y: 24, width: 360, height: 260 },
    { id: "logs-session", tabId: "logs", type: "logsSession", title: "Active Session", x: 400, y: 24, width: 360, height: 260 },
  ],
  poses: [
    { id: "poses-saved", tabId: "poses", type: "posesSaved", title: "Saved Poses", x: 24, y: 24, width: 320, height: 360 },
    { id: "poses-builder", tabId: "poses", type: "trajectoryBuilder", title: "Trajectory Builder", x: 360, y: 24, width: 420, height: 360 },
    { id: "poses-preview", tabId: "poses", type: "trajectoryPreview", title: "Trajectory Preview", x: 800, y: 24, width: 480, height: 360 },
  ],
  petanque: [
    { id: "petanque-status", tabId: "petanque", type: "petanqueStatus", title: "Pétanque Mode", x: 24, y: 24, width: 980, height: 200 },
    { id: "petanque-actions", tabId: "petanque", type: "petanqueActions", title: "Robot Actions", x: 24, y: 240, width: 360, height: 260 },
    { id: "petanque-vision", tabId: "petanque", type: "petanqueVision", title: "Vision & Trajectory", x: 400, y: 240, width: 520, height: 260 },
  ],
  curves: [
    { id: "curves-plots", tabId: "curves", type: "curvesPlots", title: "Courbes", x: 24, y: 24, width: 1080, height: 520 },
  ],
  configurations: [
    { id: "config-appearance", tabId: "configurations", type: "configAppearance", title: "Appearance", x: 24, y: 24, width: 320, height: 180 },
    { id: "config-advanced", tabId: "configurations", type: "configAdvanced", title: "Advanced Configuration", x: 360, y: 24, width: 520, height: 360 },
    { id: "config-axis", tabId: "configurations", type: "configAxis", title: "Axis Inversion", x: 900, y: 24, width: 520, height: 360 },
  ],
  debug: [
    { id: "debug-summary", tabId: "debug", type: "debugSummary", title: "Debug", x: 24, y: 24, width: 420, height: 360 },
    { id: "debug-streams", tabId: "debug", type: "debugStreams", title: "Low-level Streams", x: 460, y: 24, width: 720, height: 420 },
  ],
};
