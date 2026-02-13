import { useMemo } from "react";

import { NippleJoystick } from "../components/teleop/NippleJoystick";
import { JoystickCard } from "../components/teleop/JoystickCard";
import { ZSlider, RzSlider } from "../components/teleop/AxisSliders";
import { ModeSelector } from "../components/teleop/ModeSelector";
import { GripperCard } from "../components/teleop/GripperCard";
import { SavedPosesCard } from "../components/teleop/SavedPosesCard";
import { MaxVelocityCard } from "../components/teleop/MaxVelocityCard";
import { useTeleopStore } from "../store/teleopStore";
import { useWidgetConfig } from "../hooks/useWidgetConfig";

type ControlsPageProps = {
  focusOnly?: boolean;
};

export function ControlsPage({ focusOnly = false }: ControlsPageProps) {
  const joyX = useTeleopStore((s) => s.joyX);
  const joyY = useTeleopStore((s) => s.joyY);
  const rotX = useTeleopStore((s) => s.rotX);
  const rotY = useTeleopStore((s) => s.rotY);
  const z = useTeleopStore((s) => s.z);
  const rz = useTeleopStore((s) => s.rz);
  const setJoy = useTeleopStore((s) => s.setJoy);
  const setRot = useTeleopStore((s) => s.setRot);
  const setZ = useTeleopStore((s) => s.setZ);
  const setRz = useTeleopStore((s) => s.setRz);

  const { isVisible, titleFor } = useWidgetConfig();

  const magnitude = useMemo(
    () => Math.min(1, Math.hypot(joyX, joyY)),
    [joyX, joyY]
  );

  const motionPanel = (
    <section className="card motion-card">
      <div className="joystick-header">
        <h2>{titleFor("controls.motion", "Motion Controls")}</h2>
        <div className="mode-compact">
          <span className="mode-label">Mode</span>
          <ModeSelector />
        </div>
      </div>
      <div className="joystick-grid">
        <JoystickCard title="Translation">
          <div className="joystick-with-side">
            <ZSlider value={z} onChange={setZ} />
            <div className="joystick-wrap">
              <NippleJoystick onMove={(x, y) => setJoy(x, y)} size={320} />
              <div className="axis-labels">
                <span className="axis-label axis-top">Y+</span>
                <span className="axis-label axis-right">X+</span>
                <span className="axis-label axis-bottom">Y-</span>
                <span className="axis-label axis-left">X-</span>
              </div>
            </div>
          </div>
          <div className="vector">
            <div>joyX: {joyX.toFixed(2)}</div>
            <div>joyY: {joyY.toFixed(2)}</div>
            <div>mag: {magnitude.toFixed(2)}</div>
          </div>
        </JoystickCard>

        <JoystickCard title="Rotation">
          <RzSlider value={rz} onChange={setRz} />
          <div className="joystick-wrap">
            <NippleJoystick onMove={(x, y) => setRot(x, y)} color="#f97316" size={320} />
            <div className="axis-labels">
              <span className="axis-label axis-top">RY+</span>
              <span className="axis-label axis-right">RX+</span>
              <span className="axis-label axis-bottom">RY-</span>
              <span className="axis-label axis-left">RX-</span>
            </div>
          </div>
          <div className="vector">
            <div>rotX: {rotX.toFixed(2)}</div>
            <div>rotY: {rotY.toFixed(2)}</div>
          </div>
        </JoystickCard>
      </div>
    </section>
  );

  if (focusOnly) {
    return (
      <main className="layout focus-layout tab-accent tab-controls">
        {isVisible("controls.motion") ? motionPanel : null}
      </main>
    );
  }

  return (
    <main className="layout controls-layout tab-accent tab-controls">
      <div className="controls-main">
        {isVisible("controls.motion") ? motionPanel : null}
      </div>

      <aside className="controls-side">
        {isVisible("controls.maxVelocity") && <MaxVelocityCard />}
        {isVisible("controls.gripper") && (
          <GripperCard titleId="controls.gripper" fallbackTitle="Gripper Control" />
        )}
        {isVisible("controls.savedPoses") && (
          <SavedPosesCard titleId="controls.savedPoses" fallbackTitle="Saved Poses" />
        )}
      </aside>
    </main>
  );
}
