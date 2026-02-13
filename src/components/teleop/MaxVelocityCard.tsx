import { Card } from "../ui/Card";
import * as Slider from "@radix-ui/react-slider";
import { useTeleopStore } from "../../store/teleopStore";
import { useWidgetConfig } from "../../hooks/useWidgetConfig";

export function MaxVelocityCard() {
  const maxVelocity = useTeleopStore((s) => s.maxVelocity);
  const setMaxVelocity = useTeleopStore((s) => s.setMaxVelocity);
  const { titleFor } = useWidgetConfig();

  return (
    <Card>
      <h2>{titleFor("controls.maxVelocity", "Max Velocity")}</h2>
      <Slider.Root
        className="slider"
        min={0}
        max={2}
        step={0.01}
        value={[maxVelocity]}
        onValueChange={(v) => setMaxVelocity(v[0] ?? 1)}
      >
        <Slider.Track className="slider-track">
          <Slider.Range className="slider-range" />
        </Slider.Track>
        <Slider.Thumb className="slider-thumb" />
      </Slider.Root>
      <div className="slider-value">gain: {maxVelocity.toFixed(2)}</div>
      {/* TODO(backend): publish/param-set controller gain via ROS2 parameter service */}
      {/* TODO(backend): confirm controller param name for max velocity (gain vs limits) */}
    </Card>
  );
}
