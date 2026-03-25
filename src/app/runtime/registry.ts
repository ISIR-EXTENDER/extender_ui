import { petanqueRuntimePlugin } from "./petanqueRuntime";
import { sandboxRuntimePlugin } from "./sandboxRuntime";
import type { ApplicationRuntimeMatchArgs, ApplicationRuntimePlugin } from "./types";

const RUNTIME_PLUGINS: ApplicationRuntimePlugin[] = [
  petanqueRuntimePlugin,
  sandboxRuntimePlugin,
];

export const resolveApplicationRuntimePlugins = (
  args: ApplicationRuntimeMatchArgs
): ApplicationRuntimePlugin[] => RUNTIME_PLUGINS.filter((plugin) => plugin.matches(args));
