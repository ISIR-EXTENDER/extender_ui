import type { CanvasWidget } from "./widgetTypes";

export type WidgetConfiguration = {
  name: string;
  widgets: CanvasWidget[];
  updatedAt: string;
};

const STORAGE_KEY = "extender.controls.widget-configurations.v1";

type DirectoryPickerWindow = Window & {
  showDirectoryPicker?: () => Promise<any>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const cloneWidgets = (widgets: CanvasWidget[]): CanvasWidget[] =>
  JSON.parse(JSON.stringify(widgets)) as CanvasWidget[];

export function loadConfigurationsFromLocalStorage(): WidgetConfiguration[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is WidgetConfiguration => {
        if (!isRecord(item)) return false;
        return typeof item.name === "string" && Array.isArray(item.widgets);
      })
      .map((item) => ({
        name: item.name,
        widgets: cloneWidgets(item.widgets),
        updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : new Date().toISOString(),
      }));
  } catch {
    return [];
  }
}

export function persistConfigurationsToLocalStorage(configurations: WidgetConfiguration[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configurations));
}

export function upsertConfiguration(
  configurations: WidgetConfiguration[],
  name: string,
  widgets: CanvasWidget[]
): WidgetConfiguration[] {
  const nextConfig: WidgetConfiguration = {
    name,
    widgets: cloneWidgets(widgets),
    updatedAt: new Date().toISOString(),
  };

  const existingIndex = configurations.findIndex((config) => config.name === name);
  if (existingIndex === -1) {
    return [...configurations, nextConfig].sort((a, b) => a.name.localeCompare(b.name));
  }

  return configurations.map((config, index) => (index === existingIndex ? nextConfig : config));
}

export function removeConfiguration(configurations: WidgetConfiguration[], name: string): WidgetConfiguration[] {
  return configurations.filter((config) => config.name !== name);
}

const sanitizeFileName = (name: string) =>
  `${name.trim().replace(/[^a-zA-Z0-9-_]+/g, "_").replace(/_+/g, "_") || "configuration"}.json`;

const parseConfigurationFile = async (entry: any): Promise<WidgetConfiguration | null> => {
  try {
    const file = await entry.getFile();
    const content = await file.text();
    const parsed = JSON.parse(content);
    if (!isRecord(parsed) || typeof parsed.name !== "string" || !Array.isArray(parsed.widgets)) {
      return null;
    }

    return {
      name: parsed.name,
      widgets: cloneWidgets(parsed.widgets as CanvasWidget[]),
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
};

export async function syncConfigurationsToFolder(configurations: WidgetConfiguration[]) {
  const pickerWindow = window as DirectoryPickerWindow;
  if (!pickerWindow.showDirectoryPicker) {
    throw new Error("File System Access API not available in this browser.");
  }

  const directoryHandle = await pickerWindow.showDirectoryPicker();

  for (const configuration of configurations) {
    const fileHandle = await directoryHandle.getFileHandle(sanitizeFileName(configuration.name), {
      create: true,
    });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(configuration, null, 2));
    await writable.close();
  }

  return configurations.length;
}

export async function syncConfigurationsFromFolder(
  configurations: WidgetConfiguration[]
): Promise<WidgetConfiguration[]> {
  const pickerWindow = window as DirectoryPickerWindow;
  if (!pickerWindow.showDirectoryPicker) {
    throw new Error("File System Access API not available in this browser.");
  }

  const directoryHandle = await pickerWindow.showDirectoryPicker();
  const loaded: WidgetConfiguration[] = [];

  for await (const entry of directoryHandle.values()) {
    if (entry.kind !== "file" || !entry.name.endsWith(".json")) continue;
    const configuration = await parseConfigurationFile(entry);
    if (configuration) loaded.push(configuration);
  }

  let merged = [...configurations];
  for (const configuration of loaded) {
    merged = upsertConfiguration(merged, configuration.name, configuration.widgets);
  }

  return merged;
}
