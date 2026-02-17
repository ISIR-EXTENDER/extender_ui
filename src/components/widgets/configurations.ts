import type { CanvasWidget } from "./widgetTypes";
import {
  DEFAULT_CANVAS_SETTINGS,
  cloneCanvasSettings,
  normalizeCanvasSettings,
  type CanvasSettings,
} from "./canvasSettings";
import { ADMIN_DEMO_SCREEN_IDS } from "../../app/demoDefaults";
import { createWidgetFromCatalogType, type WidgetCatalogType } from "./widgetCatalog";

export type PoseTopicValue =
  | { kind: "scalar"; value: number }
  | { kind: "vector2"; x: number; y: number };

export type PoseSnapshot = {
  name: string;
  savedAt: string;
  topics: Record<string, PoseTopicValue>;
};

export type WidgetConfiguration = {
  name: string;
  widgets: CanvasWidget[];
  poses: PoseSnapshot[];
  canvas: CanvasSettings;
  updatedAt: string;
};

const STORAGE_KEY = "extender.controls.widget-configurations.v1";
const DEMO_UPDATED_AT = "2026-02-17T00:00:00.000Z";
const DEMO_CANVAS_SETTINGS: CanvasSettings = {
  presetId: "tablet",
  runtimeMode: "fit",
};

type DemoWidgetPatch = {
  rect?: Partial<CanvasWidget["rect"]>;
  [key: string]: unknown;
};

const createDemoWidget = (
  id: string,
  type: WidgetCatalogType,
  x: number,
  y: number,
  patch: DemoWidgetPatch = {}
): CanvasWidget => {
  const widget = createWidgetFromCatalogType(type, x, y);
  if (!widget) {
    throw new Error(`Unsupported demo widget type: ${type}`);
  }
  return {
    ...widget,
    ...patch,
    id,
    rect: {
      ...widget.rect,
      ...(patch.rect ?? {}),
    },
  } as CanvasWidget;
};

const createDemoConfiguration = (
  name: string,
  widgets: CanvasWidget[],
  canvas: CanvasSettings = DEMO_CANVAS_SETTINGS
): WidgetConfiguration => ({
  name,
  widgets,
  poses: [],
  canvas: cloneCanvasSettings(canvas),
  updatedAt: DEMO_UPDATED_AT,
});

