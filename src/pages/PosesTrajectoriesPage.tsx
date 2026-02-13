import { WidgetCanvas } from "../components/widgets/WidgetCanvas";

export function PosesTrajectoriesPage() {
  return (
    <main className="layout widget-layout tab-accent tab-poses">
      <WidgetCanvas tabId="poses" />
    </main>
  );
}
