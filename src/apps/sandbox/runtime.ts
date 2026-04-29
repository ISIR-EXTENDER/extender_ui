import type { ApplicationRuntimePlugin } from "../../app/runtime/types";
import { resolveSandboxMaxVelocityPresentation } from "./controlRuntime";
import { SANDBOX_MAX_VELOCITY_TOPIC, SANDBOX_SCREEN_IDS } from "./topics";

export const sandboxRuntimePlugin: ApplicationRuntimePlugin = {
  id: "sandbox",
  matches: ({ application, activeScreenId }) =>
    (activeScreenId != null && SANDBOX_SCREEN_IDS.has(activeScreenId)) ||
    application?.screenIds.some((screenId) => SANDBOX_SCREEN_IDS.has(screenId)) === true,
  getMaxVelocityState: ({ widget }) => {
    if (widget.topic !== SANDBOX_MAX_VELOCITY_TOPIC) return null;
    return resolveSandboxMaxVelocityPresentation(widget);
  },
};