export const DEFAULT_DEMO_CONFIGURATIONS: WidgetConfiguration[] = [
  createDemoConfiguration("default_control", [
    createDemoWidget("ctrl-rz", "slider", 660, 10, {
      binding: "rz",
      label: "RZ",
      topic: "/cmd/joystick_rz",
      direction: "horizontal",
      showLabel: true,
      showTopicInfo: true,
      labelAlign: "left",
      rect: { w: 340, h: 78 },
    }),
    createDemoWidget("ctrl-home", "load-pose-button", 1040, 44, {
      label: "home",
      icon: "home",
      topic: "/ui/load_home",
      poseName: "home",
      rect: { w: 160, h: 64 },
    }),
    createDemoWidget("ctrl-mode", "mode-button", 860, 10, {
      label: "Mode",
      topic: "/cmd/mode",
      rect: { w: 170, h: 52 },
    }),
    createDemoWidget("ctrl-z", "slider", 20, 190, {
      binding: "z",
      label: "Z",
      topic: "/cmd/joystick_z",
      direction: "vertical",
      showLabel: true,
      showTopicInfo: true,
      labelAlign: "center",
      rect: { w: 72, h: 420 },
    }),
    createDemoWidget("ctrl-translation", "joystick", 120, 170, {
      binding: "joy",
      label: "Translation",
      topic: "/cmd/joystick_xy",
      color: "#4a9eff",
      rect: { w: 430, h: 430 },
    }),
    createDemoWidget("ctrl-rotation", "joystick", 580, 170, {
      binding: "rot",
      label: "Rotation",
      topic: "/cmd/joystick_rxry",
      color: "#f97316",
      rect: { w: 430, h: 430 },
    }),
    createDemoWidget("ctrl-gripper", "gripper-control", 1040, 170, {
      label: "Gripper Control",
      topic: "/cmd/gripper",
      rect: { w: 220, h: 270 },
    }),
    createDemoWidget("ctrl-max-velocity", "max-velocity", 580, 620, {
      label: "Max Velocity",
      topic: "/cmd/max_velocity",
      rect: { w: 360, h: 110 },
    }),
  ]),

  createDemoConfiguration("live_teleop", [
    createDemoWidget("live-title", "text", 20, 20, {
      label: "Live Teleop",
      topic: "/ui/title/live_teleop",
      text: "Live Teleoperation Monitor",
      align: "left",
      fontSize: 26,
      rect: { w: 420, h: 56 },
    }),
    createDemoWidget("live-rviz", "stream-display", 20, 90, {
      label: "RViz",
      topic: "/viz/rviz",
      source: "rviz",
      fitMode: "contain",
      showStatus: true,
      showUrl: false,
      overlayText: "rviz overlay",
      rect: { w: 610, h: 410 },
    }),
    createDemoWidget("live-camera", "stream-display", 650, 90, {
      label: "Camera",
      topic: "/camera/front",
      source: "camera",
      fitMode: "cover",
      showStatus: true,
      showUrl: false,
      overlayText: "front camera",
      rect: { w: 610, h: 410 },
    }),
    createDemoWidget("live-curves", "curves", 20, 520, {
      label: "Control Curves",
      topic: "/telemetry/control",
      sampleRateHz: 12,
      historySeconds: 10,
      showLegend: true,
      showSpeed: true,
      rect: { w: 760, h: 240 },
    }),
    createDemoWidget("live-logs", "logs", 800, 520, {
      label: "Runtime Logs",
      topic: "/logs/runtime",
      maxEntries: 120,
      levelFilter: "warn",
      autoScroll: true,
      showTimestamp: true,
      rect: { w: 460, h: 240 },
    }),
  ]),

  createDemoConfiguration("articular", [
    createDemoWidget("art-title", "text", 20, 20, {
      text: "Articular Control",
      align: "left",
      fontSize: 26,
      rect: { w: 360, h: 56 },
    }),
    createDemoWidget("art-notes", "textarea", 20, 90, {
      label: "Roadmap",
      text: "TODO backend integration:\n- joint state subscription\n- per-joint command topics\n- limits/safety checks",
      fontSize: 15,
      rect: { w: 430, h: 220 },
    }),
    createDemoWidget("art-visualization", "stream-display", 470, 90, {
      label: "Articular Visualization",
      source: "visualization",
      fitMode: "contain",
      showStatus: true,
      showUrl: false,
      overlayText: "joint visualization",
      rect: { w: 790, h: 430 },
    }),
    createDemoWidget("art-send-goal", "button", 20, 340, {
      label: "Send Joint Goal",
      topic: "/cmd/joint_goal",
      payload: "execute",
      rect: { w: 200, h: 58 },
    }),
    createDemoWidget("art-stop", "button", 240, 340, {
      label: "Stop Motion",
      topic: "/cmd/joint_stop",
      payload: "stop",
      rect: { w: 180, h: 58 },
    }),
    createDemoWidget("art-speed", "max-velocity", 20, 430, {
      label: "Joint Speed Scale",
      topic: "/cmd/joint_speed_scale",
      rect: { w: 400, h: 100 },
    }),
  ]),

  createDemoConfiguration("camera", [
    createDemoWidget("cam-title", "text", 20, 20, {
      text: "Camera & Vision",
      fontSize: 26,
      rect: { w: 340, h: 56 },
    }),
    createDemoWidget("cam-main", "stream-display", 20, 90, {
      label: "Main Camera",
      topic: "/camera/main",
      source: "camera",
      fitMode: "cover",
      showStatus: true,
      showUrl: false,
      overlayText: "main stream",
      rect: { w: 760, h: 510 },
    }),
    createDemoWidget("cam-aux", "stream-display", 800, 90, {
      label: "Visualization",
      topic: "/camera/overlay",
      source: "visualization",
      fitMode: "contain",
      showStatus: true,
      showUrl: false,
      overlayText: "vision overlay",
      rect: { w: 460, h: 300 },
    }),
    createDemoWidget("cam-settings", "textarea", 800, 410, {
      label: "Camera Settings",
      topic: "/camera/settings",
      text: "TODO backend integration:\n- exposure\n- white balance\n- camera profile",
      fontSize: 14,
      rect: { w: 460, h: 190 },
    }),
    createDemoWidget("cam-snapshot", "button", 20, 620, {
      label: "Snapshot",
      topic: "/camera/action",
      payload: "snapshot",
      rect: { w: 160, h: 56 },
    }),
    createDemoWidget("cam-record", "rosbag-control", 200, 620, {
      label: "Record Camera",
      topic: "/rosbag/camera",
      bagName: "camera_session",
      autoTimestamp: true,
      rect: { w: 320, h: 170 },
    }),
  ]),

  createDemoConfiguration("visual_servoing", [
    createDemoWidget("servo-title", "text", 20, 20, {
      text: "Visual Servoing",
      fontSize: 26,
      rect: { w: 320, h: 56 },
    }),
    createDemoWidget("servo-stream", "stream-display", 20, 90, {
      label: "Servo Camera",
      source: "camera",
      fitMode: "cover",
      showStatus: true,
      showUrl: false,
      overlayText: "target lock",
      rect: { w: 760, h: 500 },
    }),
    createDemoWidget("servo-joy", "joystick", 800, 90, {
      label: "Alignment",
      binding: "rot",
      topic: "/cmd/servo_alignment",
      color: "#22c55e",
      rect: { w: 300, h: 300 },
    }),
    createDemoWidget("servo-gain", "slider", 800, 410, {
      label: "Servo Gain",
      binding: "rz",
      topic: "/cmd/servo_gain",
      direction: "horizontal",
      showLabel: true,
      showTopicInfo: true,
      labelAlign: "left",
      rect: { w: 460, h: 84 },
    }),
    createDemoWidget("servo-start", "button", 800, 520, {
      label: "Start Servo",
      topic: "/cmd/servo_state",
      payload: "start",
      rect: { w: 220, h: 58 },
    }),
    createDemoWidget("servo-stop", "button", 1040, 520, {
      label: "Stop Servo",
      topic: "/cmd/servo_state",
      payload: "stop",
      rect: { w: 220, h: 58 },
    }),
  ]),

  createDemoConfiguration("logs", [
    createDemoWidget("logs-title", "text", 20, 20, {
      text: "Logs & Rosbags",
      fontSize: 26,
      rect: { w: 320, h: 56 },
    }),
    createDemoWidget("logs-runtime", "logs", 20, 90, {
      label: "Robot Logs",
      topic: "/logs/robot",
      maxEntries: 200,
      levelFilter: "all",
      autoScroll: true,
      showTimestamp: true,
      rect: { w: 860, h: 670 },
    }),
    createDemoWidget("logs-rec", "rosbag-control", 900, 90, {
      label: "Session Recording",
      topic: "/rosbag/control",
      bagName: "session",
      autoTimestamp: true,
      rect: { w: 360, h: 220 },
    }),
    createDemoWidget("logs-note", "textarea", 900, 330, {
      label: "Session Notes",
      topic: "/ui/session_notes",
      text: "Operator notes...",
      fontSize: 14,
      rect: { w: 360, h: 220 },
    }),
    createDemoWidget("logs-mark", "button", 900, 570, {
      label: "Insert Marker",
      topic: "/logs/marker",
      payload: "marker",
      rect: { w: 180, h: 58 },
    }),
  ]),

  createDemoConfiguration("poses", [
    createDemoWidget("poses-title", "text", 20, 20, {
      text: "Poses & Trajectories",
      fontSize: 26,
      rect: { w: 420, h: 56 },
    }),
    createDemoWidget("poses-save", "save-pose-button", 20, 90, {
      label: "Save Current Pose",
      topic: "/ui/save_pose",
      rect: { w: 220, h: 58 },
    }),
    createDemoWidget("poses-load-home", "load-pose-button", 260, 90, {
      label: "Load Home",
      poseName: "home",
      icon: "home",
      topic: "/ui/load_pose",
      rect: { w: 200, h: 58 },
    }),
    createDemoWidget("poses-run", "button", 480, 90, {
      label: "Run Trajectory",
      topic: "/cmd/trajectory",
      payload: "run",
      rect: { w: 200, h: 58 },
    }),
    createDemoWidget("poses-preview", "stream-display", 20, 170, {
      label: "Trajectory Preview",
      topic: "/viz/trajectory",
      source: "visualization",
      fitMode: "contain",
      showStatus: true,
      showUrl: false,
      overlayText: "trajectory view",
      rect: { w: 760, h: 460 },
    }),
    createDemoWidget("poses-list", "textarea", 800, 170, {
      label: "Saved Poses",
      topic: "/ui/poses",
      text: "home\ninspect\npick\nplace",
      fontSize: 14,
      rect: { w: 460, h: 300 },
    }),
    createDemoWidget("poses-nav", "navigation-bar", 800, 490, {
      label: "Quick Pages",
      orientation: "horizontal",
      items: [
        { id: "pose-nav-control", label: "Control", targetScreenId: "default_control" },
        { id: "pose-nav-live", label: "Live", targetScreenId: "live_teleop" },
        { id: "pose-nav-debug", label: "Debug", targetScreenId: "debug" },
      ],
      rect: { w: 460, h: 120 },
    }),
  ]),

  createDemoConfiguration("petanque", [
    createDemoWidget("pet-title", "text", 20, 20, {
      text: "Pétanque Operations",
      fontSize: 26,
      rect: { w: 360, h: 56 },
    }),
    createDemoWidget("pet-vision", "stream-display", 20, 90, {
      label: "Field Vision",
      source: "camera",
      topic: "/petanque/camera",
      fitMode: "cover",
      showStatus: true,
      showUrl: false,
      overlayText: "ball detection",
      rect: { w: 760, h: 500 },
    }),
    createDemoWidget("pet-state", "logs", 800, 90, {
      label: "Match Events",
      topic: "/petanque/events",
      levelFilter: "info",
      maxEntries: 120,
      autoScroll: true,
      showTimestamp: true,
      rect: { w: 460, h: 250 },
    }),
    createDemoWidget("pet-detect", "button", 800, 360, {
      label: "Detect Balls",
      topic: "/petanque/action",
      payload: "detect",
      rect: { w: 220, h: 58 },
    }),
    createDemoWidget("pet-plan", "button", 1040, 360, {
      label: "Plan Shot",
      topic: "/petanque/action",
      payload: "plan",
      rect: { w: 220, h: 58 },
    }),
    createDemoWidget("pet-execute", "button", 800, 440, {
      label: "Execute",
      topic: "/petanque/action",
      payload: "execute",
      rect: { w: 460, h: 58 },
    }),
    createDemoWidget("pet-curves", "curves", 800, 520, {
      label: "Shot Metrics",
      topic: "/petanque/metrics",
      sampleRateHz: 8,
      historySeconds: 12,
      showLegend: true,
      showSpeed: false,
      rect: { w: 460, h: 240 },
    }),
  ]),

  createDemoConfiguration("curves", [
    createDemoWidget("curves-title", "text", 20, 20, {
      text: "Curves & Metrics",
      fontSize: 26,
      rect: { w: 340, h: 56 },
    }),
    createDemoWidget("curves-main", "curves", 20, 90, {
      label: "TCP / Joystick Trends",
      topic: "/telemetry/main",
      sampleRateHz: 15,
      historySeconds: 12,
      showLegend: true,
      showSpeed: true,
      rect: { w: 830, h: 320 },
    }),
    createDemoWidget("curves-secondary", "curves", 20, 430, {
      label: "Joint Trends",
      topic: "/telemetry/joints",
      sampleRateHz: 10,
      historySeconds: 15,
      showLegend: true,
      showSpeed: false,
      rect: { w: 830, h: 330 },
    }),
    createDemoWidget("curves-logs", "logs", 870, 90, {
      label: "Curve Events",
      topic: "/telemetry/events",
      maxEntries: 160,
      levelFilter: "info",
      autoScroll: true,
      showTimestamp: true,
      rect: { w: 390, h: 670 },
    }),
  ]),

  createDemoConfiguration("configurations", [
    createDemoWidget("cfg-title", "text", 20, 20, {
      text: "Configuration",
      fontSize: 26,
      rect: { w: 260, h: 56 },
    }),
    createDemoWidget("cfg-theme", "textarea", 20, 90, {
      label: "UI Preferences",
      topic: "/ui/config/theme",
      text: "TODO backend integration:\n- user profile binding\n- role-based page access",
      fontSize: 14,
      rect: { w: 430, h: 220 },
    }),
    createDemoWidget("cfg-axis", "textarea", 20, 330, {
      label: "Axis Mapping",
      topic: "/ui/config/axis",
      text: "invert_x=false\ninvert_y=false\ninvert_z=false",
      fontSize: 14,
      rect: { w: 430, h: 220 },
    }),
    createDemoWidget("cfg-save", "button", 20, 570, {
      label: "Apply Config",
      topic: "/ui/config/apply",
      payload: "apply",
      rect: { w: 200, h: 58 },
    }),
    createDemoWidget("cfg-reset", "button", 240, 570, {
      label: "Reset Defaults",
      topic: "/ui/config/reset",
      payload: "reset",
      rect: { w: 210, h: 58 },
    }),
    createDemoWidget("cfg-nav", "navigation-bar", 470, 90, {
      label: "All Pages",
      orientation: "vertical",
      items: ADMIN_DEMO_SCREEN_IDS.map((screenId) => ({
        id: `cfg-nav-${screenId}`,
        label: screenId,
        targetScreenId: screenId,
      })),
      rect: { w: 220, h: 540 },
    }),
    createDemoWidget("cfg-open-debug", "navigation-button", 710, 90, {
      label: "Open Debug",
      topic: "/ui/navigation",
      icon: "arrow-right",
      targetScreenId: "debug",
      rect: { w: 220, h: 58 },
    }),
  ]),

  createDemoConfiguration("debug", [
    createDemoWidget("dbg-title", "text", 20, 20, {
      text: "Debug Console",
      fontSize: 26,
      rect: { w: 320, h: 56 },
    }),
    createDemoWidget("dbg-stream", "stream-display", 20, 90, {
      label: "Debug Visualization",
      topic: "/debug/rviz",
      source: "rviz",
      fitMode: "contain",
      showStatus: true,
      showUrl: true,
      overlayText: "debug stream",
      rect: { w: 620, h: 360 },
    }),
    createDemoWidget("dbg-logs", "logs", 660, 90, {
      label: "Debug Logs",
      topic: "/debug/logs",
      maxEntries: 200,
      levelFilter: "all",
      autoScroll: true,
      showTimestamp: true,
      rect: { w: 600, h: 360 },
    }),
    createDemoWidget("dbg-raw", "textarea", 20, 470, {
      label: "Raw Topics",
      topic: "/debug/raw",
      text: "TODO backend integration:\n- websocket topic inspector\n- message replay\n- export snapshots",
      fontSize: 14,
      rect: { w: 1240, h: 230 },
    }),
    createDemoWidget("dbg-ping", "button", 20, 720, {
      label: "Ping Backend",
      topic: "/debug/ping",
      payload: "ping",
      rect: { w: 200, h: 58 },
    }),
  ]),
];

