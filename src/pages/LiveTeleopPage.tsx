import { WidgetCanvas } from "../components/widgets/WidgetCanvas";

export function LiveTeleopPage() {
  return (
    <main className="layout widget-layout tab-accent tab-live">
      <WidgetCanvas tabId="live_teleop" />
    </main>
  );
}
