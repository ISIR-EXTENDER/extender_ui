import { create } from "zustand";

export type ThemeMode = "system" | "light" | "dark";

export type UiState = {
  focusMode: boolean;
  themeMode: ThemeMode;
  rvizStreamUrl: string;
  cameraStreamUrl: string;
  gripperSpeed: number;
  gripperForce: number;
  jointPositions: number[];
  setFocusMode: (value: boolean) => void;
  setThemeMode: (value: ThemeMode) => void;
  setRvizStreamUrl: (value: string) => void;
  setCameraStreamUrl: (value: string) => void;
  setGripperSpeed: (value: number) => void;
  setGripperForce: (value: number) => void;
  setJointPositions: (positions: number[]) => void;
};

export const useUiStore = create<UiState>((set) => ({
  focusMode: false,
  themeMode: "dark",
  rvizStreamUrl: "",
  cameraStreamUrl: "webrtc://localhost:8001/stream",
  gripperSpeed: 0.5,
  gripperForce: 0.5,
  jointPositions: [0, 0, 0, 0, 0, 0],
  setFocusMode: (value) => set({ focusMode: value }),
  setThemeMode: (value) => set({ themeMode: value }),
  setRvizStreamUrl: (value) => set({ rvizStreamUrl: value }),
  setCameraStreamUrl: (value) => set({ cameraStreamUrl: value }),
  setGripperSpeed: (value) => set({ gripperSpeed: value }),
  setGripperForce: (value) => set({ gripperForce: value }),
  setJointPositions: (positions) => set({ jointPositions: positions }),
}));
