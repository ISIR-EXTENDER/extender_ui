import { create } from "zustand";

import type { TabId } from "../app/tabs";
import type { WidgetInstance, WidgetType } from "../types/widgets";
import { defaultWidgetsByTab, widgetCatalog, widgetTypesByTab } from "../app/widgetCatalog";
import { readJsonStorage, writeJsonStorage } from "../utils/browserStorage";

const STORAGE_KEY = "extender_ui.widgets.v1";

const cloneDefaults = (): Record<TabId, WidgetInstance[]> =>
  JSON.parse(JSON.stringify(defaultWidgetsByTab)) as Record<TabId, WidgetInstance[]>;

const loadFromStorage = (): Record<TabId, WidgetInstance[]> => {
  return readJsonStorage(STORAGE_KEY, cloneDefaults(), (parsed) => {
    const typed = parsed as Record<TabId, WidgetInstance[]>;
    return typed ?? cloneDefaults();
  });
};

const saveToStorage = (widgetsByTab: Record<TabId, WidgetInstance[]>) => {
  writeJsonStorage(STORAGE_KEY, widgetsByTab);
};

export type WidgetsState = {
  widgetsByTab: Record<TabId, WidgetInstance[]>;
  selectedWidgetId: string | null;
  addWidget: (tabId: TabId, type: WidgetType) => void;
  updateWidget: (tabId: TabId, id: string, updates: Partial<WidgetInstance>) => void;
  deleteWidget: (tabId: TabId, id: string) => void;
  selectWidget: (id: string | null) => void;
  resetTab: (tabId: TabId) => void;
};

export const useWidgetsStore = create<WidgetsState>((set, get) => ({
  widgetsByTab: typeof window === "undefined" ? cloneDefaults() : loadFromStorage(),
  selectedWidgetId: null,
  addWidget: (tabId, type) => {
    const catalogItem = widgetCatalog.find((item) => item.type === type);
    if (!catalogItem) return;
    if (!widgetTypesByTab[tabId].includes(type)) return;

    const now = Date.now();
    const id = `${tabId}-${type}-${now}`;
    set((state) => {
      const nextWidget: WidgetInstance = {
        id,
        tabId,
        type,
        title: catalogItem.title,
        x: 32,
        y: 32,
        width: catalogItem.defaultSize.width,
        height: catalogItem.defaultSize.height,
        params: catalogItem.defaultParams,
      };
      const next = {
        ...state.widgetsByTab,
        [tabId]: [...state.widgetsByTab[tabId], nextWidget],
      };
      saveToStorage(next);
      return { widgetsByTab: next, selectedWidgetId: id };
    });
  },
  updateWidget: (tabId, id, updates) => {
    set((state) => {
      const next = {
        ...state.widgetsByTab,
        [tabId]: state.widgetsByTab[tabId].map((w) => (w.id === id ? { ...w, ...updates } : w)),
      };
      saveToStorage(next);
      return { widgetsByTab: next };
    });
  },
  deleteWidget: (tabId, id) => {
    set((state) => {
      const nextWidgets = state.widgetsByTab[tabId].filter((w) => w.id !== id);
      const next = { ...state.widgetsByTab, [tabId]: nextWidgets };
      saveToStorage(next);
      return {
        widgetsByTab: next,
        selectedWidgetId: state.selectedWidgetId === id ? null : state.selectedWidgetId,
      };
    });
  },
  selectWidget: (id) => set({ selectedWidgetId: id }),
  resetTab: (tabId) => {
    const next = { ...get().widgetsByTab, [tabId]: cloneDefaults()[tabId] };
    saveToStorage(next);
    set({ widgetsByTab: next, selectedWidgetId: null });
  },
}));
