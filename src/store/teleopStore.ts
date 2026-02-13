import { create } from "zustand";

import type { TeleopCommand, TeleopMode } from "../types/teleop";
import type { WsState, WsStatus } from "../types/ws";

export type TeleopState = {
  joyX: number;
  joyY: number;
  rotX: number;
  rotY: number;
  z: number;
  rz: number;
  mode: TeleopMode;
  wsStatus: WsStatus;
  wsState: WsState | null;
  seq: number;
  maxVelocity: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  invertX: boolean;
  invertY: boolean;
  invertZ: boolean;
  setJoy: (x: number, y: number) => void;
  setRot: (x: number, y: number) => void;
  setZ: (z: number) => void;
  setRz: (z: number) => void;
  setMode: (mode: TeleopMode) => void;
  cycleMode: () => void;
  setWsStatus: (status: WsStatus) => void;
  setWsState: (state: WsState | null) => void;
  setMaxVelocity: (value: number) => void;
  setScaleX: (v: number) => void;
  setScaleY: (v: number) => void;
  setScaleZ: (v: number) => void;
  setInvertX: (v: boolean) => void;
  setInvertY: (v: boolean) => void;
  setInvertZ: (v: boolean) => void;
  nextSeq: () => number;
  buildTeleopCommand: (seq: number) => TeleopCommand;
};

const modeLabelMap: Record<TeleopMode, string> = {
  0: "TRANSLATION_ROTATION",
  1: "ROTATION",
  2: "TRANSLATION",
  3: "BOTH",
};

export const useTeleopStore = create<TeleopState>((set, get) => ({
  joyX: 0,
  joyY: 0,
  rotX: 0,
  rotY: 0,
  z: 0,
  rz: 0,
  mode: 0,
  wsStatus: "disconnected",
  wsState: null,
  seq: 0,
  maxVelocity: 1,
  scaleX: 1,
  scaleY: 1,
  scaleZ: 1,
  invertX: false,
  invertY: false,
  invertZ: false,
  setJoy: (x, y) => set({ joyX: x, joyY: y }),
  setRot: (x, y) => set({ rotX: x, rotY: y }),
  setZ: (value) => set({ z: value }),
  setRz: (value) => set({ rz: value }),
  setMode: (mode) => set({ mode }),
  cycleMode: () => set((state) => ({ mode: ((state.mode + 1) % 4) as TeleopMode })),
  setWsStatus: (status) => set({ wsStatus: status }),
  setWsState: (state) => set({ wsState: state }),
  setMaxVelocity: (value) => set({ maxVelocity: value }),
  setScaleX: (v) => set({ scaleX: v }),
  setScaleY: (v) => set({ scaleY: v }),
  setScaleZ: (v) => set({ scaleZ: v }),
  setInvertX: (v) => set({ invertX: v }),
  setInvertY: (v) => set({ invertY: v }),
  setInvertZ: (v) => set({ invertZ: v }),
  nextSeq: () => {
    const next = get().seq + 1;
    set({ seq: next });
    return next;
  },
  buildTeleopCommand: (seq) => {
    const {
      joyX,
      joyY,
      rotX,
      rotY,
      z,
      rz,
      mode,
      scaleX,
      scaleY,
      scaleZ,
      invertX,
      invertY,
      invertZ,
    } = get();

    const rotationActive = mode === 0 || mode === 1 || mode === 3;
    const translationActive = mode === 0 || mode === 2 || mode === 3;

    const linearX = translationActive ? (invertX ? -1 : 1) * joyX * scaleX : 0;
    const linearY = translationActive ? (invertY ? -1 : 1) * joyY * scaleY : 0;
    const linearZ = translationActive ? (invertZ ? -1 : 1) * z * scaleZ : 0;

    const angularX = rotationActive ? (invertX ? -1 : 1) * rotX * scaleX : 0;
    const angularY = rotationActive ? (invertY ? -1 : 1) * rotY * scaleY : 0;
    const angularZ = rotationActive ? (invertZ ? -1 : 1) * rz * scaleZ : 0;

    return {
      type: "teleop_cmd",
      seq,
      mode,
      linear: {
        x: linearX,
        y: linearY,
        z: linearZ,
      },
      angular: {
        x: angularX,
        y: angularY,
        z: angularZ,
      },
    };
  },
}));

export const selectModeLabel = (mode: TeleopMode) => modeLabelMap[mode] ?? "UNKNOWN";

export const selectWatchdogStatus = (state: WsState | null) => {
  if (!state) return "n/a";
  if (state.watchdog_state) return state.watchdog_state;
  if (state.cmd_age_ms == null || state.watchdog_timeout_ms == null) return "n/a";
  return state.cmd_age_ms > state.watchdog_timeout_ms ? "timeout" : "ok";
};
