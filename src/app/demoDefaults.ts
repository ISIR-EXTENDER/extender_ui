export const ADMIN_DEMO_APP_ID = "app-petanque-admin";
export const ADMIN_DEMO_APP_NAME = "App Pétanque";

export const ADMIN_DEMO_SCREEN_IDS = [
  "default_control",
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

export type AdminDemoScreenId = (typeof ADMIN_DEMO_SCREEN_IDS)[number];

export const ADMIN_DEMO_HOME_SCREEN_ID: AdminDemoScreenId = "default_control";
