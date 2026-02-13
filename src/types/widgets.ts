import type { TabId } from "../app/tabs";

export type WidgetType =
  | "motion"
  | "maxVelocity"
  | "gripper"
  | "savedPoses"
  | "dashboard"
  | "rviz"
  | "articularJoints"
  | "jointGraphs"
  | "cameraFeed"
  | "cameraSettings"
  | "cameraActions"
  | "posesSaved"
  | "trajectoryBuilder"
  | "trajectoryPreview"
  | "petanqueStatus"
  | "petanqueActions"
  | "petanqueVision"
  | "servoControls"
  | "servoVisuals"
  | "curvesPlots"
  | "logsRecording"
  | "logsSession"
  | "configAppearance"
  | "configAdvanced"
  | "configAxis"
  | "debugSummary"
  | "debugStreams";

export type WidgetParams = {
  min?: number;
  max?: number;
  step?: number;
  orientation?: "horizontal" | "vertical";
  deadzone?: number;
  joySize?: number;
  labelNorth?: string;
  labelEast?: string;
  labelSouth?: string;
  labelWest?: string;
};

export type WidgetStyle = {
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
};

export type WidgetInstance = {
  id: string;
  tabId: TabId;
  type: WidgetType;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  params?: WidgetParams;
  style?: WidgetStyle;
};
