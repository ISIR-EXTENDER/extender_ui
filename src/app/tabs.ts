export const tabIds = [
  "controls",
  "live_teleop",
  "articular",
  "camera",
  "visual_servoing",
  "logs",
  "poses",
  "petanque",
  "curves",
  "configurations",
  "debug",
] as const;

export type TabId = (typeof tabIds)[number];
