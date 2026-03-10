import {
  ADMIN_DEMO_APP_ID,
  ADMIN_DEMO_APP_NAME,
  ADMIN_DEMO_HOME_SCREEN_ID,
  ADMIN_DEMO_SCREEN_IDS,
} from "./demoDefaults";

export type ApplicationConfig = {
  id: string;
  name: string;
  screenIds: string[];
  homeScreenId: string | null;
  updatedAt: string;
};

const STORAGE_KEY = "extender.controls.applications.v1";
const PETANQUE_SCREEN_ID = "petanque";
const PETANQUE_TELEOP_CONFIG_SCREEN_ID = "petanque_teleop_config";
const PEPR_PETANQUE_APP_ID = "application-a50f";
const PEPR_PETANQUE_APP_NAME = "PEPR-Petanque";
const PLAY_PETANQUE_APP_ID = "application-play-petanque";
const PLAY_PETANQUE_APP_NAME = "PlayPetanque";
const PLAY_PETANQUE_CAMERA_SCREEN_ID = "play_petanque_camera";
const PLAY_PETANQUE_LANCER_SCREEN_ID = "play_petanque_lancer";
const PLAY_PETANQUE_RAMASSAGE_SCREEN_ID = "play_petanque_ramassage";

type DirectoryPickerHandle = {
  values: () => AsyncIterable<FileSystemHandle>;
  getFileHandle: (
    name: string,
    options?: FileSystemGetFileOptions
  ) => Promise<FileSystemFileHandle>;
};

type DirectoryPickerWindow = Window & {
  showDirectoryPicker?: () => Promise<DirectoryPickerHandle>;
};

type FileEntryHandle = FileSystemHandle & {
  kind: "file";
  name: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const uniqStrings = (values: string[]) => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
};

const arraysEqual = (left: string[], right: string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

const ensurePetanqueTeleopConfigScreen = (application: ApplicationConfig): ApplicationConfig => {
  if (!application.screenIds.includes(PETANQUE_SCREEN_ID)) return application;
  if (application.screenIds.includes(PETANQUE_TELEOP_CONFIG_SCREEN_ID)) return application;

  const nextScreenIds: string[] = [];
  for (const screenId of application.screenIds) {
    nextScreenIds.push(screenId);
    if (screenId === PETANQUE_SCREEN_ID) {
      nextScreenIds.push(PETANQUE_TELEOP_CONFIG_SCREEN_ID);
    }
  }

  const normalizedScreenIds = uniqStrings(nextScreenIds);
  const nextHomeScreenId =
    application.homeScreenId && normalizedScreenIds.includes(application.homeScreenId)
      ? application.homeScreenId
      : normalizedScreenIds[0] ?? null;

  return {
    ...application,
    screenIds: normalizedScreenIds,
    homeScreenId: nextHomeScreenId,
  };
};

const ensurePlayPetanqueApplication = (
  applications: ApplicationConfig[]
): ApplicationConfig[] => {
  const exactPeprSource = applications.find(
    (application) =>
      application.id === PEPR_PETANQUE_APP_ID ||
      application.name === PEPR_PETANQUE_APP_NAME
  );
  const heuristicPeprSource = applications.find(
    (application) =>
      application.id !== ADMIN_DEMO_APP_ID &&
      application.id !== PLAY_PETANQUE_APP_ID &&
      application.screenIds.length <= 3 &&
      application.screenIds.includes(PETANQUE_SCREEN_ID) &&
      application.screenIds.includes(PETANQUE_TELEOP_CONFIG_SCREEN_ID)
  );
  const source =
    exactPeprSource ??
    heuristicPeprSource ??
    null;
  const targetIndex = applications.findIndex(
    (application) =>
      application.id === PLAY_PETANQUE_APP_ID ||
      application.name.trim().toLowerCase() === PLAY_PETANQUE_APP_NAME.toLowerCase()
  );
  const target = targetIndex >= 0 ? applications[targetIndex] : null;

  if (!source && !target) return applications;

  const baseScreenIds = source?.screenIds ?? target?.screenIds ?? [];
  const nextScreenIds = uniqStrings([
    ...baseScreenIds,
    PLAY_PETANQUE_CAMERA_SCREEN_ID,
    PLAY_PETANQUE_LANCER_SCREEN_ID,
    PLAY_PETANQUE_RAMASSAGE_SCREEN_ID,
  ]);
  const nextHomeScreenId =
    source?.homeScreenId && nextScreenIds.includes(source.homeScreenId)
      ? source.homeScreenId
      : target?.homeScreenId && nextScreenIds.includes(target.homeScreenId)
        ? target.homeScreenId
        : nextScreenIds[0] ?? null;

  if (target) {
    const unchanged =
      target.id === PLAY_PETANQUE_APP_ID &&
      target.name === PLAY_PETANQUE_APP_NAME &&
      target.homeScreenId === nextHomeScreenId &&
      arraysEqual(target.screenIds, nextScreenIds);
    if (unchanged) return applications;

    const nextTarget: ApplicationConfig = {
      ...target,
      id: PLAY_PETANQUE_APP_ID,
      name: PLAY_PETANQUE_APP_NAME,
      screenIds: nextScreenIds,
      homeScreenId: nextHomeScreenId,
      updatedAt: new Date().toISOString(),
    };

    return applications.map((application, index) =>
      index === targetIndex ? nextTarget : application
    );
  }

  const nextApplication: ApplicationConfig = {
    id: PLAY_PETANQUE_APP_ID,
    name: PLAY_PETANQUE_APP_NAME,
    screenIds: nextScreenIds,
    homeScreenId: nextHomeScreenId,
    updatedAt: new Date().toISOString(),
  };
  return [...applications, nextApplication].sort((a, b) => a.name.localeCompare(b.name));
};

const createDefaultAdminApplication = (): ApplicationConfig => ({
  id: ADMIN_DEMO_APP_ID,
  name: ADMIN_DEMO_APP_NAME,
  screenIds: [...ADMIN_DEMO_SCREEN_IDS],
  homeScreenId: ADMIN_DEMO_HOME_SCREEN_ID,
  updatedAt: new Date().toISOString(),
});

const sanitizeApplication = (value: unknown): ApplicationConfig | null => {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || typeof value.name !== "string") return null;

  const screenIds = Array.isArray(value.screenIds)
    ? uniqStrings(value.screenIds.filter((item): item is string => typeof item === "string"))
    : [];
  const homeScreenId =
    typeof value.homeScreenId === "string" && value.homeScreenId.trim()
      ? value.homeScreenId
      : null;

  return {
    id: value.id.trim(),
    name: value.name.trim() || value.id.trim(),
    screenIds,
    homeScreenId,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString(),
  };
};

