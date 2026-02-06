declare module "nipplejs" {
  export interface JoystickManager {
    on: (event: string, cb: (evt: unknown, data: any) => void) => void;
    destroy: () => void;
  }

  export function create(options: Record<string, unknown>): JoystickManager;
}
