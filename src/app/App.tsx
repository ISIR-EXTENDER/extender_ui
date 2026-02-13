import { useMemo } from "react";

import { TopBar } from "../components/layout/TopBar";
import { TabsNav } from "../components/layout/TabsNav";
import { ControlsPage } from "../pages/ControlsPage";
import { tabMap } from "./routes";
import { useUiStore } from "../store/uiStore";
import { useWsConnection } from "../hooks/useWsConnection";
import { useTeleopPublisher } from "../hooks/useTeleopPublisher";
import { useThemeMode } from "../hooks/useThemeMode";

export default function App() {
  useWsConnection();
  useThemeMode();
  const { stopAndZero } = useTeleopPublisher();

  const activeTab = useUiStore((s) => s.activeTab);
  const focusMode = useUiStore((s) => s.focusMode);

  const ActivePage = useMemo(() => tabMap[activeTab], [activeTab]);

  return (
    <div className="app">
      <TopBar onStop={stopAndZero} />
      <TabsNav hidden={focusMode} />
      {focusMode ? <ControlsPage focusOnly /> : <ActivePage />}
    </div>
  );
}
