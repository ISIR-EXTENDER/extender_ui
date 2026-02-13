import { WidgetCanvas } from "../components/widgets/WidgetCanvas";
import { WidgetRenderer } from "../components/widgets/WidgetRenderer";
import type { WidgetInstance } from "../types/widgets";

type ControlsPageProps = {
  focusOnly?: boolean;
};

export function ControlsPage({ focusOnly = false }: ControlsPageProps) {
  if (focusOnly) {
    const focusWidget: WidgetInstance = {
      id: "controls-focus-motion",
      tabId: "controls",
      type: "motion",
      title: "Motion Controls",
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };
    return (
      <main className="layout focus-layout tab-accent tab-controls">
        <div className="widget-focus">
          <WidgetRenderer widget={focusWidget} />
        </div>
      </main>
    );
  }

  return (
    <main className="layout widget-layout tab-accent tab-controls">
      <WidgetCanvas tabId="controls" />
    </main>
  );
}
