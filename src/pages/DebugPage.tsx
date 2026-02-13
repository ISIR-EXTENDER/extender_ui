import { WidgetCanvas } from "../components/widgets/WidgetCanvas";

export function DebugPage() {
  return (
    <main className="layout widget-layout tab-accent tab-controls">
      <WidgetCanvas tabId="debug" />
    </main>
  );
}
