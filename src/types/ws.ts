export type WsStatus = "disconnected" | "connecting" | "connected";

export type WsState = {
  connected: boolean;
  cmd_age_ms: number | null;
  watchdog_timeout_ms: number;
  last_seq: number;
  publishing_rate_hz: number;
  current_mode: number;
  tcp_speed_mps?: number;
  ee_pose?: {
    x: number;
    y: number;
    z: number;
  };
  watchdog_state?: string;
  joint_torques?: number[];
};

export type WsIncoming = WsState & {
  type: "state";
};
