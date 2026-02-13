import * as Slider from "@radix-ui/react-slider";

import { Card } from "../ui/Card";
import { useUiStore } from "../../store/uiStore";
import { useWidgetConfig } from "../../hooks/useWidgetConfig";

type GripperCardProps = {
  titleId: string;
  fallbackTitle: string;
};

export function GripperCard({ titleId, fallbackTitle }: GripperCardProps) {
  const gripperSpeed = useUiStore((s) => s.gripperSpeed);
  const gripperForce = useUiStore((s) => s.gripperForce);
  const setGripperSpeed = useUiStore((s) => s.setGripperSpeed);
  const setGripperForce = useUiStore((s) => s.setGripperForce);
  const { titleFor } = useWidgetConfig();

  return (
    <Card>
      <h2>{titleFor(titleId, fallbackTitle)}</h2>
      <div className="gripper-actions">
        <button className="action-button open">Open</button>
        <button className="action-button close">Close</button>
      </div>
      <div className="axis-row">
        <label>Speed: {gripperSpeed.toFixed(2)}</label>
        <Slider.Root
          className="slider"
          min={0}
          max={1}
          step={0.01}
          value={[gripperSpeed]}
          onValueChange={(v) => setGripperSpeed(v[0] ?? 0.5)}
        >
          <Slider.Track className="slider-track">
            <Slider.Range className="slider-range" />
          </Slider.Track>
          <Slider.Thumb className="slider-thumb" />
        </Slider.Root>
      </div>
      <div className="axis-row">
        <label>Force: {gripperForce.toFixed(2)}</label>
        <Slider.Root
          className="slider"
          min={0}
          max={1}
          step={0.01}
          value={[gripperForce]}
          onValueChange={(v) => setGripperForce(v[0] ?? 0.5)}
        >
          <Slider.Track className="slider-track">
            <Slider.Range className="slider-range" />
          </Slider.Track>
          <Slider.Thumb className="slider-thumb" />
        </Slider.Root>
      </div>
      {/* TODO(backend): wire Open/Close to gripper action/topic */}
      {/* TODO(backend): send speed/force with gripper command */}
    </Card>
  );
}
