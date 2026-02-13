import * as Slider from "@radix-ui/react-slider";

import { useUiStore } from "../store/uiStore";
import { useTeleopStore } from "../store/teleopStore";
import { useWidgetConfig } from "../hooks/useWidgetConfig";
import { GripperCard } from "../components/teleop/GripperCard";
import rvizPlaceholder from "../assets/explorer-rviz.png";

const jointNames = ["Joint 1", "Joint 2", "Joint 3", "Joint 4", "Joint 5", "Joint 6"];
const jointLimits = [
  { min: -3.14, max: 3.14 },
  { min: -3.14, max: 3.14 },
  { min: -3.14, max: 3.14 },
  { min: -3.14, max: 3.14 },
  { min: -3.14, max: 3.14 },
  { min: -3.14, max: 3.14 },
];

export function ArticularPage() {
  const jointPositions = useUiStore((s) => s.jointPositions);
  const setJointPositions = useUiStore((s) => s.setJointPositions);
  const rvizStreamUrl = useUiStore((s) => s.rvizStreamUrl);
  const setRvizStreamUrl = useUiStore((s) => s.setRvizStreamUrl);
  const wsState = useTeleopStore((s) => s.wsState);
  const { isVisible, titleFor } = useWidgetConfig();

  const jointTorques = wsState?.joint_torques ?? null;

  return (
    <main className="layout controls-layout tab-accent tab-articular">
      <div className="controls-main">
        {isVisible("articular.joints") && (
          <section className="card motion-card joint-card">
            <div className="joint-header">
              <h2>{titleFor("articular.joints", "Articular Control")}</h2>
              <div className="joint-actions">
                <button className="header-button" type="button">
                  Send to controller
                </button>
                <button className="header-button" type="button">
                  Sync from robot
                </button>
              </div>
            </div>
            <div className="joint-list">
              {jointNames.map((name, idx) => (
                <div key={name} className="joint-row">
                  <div className="joint-label">
                    <span>{name}</span>
                    <span className="joint-value">{jointPositions[idx].toFixed(2)} rad</span>
                  </div>
                  <div className="joint-limit">
                    <div
                      className={`joint-limit-fill ${
                        Math.abs(jointPositions[idx]) > 0.9 * jointLimits[idx].max
                          ? "red"
                          : Math.abs(jointPositions[idx]) > 0.75 * jointLimits[idx].max
                            ? "orange"
                            : "green"
                      }`}
                      style={{
                        width: `${
                          ((jointPositions[idx] - jointLimits[idx].min) /
                            (jointLimits[idx].max - jointLimits[idx].min)) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <Slider.Root
                    className="slider"
                    min={jointLimits[idx].min}
                    max={jointLimits[idx].max}
                    step={0.01}
                    value={[jointPositions[idx]]}
                    onValueChange={(v) => {
                      const next = [...jointPositions];
                      next[idx] = v[0] ?? 0;
                      setJointPositions(next);
                    }}
                  >
                    <Slider.Track className="slider-track">
                      <Slider.Range className="slider-range" />
                    </Slider.Track>
                    <Slider.Thumb className="slider-thumb" />
                  </Slider.Root>
                  <div className="joint-torque">
                    torque: {jointTorques?.[idx] != null ? `${jointTorques[idx].toFixed(2)} Nm` : "n/a"}
                  </div>
                </div>
              ))}
            </div>
            {/* TODO(backend): publish joint positions using joint_trajectory_controller */}
            {/* TODO(backend): load joint names/limits from robot_description */}
          </section>
        )}

        {isVisible("articular.gripper") && (
          <GripperCard titleId="articular.gripper" fallbackTitle="Gripper" />
        )}
      </div>

      <aside className="controls-side">
        {isVisible("articular.rviz") && (
          <section className="card rviz-card">
            <h2>{titleFor("articular.rviz", "RViz Live")}</h2>
            <div className="stream-card tight">
              <img src={rvizStreamUrl || rvizPlaceholder} alt="RViz stream" />
            </div>
            <div className="stream-config">
              <label>Stream URL</label>
              <input
                value={rvizStreamUrl}
                onChange={(e) => setRvizStreamUrl(e.target.value)}
              />
            </div>
          </section>
        )}
        {isVisible("articular.jointGraphs") && (
          <section className="card">
            <h2>{titleFor("articular.jointGraphs", "Joint Graphs")}</h2>
            <div className="mini-plot-grid">
              <div className="mini-plot">Joint 1</div>
              <div className="mini-plot">Joint 2</div>
              <div className="mini-plot">Joint 3</div>
              <div className="mini-plot">Joint 4</div>
              <div className="mini-plot">Joint 5</div>
              <div className="mini-plot">Joint 6</div>
            </div>
            {/* TODO(backend): stream joint telemetry for mini plots */}
          </section>
        )}
      </aside>
    </main>
  );
}
