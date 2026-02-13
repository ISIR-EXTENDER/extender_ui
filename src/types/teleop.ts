export type TeleopMode = 0 | 1 | 2 | 3;

export type Vector3 = {
  x: number;
  y: number;
  z: number;
};

export type TeleopCommand = {
  type: "teleop_cmd";
  seq: number;
  mode: TeleopMode;
  linear: Vector3;
  angular: Vector3;
};
