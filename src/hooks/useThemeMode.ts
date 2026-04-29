import { useEffect } from "react";

import { useUiStore } from "../store/uiStore";
import { readStorageItem, writeStorageItem } from "../utils/browserStorage";

export function useThemeMode() {
  const themeMode = useUiStore((s) => s.themeMode);
  const setThemeMode = useUiStore((s) => s.setThemeMode);

  useEffect(() => {
    const stored = readStorageItem("themeMode");
    if (stored === "light" || stored === "dark" || stored === "system") {
      setThemeMode(stored);
    }
  }, [setThemeMode]);

  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === "system") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", themeMode);
    }
    writeStorageItem("themeMode", themeMode);
  }, [themeMode]);
}