const cloneConfiguration = (configuration: WidgetConfiguration): WidgetConfiguration => ({
  name: configuration.name,
  widgets: cloneWidgets(configuration.widgets),
  poses: clonePoses(configuration.poses),
  canvas: cloneCanvasSettings(configuration.canvas),
  updatedAt: configuration.updatedAt,
});

const cloneDefaultConfigurations = () => DEFAULT_DEMO_CONFIGURATIONS.map(cloneConfiguration);

const mergeMissingDemoConfigurations = (
  configurations: WidgetConfiguration[]
): WidgetConfiguration[] => {
  if (!configurations.length) return cloneDefaultConfigurations();
  const existingNames = new Set(configurations.map((configuration) => configuration.name));
  const missing = DEFAULT_DEMO_CONFIGURATIONS.filter(
    (configuration) => !existingNames.has(configuration.name)
  ).map(cloneConfiguration);
  return missing.length ? [...configurations, ...missing] : configurations;
};

export const getDefaultDemoConfigurationByName = (name: string): WidgetConfiguration | null => {
  const match = DEFAULT_DEMO_CONFIGURATIONS.find((configuration) => configuration.name === name);
  return match ? cloneConfiguration(match) : null;
};

type DirectoryPickerWindow = Window & {
  showDirectoryPicker?: () => Promise<any>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const cloneWidgets = (widgets: CanvasWidget[]): CanvasWidget[] =>
  JSON.parse(JSON.stringify(widgets)) as CanvasWidget[];
export const clonePoses = (poses: PoseSnapshot[]): PoseSnapshot[] =>
  JSON.parse(JSON.stringify(poses)) as PoseSnapshot[];

const isPoseTopicValue = (value: unknown): value is PoseTopicValue => {
  if (!isRecord(value) || typeof value.kind !== "string") return false;
  if (value.kind === "scalar") {
    return typeof value.value === "number";
  }
  if (value.kind === "vector2") {
    return typeof value.x === "number" && typeof value.y === "number";
  }
  return false;
};

const parsePose = (value: unknown): PoseSnapshot | null => {
  if (!isRecord(value) || typeof value.name !== "string" || !isRecord(value.topics)) {
    return null;
  }

  const topics: Record<string, PoseTopicValue> = {};
  for (const [topic, topicValue] of Object.entries(value.topics)) {
    if (!isPoseTopicValue(topicValue)) continue;
    topics[topic] = topicValue;
  }

  return {
    name: value.name,
    savedAt: typeof value.savedAt === "string" ? value.savedAt : new Date().toISOString(),
    topics,
  };
};

const parsePoses = (value: unknown): PoseSnapshot[] => {
  if (!Array.isArray(value)) return [];
  return value.map(parsePose).filter((pose): pose is PoseSnapshot => pose !== null);
};

export function loadConfigurationsFromLocalStorage(): WidgetConfiguration[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneDefaultConfigurations();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return cloneDefaultConfigurations();
    const sanitized = parsed
      .filter((item): item is WidgetConfiguration => {
        if (!isRecord(item)) return false;
        return typeof item.name === "string" && Array.isArray(item.widgets);
      })
      .map((item) => ({
        name: item.name,
        widgets: cloneWidgets(item.widgets),
        poses: parsePoses(item.poses),
        canvas: normalizeCanvasSettings(item.canvas),
        updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : new Date().toISOString(),
      }));
    return mergeMissingDemoConfigurations(sanitized);
  } catch {
    return cloneDefaultConfigurations();
  }
}

export function persistConfigurationsToLocalStorage(configurations: WidgetConfiguration[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configurations));
}

export function upsertConfiguration(
  configurations: WidgetConfiguration[],
  name: string,
  widgets: CanvasWidget[],
  poses?: PoseSnapshot[],
  canvas?: CanvasSettings
): WidgetConfiguration[] {
  const existing = configurations.find((config) => config.name === name);
  const nextConfig: WidgetConfiguration = {
    name,
    widgets: cloneWidgets(widgets),
    poses: clonePoses(poses ?? existing?.poses ?? []),
    canvas: cloneCanvasSettings(canvas ?? existing?.canvas ?? DEFAULT_CANVAS_SETTINGS),
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
      poses: parsePoses(parsed.poses),
      canvas: normalizeCanvasSettings(parsed.canvas),
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
    merged = upsertConfiguration(
      merged,
      configuration.name,
      configuration.widgets,
      configuration.poses,
      configuration.canvas
    );
  }

  return merged;
}
