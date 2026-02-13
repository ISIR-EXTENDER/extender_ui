import type { ReactNode } from "react";

import { useUiStore } from "../../store/uiStore";
import { tabs } from "../../app/routes";

type PageContainerProps = {
  children: ReactNode;
};

export function PageContainer({ children }: PageContainerProps) {
  const activeTab = useUiStore((s) => s.activeTab);
  const accentClass = tabs.find((tab) => tab.id === activeTab)?.accentClass ?? "";

  return <main className={`layout ${accentClass}`.trim()}>{children}</main>;
}
