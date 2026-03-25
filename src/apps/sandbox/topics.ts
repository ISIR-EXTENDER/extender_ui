export const SANDBOX_CONTROL_SCREEN_ID = "sandbox_control";
export const SANDBOX_TELEOP_CONFIG_SCREEN_ID = "sandbox_teleop_config";
export const SANDBOX_SCREEN_IDS = new Set([
  SANDBOX_CONTROL_SCREEN_ID,
  SANDBOX_TELEOP_CONFIG_SCREEN_ID,
]);

export const SANDBOX_MAX_VELOCITY_TOPIC = "/cmd/max_velocity";

export const isSandboxScreenId = (screenId: string) => SANDBOX_SCREEN_IDS.has(screenId);
