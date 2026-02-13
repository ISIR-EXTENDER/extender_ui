import { create } from "zustand";

import type { TabId } from "../app/tabs";
import type { WidgetId } from "../app/widgets";
import { widgetDefaults } from "../app/widgets";

export type ThemeMode = "system" | "light" | "dark";

export type UiState = {
  activeTab: TabId;
  focusMode: boolean;
  themeMode: ThemeMode;
  widgetVisibility: Record<WidgetId, boolean>;
  widgetTitles: Record<WidgetId, string>;
  rvizStreamUrl: string;
  cameraStreamUrl: string;
  gripperSpeed: number;
  gripperForce: number;
  jointPositions: number[];
  setActiveTab: (tab: TabId) => void;
  setFocusMode: (value: boolean) => void;
  setThemeMode: (value: ThemeMode) => void;
  setWidgetVisibility: (id: WidgetId, value: boolean) => void;
  setWidgetTitle: (id: WidgetId, value: string) => void;
  setRvizStreamUrl: (value: string) => void;
  setCameraStreamUrl: (value: string) => void;
  setGripperSpeed: (value: number) => void;
  setGripperForce: (value: number) => void;
  setJointPositions: (positions: number[]) => void;
};

export const useUiStore = create<UiState>((set) => ({
  activeTab: "controls",
  focusMode: false,
  themeMode: "dark",
  widgetVisibility: { ...widgetDefaults.visibility },
  widgetTitles: { ...widgetDefaults.titles },
  rvizStreamUrl: "",
  cameraStreamUrl: "webrtc://localhost:8001/stream",
  gripperSpeed: 0.5,
  gripperForce: 0.5,
  jointPositions: [0, 0, 0, 0, 0, 0],
  setActiveTab: (tab) => set({ activeTab: tab }),
  setFocusMode: (value) => set({ focusMode: value }),
  setThemeMode: (value) => set({ themeMode: value }),
  setWidgetVisibility: (id, value) =>
    set((state) => ({ widgetVisibility: { ...state.widgetVisibility, [id]: value } })),
  setWidgetTitle: (id, value) =>
    set((state) => ({ widgetTitles: { ...state.widgetTitles, [id]: value } })),
  setRvizStreamUrl: (value) => set({ rvizStreamUrl: value }),
  setCameraStreamUrl: (value) => set({ cameraStreamUrl: value }),
  setGripperSpeed: (value) => set({ gripperSpeed: value }),
  setGripperForce: (value) => set({ gripperForce: value }),
  setJointPositions: (positions) => set({ jointPositions: positions }),
}));