export const createEmptyApplication = (seed?: string): ApplicationConfig => {
  const now = new Date().toISOString();
  const suffix = Math.random().toString(16).slice(2, 6);
  const id = `${(seed ?? "application").trim().replace(/\s+/g, "-").toLowerCase() || "application"}-${suffix}`;
  return {
    id,
    name: `Application ${suffix.toUpperCase()}`,
    screenIds: [],
    homeScreenId: null,
    updatedAt: now,
  };
};

export function loadApplicationsFromLocalStorage(): ApplicationConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [createDefaultAdminApplication()];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [createDefaultAdminApplication()];
    const sanitized = ensurePlayPetanqueApplication(
      parsed
        .map(sanitizeApplication)
        .filter((item): item is ApplicationConfig => item !== null)
        .map(ensurePetanqueTeleopConfigScreen)
        .sort((a, b) => a.name.localeCompare(b.name))
    );
    if (!sanitized.length) return [createDefaultAdminApplication()];
    if (sanitized.some((application) => application.id === ADMIN_DEMO_APP_ID)) {
      return sanitized;
    }
    return [...sanitized, createDefaultAdminApplication()].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  } catch {
    return [createDefaultAdminApplication()];
  }
}

export function persistApplicationsToLocalStorage(applications: ApplicationConfig[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(applications, null, 2));
}

export function upsertApplication(
  applications: ApplicationConfig[],
  nextApplication: ApplicationConfig
): ApplicationConfig[] {
  const normalized: ApplicationConfig = {
    ...nextApplication,
    id: nextApplication.id.trim(),
    name: nextApplication.name.trim() || nextApplication.id.trim(),
    screenIds: uniqStrings(nextApplication.screenIds),
    homeScreenId: nextApplication.homeScreenId?.trim() || null,
    updatedAt: new Date().toISOString(),
  };
  const normalizedWithDefaults = ensurePetanqueTeleopConfigScreen(normalized);

  const index = applications.findIndex((application) => application.id === normalizedWithDefaults.id);
  if (index === -1) {
    return [...applications, normalizedWithDefaults].sort((a, b) => a.name.localeCompare(b.name));
  }

  return applications.map((application, i) =>
    i === index ? normalizedWithDefaults : application
  );
}

export function removeApplication(applications: ApplicationConfig[], applicationId: string) {
  return applications.filter((application) => application.id !== applicationId);
}

const sanitizeFileName = (name: string) =>
  `${name.trim().replace(/[^a-zA-Z0-9-_]+/g, "_").replace(/_+/g, "_") || "application"}.json`;

const parseApplicationFile = async (
  entry: FileSystemFileHandle
): Promise<ApplicationConfig | null> => {
  try {
    const file = await entry.getFile();
    const content = await file.text();
    const parsed = JSON.parse(content);
    return sanitizeApplication(parsed);
  } catch {
    return null;
  }
};

export async function syncApplicationsToFolder(applications: ApplicationConfig[]) {
  const pickerWindow = window as DirectoryPickerWindow;
  if (!pickerWindow.showDirectoryPicker) {
    throw new Error("File System Access API not available in this browser.");
  }

  const directoryHandle = await pickerWindow.showDirectoryPicker();

  for (const application of applications) {
    const fileHandle = await directoryHandle.getFileHandle(sanitizeFileName(application.id), {
      create: true,
    });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(application, null, 2));
    await writable.close();
  }

  return applications.length;
}

export async function syncApplicationsFromFolder(
  applications: ApplicationConfig[]
): Promise<ApplicationConfig[]> {
  const pickerWindow = window as DirectoryPickerWindow;
  if (!pickerWindow.showDirectoryPicker) {
    throw new Error("File System Access API not available in this browser.");
  }

  const directoryHandle = await pickerWindow.showDirectoryPicker();
  const loaded: ApplicationConfig[] = [];

  for await (const entry of directoryHandle.values()) {
    const fileEntry = entry as FileEntryHandle;
    if (fileEntry.kind !== "file" || !fileEntry.name.endsWith(".json")) continue;
    const application = await parseApplicationFile(fileEntry as FileSystemFileHandle);
    if (application) loaded.push(application);
  }

  let merged = [...applications];
  for (const application of loaded) {
    merged = upsertApplication(merged, application);
  }

  return ensurePlayPetanqueApplication(merged);
}
