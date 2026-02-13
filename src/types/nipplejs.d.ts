declare module "nipplejs" {
  export type JoystickVector = {
    x: number;
    y: number;
  };

  export type JoystickOutputData = {
    vector: JoystickVector;
  };

  export type JoystickEventHandler = (event: Event, data: JoystickOutputData) => void;

  export interface JoystickManager {
    on: (event: string, cb: JoystickEventHandler) => void;
    destroy: () => void;
  }

  export type JoystickOptions = {
    zone: HTMLElement;
    mode: "static" | "dynamic" | "semi";
    position?: { left: string; top: string };
    color?: string;
    size?: number;
    restOpacity?: number;
    lockX?: boolean;
    lockY?: boolean;
  };

  export function create(options: JoystickOptions): JoystickManager;
}
