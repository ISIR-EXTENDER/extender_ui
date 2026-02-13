import { WidgetCanvas } from "../components/widgets/WidgetCanvas";

export function VisualServoingPage() {
  return (
    <main className="layout widget-layout tab-accent tab-camera">
      <WidgetCanvas tabId="visual_servoing" />
    </main>
  );
}
