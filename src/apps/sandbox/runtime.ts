import type { ApplicationRuntimePlugin } from "../../app/runtime/types";

const SANDBOX_SCREEN_IDS = new Set(["sandbox_control", "sandbox_teleop_config"]);

export const sandboxRuntimePlugin: ApplicationRuntimePlugin = {
  id: "sandbox",
  matches: ({ application, activeScreenId }) =>
    (activeScreenId != null && SANDBOX_SCREEN_IDS.has(activeScreenId)) ||
    application?.screenIds.some((screenId) => SANDBOX_SCREEN_IDS.has(screenId)) === true,
};
