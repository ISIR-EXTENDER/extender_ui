const hasWindow = () => typeof window !== "undefined";

export function readStorageItem(key: string): string | null {
  if (!hasWindow()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorageItem(key: string, value: string): boolean {
  if (!hasWindow()) return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function readJsonStorage<T>(
  key: string,
  fallback: T,
  parse: (value: unknown) => T
): T {
  const raw = readStorageItem(key);
  if (!raw) return fallback;

  try {
    return parse(JSON.parse(raw));
  } catch {
    return fallback;
  }
}

export function writeJsonStorage(key: string, value: unknown, space?: number): boolean {
  try {
    return writeStorageItem(key, JSON.stringify(value, null, space));
  } catch {
    return false;
  }
}
