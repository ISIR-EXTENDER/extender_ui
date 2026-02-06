import { create } from "zustand";

export type WsStatus = "disconnected" | "connecting" | "connected";

interface TeleopState {
  joyX: number;
  joyY: number;
  z: number;
  mode: number;
  wsStatus: WsStatus;
  seq: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  invertX: boolean;
  invertY: boolean;
  invertZ: boolean;
  setJoy: (x: number, y: number) => void;
  setZ: (z: number) => void;
  setMode: (mode: number) => void;
  cycleMode: () => void;
  setWsStatus: (status: WsStatus) => void;
  setScaleX: (v: number) => void;
  setScaleY: (v: number) => void;
  setScaleZ: (v: number) => void;
  setInvertX: (v: boolean) => void;
  setInvertY: (v: boolean) => void;
  setInvertZ: (v: boolean) => void;
  nextSeq: () => number;
}

export const useTeleopStore = create<TeleopState>((set, get) => ({
  joyX: 0,
  joyY: 0,
  z: 0,
  mode: 0,
  wsStatus: "disconnected",
  seq: 0,
  scaleX: 1,
  scaleY: 1,
  scaleZ: 1,
  invertX: false,
  invertY: false,
  invertZ: false,
  setJoy: (x, y) => set({ joyX: x, joyY: y }),
  setZ: (z) => set({ z }),
  setMode: (mode) => set({ mode }),
  cycleMode: () => set((state) => ({ mode: (state.mode + 1) % 4 })),
  setWsStatus: (status) => set({ wsStatus: status }),
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
}));
