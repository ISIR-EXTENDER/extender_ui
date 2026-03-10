import { useEffect, useRef, useState } from "react";
import * as Slider from "@radix-ui/react-slider";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import type { WidgetInstance } from "../../types/widgets";
import { useTeleopStore, selectModeLabel, selectWatchdogStatus } from "../../store/teleopStore";
import { useUiStore } from "../../store/uiStore";
import rvizPlaceholder from "../../assets/explorer-rviz.png";
import { NippleJoystick } from "../teleop/NippleJoystick";
import { ZSlider, RzSlider } from "../teleop/AxisSliders";

export function WidgetRenderer({ widget }: { widget: WidgetInstance }) {
  switch (widget.type) {
    case "motion":
      return <MotionWidget title={widget.title} />;
    case "maxVelocity":
      return <MaxVelocityWidget title={widget.title} />;
    case "gripper":
      return <GripperWidget title={widget.title} />;
    case "savedPoses":
      return <SavedPosesWidget title={widget.title} />;
    case "dashboard":
      return <LiveDashboardWidget title={widget.title} />;
    case "rviz":
      return <RvizWidget title={widget.title} />;
    case "articularJoints":
      return <ArticularWidget title={widget.title} />;
    case "jointGraphs":
      return <JointGraphsWidget title={widget.title} />;
    case "cameraFeed":
      return <CameraFeedWidget title={widget.title} />;
    case "cameraSettings":
      return <CameraSettingsWidget title={widget.title} />;
    case "cameraActions":
      return <CameraActionsWidget title={widget.title} />;
    case "posesSaved":
      return <PosesSavedWidget title={widget.title} />;
    case "trajectoryBuilder":
      return <TrajectoryBuilderWidget title={widget.title} />;
    case "trajectoryPreview":
      return <TrajectoryPreviewWidget title={widget.title} />;
    case "petanqueStatus":
      return <PetanqueStatusWidget title={widget.title} />;
    case "petanqueActions":
      return <PetanqueActionsWidget title={widget.title} />;
    case "petanqueVision":
      return <PetanqueVisionWidget title={widget.title} />;
    case "servoControls":
      return <ServoControlsWidget title={widget.title} />;
    case "servoVisuals":
      return <ServoVisualsWidget title={widget.title} />;
    case "curvesPlots":
      return <CurvesWidget title={widget.title} />;
    case "logsRecording":
      return <LogsRecordingWidget title={widget.title} />;
    case "logsSession":
      return <LogsSessionWidget title={widget.title} />;
    case "configAppearance":
      return <ConfigAppearanceWidget title={widget.title} />;
    case "configAdvanced":
      return <ConfigAdvancedWidget title={widget.title} />;
    case "configAxis":
      return <ConfigAxisWidget title={widget.title} />;
    case "debugSummary":
      return <DebugSummaryWidget title={widget.title} />;
    case "debugStreams":
      return <DebugStreamsWidget title={widget.title} />;
    default:
      return null;
  }
}

function MotionWidget({ title }: { title: string }) {
  const joyX = useTeleopStore((s) => s.joyX);
  const joyY = useTeleopStore((s) => s.joyY);
  const rotX = useTeleopStore((s) => s.rotX);
  const rotY = useTeleopStore((s) => s.rotY);
  const z = useTeleopStore((s) => s.z);
  const rz = useTeleopStore((s) => s.rz);
  const mode = useTeleopStore((s) => s.mode);
  const setJoy = useTeleopStore((s) => s.setJoy);
  const setRot = useTeleopStore((s) => s.setRot);
  const setZ = useTeleopStore((s) => s.setZ);
  const setRz = useTeleopStore((s) => s.setRz);
  const cycleMode = useTeleopStore((s) => s.cycleMode);

  return (
    <section className="card motion-card widget-fill">
      <div className="joystick-header">
        <h2>{title}</h2>
        <div className="mode-compact">
          <span className="mode-label">Mode</span>
          <button className="deadman compact" onClick={cycleMode}>
            {selectModeLabel(mode)}
          </button>
        </div>
      </div>
      <div className="joystick-grid">
        <div className="joystick-panel">
          <h3>Translation</h3>
          <div className="joystick-with-side">
            <ZSlider value={z} onChange={setZ} />
            <div className="joystick-wrap">
              <NippleJoystick onMove={(x, y) => setJoy(x, y)} size={300} />
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
            <div>mag: {Math.min(1, Math.hypot(joyX, joyY)).toFixed(2)}</div>
          </div>
        </div>
        <div className="joystick-panel">
          <h3>Rotation</h3>
          <RzSlider value={rz} onChange={setRz} />
          <div className="joystick-wrap">
            <NippleJoystick onMove={(x, y) => setRot(x, y)} color="#f97316" size={300} />
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
        </div>
      </div>
    </section>
  );
}

function MaxVelocityWidget({ title }: { title: string }) {
  const maxVelocity = useTeleopStore((s) => s.maxVelocity);
  const setMaxVelocity = useTeleopStore((s) => s.setMaxVelocity);

  return (
    <section className="card widget-fill">
      <h2>{title}</h2>
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
      <div className="slider-value">{maxVelocity.toFixed(2)}</div>
    </section>
  );
}

function GripperWidget({ title }: { title: string }) {
  const gripperSpeed = useUiStore((s) => s.gripperSpeed);
  const gripperForce = useUiStore((s) => s.gripperForce);
  const setGripperSpeed = useUiStore((s) => s.setGripperSpeed);
  const setGripperForce = useUiStore((s) => s.setGripperForce);

  return (
    <section className="card widget-fill">
      <h2>{title}</h2>
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
    </section>
  );
}

function SavedPosesWidget({ title }: { title: string }) {
  return (
    <section className="card pose-card widget-fill">
      <h2>{title}</h2>
      <div className="pose-grid">
        <button className="pose-button">🏠 Home</button>
        <button className="pose-button">⭐ Custom 1</button>
        <button className="pose-button">⭐ Custom 2</button>
        <button className="pose-button">⭐ Custom 3</button>
      </div>
    </section>
  );
}

function LiveDashboardWidget({ title }: { title: string }) {
  const wsState = useTeleopStore((s) => s.wsState);
  const watchdogStatus = selectWatchdogStatus(wsState);
  const tcpSpeed = wsState?.tcp_speed_mps ?? null;
  const eePose = wsState?.ee_pose ?? null;

  return (
    <section className="card dashboard-card widget-fill">
      <div className="dashboard-header">
        <h2>{title}</h2>
      </div>
      <div className="dashboard-grid">
        <div className="dashboard-item">
          <div className="dashboard-label">TCP Speed</div>
          <div className="dashboard-value">
            {tcpSpeed == null ? "n/a" : `${tcpSpeed.toFixed(3)} m/s`}
          </div>
        </div>
        <div className="dashboard-item">
          <div className="dashboard-label">EE Pose (x,y,z)</div>
          <div className="dashboard-value mono">
            {eePose
              ? `${eePose.x.toFixed(3)}, ${eePose.y.toFixed(3)}, ${eePose.z.toFixed(3)}`
              : "n/a"}
          </div>
        </div>
        <div className={`dashboard-item badge ${watchdogStatus}`}>
          <div className="dashboard-label">Watchdog</div>
          <div className="dashboard-value">{watchdogStatus.toUpperCase()}</div>
        </div>
      </div>
    </section>
  );
}

function RvizWidget({ title }: { title: string }) {
  const rvizStreamUrl = useUiStore((s) => s.rvizStreamUrl);
  const setRvizStreamUrl = useUiStore((s) => s.setRvizStreamUrl);

  return (
    <section className="card rviz-card widget-fill">
      <h2>{title}</h2>
      <div className="stream-card">
        <img src={rvizStreamUrl || rvizPlaceholder} alt="RViz stream" />
      </div>
      <div className="stream-config">
        <label>Stream URL</label>
        <input value={rvizStreamUrl} onChange={(e) => setRvizStreamUrl(e.target.value)} />
      </div>
    </section>
  );
}

function ArticularWidget({ title }: { title: string }) {
  const jointPositions = useUiStore((s) => s.jointPositions);
  const setJointPositions = useUiStore((s) => s.setJointPositions);
  const jointTorques = useTeleopStore((s) => s.wsState?.joint_torques ?? null);

  const jointNames = ["Joint 1", "Joint 2", "Joint 3", "Joint 4", "Joint 5", "Joint 6"];
  const jointLimits = [
    { min: -3.14, max: 3.14 },
    { min: -3.14, max: 3.14 },
    { min: -3.14, max: 3.14 },
    { min: -3.14, max: 3.14 },
    { min: -3.14, max: 3.14 },
    { min: -3.14, max: 3.14 },
  ];

  return (
    <section className="card motion-card joint-card widget-fill">
      <div className="joint-header">
        <h2>{title}</h2>
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
    </section>
  );
}

function JointGraphsWidget({ title }: { title: string }) {
  return (
    <section className="card widget-fill">
      <h2>{title}</h2>
      <div className="mini-plot-grid">
        <div className="mini-plot">Joint 1</div>
        <div className="mini-plot">Joint 2</div>
        <div className="mini-plot">Joint 3</div>
        <div className="mini-plot">Joint 4</div>
        <div className="mini-plot">Joint 5</div>
        <div className="mini-plot">Joint 6</div>
      </div>
    </section>
  );
}

function CameraFeedWidget({ title }: { title: string }) {
  return (
    <section className="card camera-feed widget-fill">
      <h2>{title}</h2>
      <div className="stream-card camera-stream">
        <div className="stream-placeholder">Camera feed placeholder</div>
      </div>
    </section>
  );
}

function CameraSettingsWidget({ title }: { title: string }) {
  const cameraStreamUrl = useUiStore((s) => s.cameraStreamUrl);
  const setCameraStreamUrl = useUiStore((s) => s.setCameraStreamUrl);

  return (
    <section className="card camera-side widget-fill">
      <h2>{title}</h2>
      <div className="axis-row">
        <label>Camera selection</label>
        <select className="select">
          <option>Front</option>
          <option>Wrist</option>
          <option>Overhead</option>
        </select>
      </div>
      <div className="axis-row">
        <label>Exposure</label>
        <Slider.Root className="slider" min={0} max={1} step={0.01} value={[0.5]}>
          <Slider.Track className="slider-track">
            <Slider.Range className="slider-range" />
          </Slider.Track>
          <Slider.Thumb className="slider-thumb" />
        </Slider.Root>
      </div>
      <div className="axis-row">
        <label>FPS</label>
        <select className="select">
          <option>15</option>
          <option>30</option>
          <option>60</option>
        </select>
      </div>
      <div className="axis-row">
        <label>Latency</label>
        <div className="camera-metric">n/a</div>
      </div>
      <div className="axis-row">
        <label>Resolution</label>
        <select className="select">
          <option>640x480</option>
          <option>1280x720</option>
          <option>1920x1080</option>
        </select>
      </div>
      <div className="stream-config">
        <label>WebRTC URL</label>
        <input value={cameraStreamUrl} onChange={(e) => setCameraStreamUrl(e.target.value)} />
      </div>
    </section>
  );
}

function CameraActionsWidget({ title }: { title: string }) {
  return (
    <section className="card camera-bottom widget-fill">
      <h2>{title}</h2>
      <div className="camera-actions">
        <button className="header-button">Snapshot</button>
        <button className="header-button">Record</button>
        <button className="header-button">Overlay</button>
      </div>
    </section>
  );
}

function PosesSavedWidget({ title }: { title: string }) {
  return (
    <section className="card widget-fill">
      <h2>{title}</h2>
      <div className="pose-list">
        <div className="pose-item">Home</div>
        <div className="pose-item">Pick</div>
        <div className="pose-item">Place</div>
        <div className="pose-item">Custom 1</div>
      </div>
      <div className="pose-actions">
        <button className="header-button">Add current pose</button>
        <button className="header-button">Rename</button>
        <button className="header-button">Delete</button>
        <button className="header-button">Move to</button>
      </div>
    </section>
  );
}

function TrajectoryBuilderWidget({ title }: { title: string }) {
  return (
    <section className="card widget-fill">
      <h2>{title}</h2>
      <div className="trajectory-steps">
        <div className="trajectory-step">1. Home</div>
        <div className="trajectory-step">2. Pick</div>
        <div className="trajectory-step">3. Place</div>
      </div>
      <div className="pose-actions">
        <button className="header-button">Add Pose</button>
        <button className="header-button">Remove</button>
        <button className="header-button">Reorder</button>
        <button className="header-button">Save trajectory</button>
      </div>
    </section>
  );
}

function TrajectoryPreviewWidget({ title }: { title: string }) {
  return (
    <section className="card widget-fill">
      <h2>{title}</h2>
      <div className="preview-grid">
        <div className="preview-card">Time graph</div>
        <div className="preview-card">Joint interpolation curves</div>
        <div className="preview-card">Cartesian preview</div>
      </div>
    </section>
  );
}

function PetanqueStatusWidget({ title }: { title: string }) {
  return (
    <section className="card petanque-card petanque-top widget-fill">
      <div className="petanque-header">♦ {title}</div>
      <div className="petanque-status">
        <div className="petanque-item">
          <span className="petanque-label">Game Status</span>
          <span className="petanque-value">Idle</span>
        </div>
        <div className="petanque-item">
          <span className="petanque-label">Score</span>
          <span className="petanque-value">0 - 0</span>
        </div>
        <div className="petanque-item">
          <span className="petanque-label">Throw mode</span>
          <span className="petanque-value">Standard</span>
        </div>
        <div className="petanque-item">
          <span className="petanque-label">Calibration</span>
          <span className="petanque-value">Not calibrated</span>
        </div>
      </div>
    </section>
  );
}

function PetanqueActionsWidget({ title }: { title: string }) {
  return (
    <section className="card petanque-left widget-fill">
      <h2>{title}</h2>
      <div className="petanque-actions">
        <button className="header-button">Position Robot</button>
        <button className="header-button">Align Throw</button>
        <button className="header-button">Arm Ready</button>
      </div>
    </section>
  );
}

function PetanqueVisionWidget({ title }: { title: string }) {
  return (
    <section className="card petanque-right widget-fill">
      <h2>{title}</h2>
      <div className="petanque-vision-grid">
        <div className="preview-card">Camera feed</div>
        <div className="preview-card">Target detection</div>
        <div className="preview-card">Trajectory overlay</div>
      </div>
    </section>
  );
}

function ServoControlsWidget({ title }: { title: string }) {
  return (
    <section className="card widget-fill">
      <h2>{title}</h2>
      <div className="axis-row">
        <label>Select target</label>
        <select className="select">
          <option>Tag 0</option>
          <option>Tag 1</option>
          <option>Custom target</option>
        </select>
      </div>
      <div className="axis-row">
        <label>Enable servo</label>
        <button className="header-button">Enable</button>
      </div>
      <div className="axis-row">
        <label>PID gains</label>
        <div className="pid-grid">
          <div className="pid-row">
            <span>P</span>
            <Slider.Root className="slider" min={0} max={5} step={0.01} value={[1]}>
              <Slider.Track className="slider-track">
                <Slider.Range className="slider-range" />
              </Slider.Track>
              <Slider.Thumb className="slider-thumb" />
            </Slider.Root>
          </div>
          <div className="pid-row">
            <span>I</span>
            <Slider.Root className="slider" min={0} max={5} step={0.01} value={[0]}>
              <Slider.Track className="slider-track">
                <Slider.Range className="slider-range" />
              </Slider.Track>
              <Slider.Thumb className="slider-thumb" />
            </Slider.Root>
          </div>
          <div className="pid-row">
            <span>D</span>
            <Slider.Root className="slider" min={0} max={5} step={0.01} value={[0]}>
              <Slider.Track className="slider-track">
                <Slider.Range className="slider-range" />
              </Slider.Track>
              <Slider.Thumb className="slider-thumb" />
            </Slider.Root>
          </div>
        </div>
      </div>
    </section>
  );
}

function ServoVisualsWidget({ title }: { title: string }) {
  return (
    <section className="card widget-fill">
      <h2>{title}</h2>
      <div className="servo-visuals">
        <div className="preview-card">Live camera</div>
        <div className="preview-card">Target overlay</div>
        <div className="preview-card">Error vector visualization</div>
      </div>
    </section>
  );
}

function CurvesWidget({ title }: { title: string }) {
  const joyX = useTeleopStore((s) => s.joyX);
  const joyY = useTeleopStore((s) => s.joyY);
  const rotX = useTeleopStore((s) => s.rotX);
  const rotY = useTeleopStore((s) => s.rotY);
  const scaleX = useTeleopStore((s) => s.scaleX);
  const scaleY = useTeleopStore((s) => s.scaleY);
  const angularScaleX = useTeleopStore((s) => s.angularScaleX);
  const angularScaleY = useTeleopStore((s) => s.angularScaleY);
  const maxVelocity = useTeleopStore((s) => s.maxVelocity);
  const wsState = useTeleopStore((s) => s.wsState);
  const jointPositions = useUiStore((s) => s.jointPositions);

  const chartStartRef = useRef<number>(0);
  const [chartData, setChartData] = useState<
    Array<{
      t: number;
      lin: number;
      ang: number;
      err: number;
      gain: number;
      jv1: number;
      jv2: number;
      jp1: number;
      jp2: number;
    }>
  >([]);

  useEffect(() => {
    if (chartStartRef.current === 0) {
      chartStartRef.current = Date.now();
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const t = (Date.now() - chartStartRef.current) / 1000;
      const lin = Math.hypot(joyX * scaleX, joyY * scaleY);
      const ang = Math.hypot(rotX * angularScaleX, rotY * angularScaleY);
      const err =
        wsState?.cmd_age_ms != null && wsState?.watchdog_timeout_ms
          ? Math.min(1, wsState.cmd_age_ms / wsState.watchdog_timeout_ms)
          : 0;
      setChartData((prev) => {
        const last = prev[prev.length - 1];
        const dt = last ? Math.max(0.001, t - last.t) : 0.2;
        const jv1 = last ? (jointPositions[0] - last.jp1) / dt : 0;
        const jv2 = last ? (jointPositions[1] - last.jp2) / dt : 0;
        const next = [
          ...prev,
          {
            t,
            lin,
            ang,
            err,
            gain: maxVelocity,
            jv1,
            jv2,
            jp1: jointPositions[0],
            jp2: jointPositions[1],
          },
        ];
        return next.slice(-120);
      });
    }, 200);

    return () => clearInterval(interval);
  }, [
    joyX,
    joyY,
    rotX,
    rotY,
    scaleX,
    scaleY,
    angularScaleX,
    angularScaleY,
    wsState,
    maxVelocity,
    jointPositions,
  ]);

  return (
    <section className="card widget-fill">
      <h2>{title}</h2>
      <div className="curves-grid">
        <div className="chart-card">
          <h3>Linear Velocity</h3>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="t" tickFormatter={(v) => `${v.toFixed(0)}s`} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="lin" stroke="#22c55e" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="chart-card">
          <h3>Angular Velocity</h3>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="t" tickFormatter={(v) => `${v.toFixed(0)}s`} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="ang" stroke="#f97316" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="chart-card">
          <h3>Joint Velocities</h3>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="t" tickFormatter={(v) => `${v.toFixed(0)}s`} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="jv1" stroke="#3b82f6" dot={false} />
                <Line type="monotone" dataKey="jv2" stroke="#8b5cf6" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="chart-card">
          <h3>Error Norms</h3>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="t" tickFormatter={(v) => `${v.toFixed(0)}s`} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="err" stroke="#ef4444" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="chart-card">
          <h3>Controller Gains</h3>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="t" tickFormatter={(v) => `${v.toFixed(0)}s`} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="gain" stroke="#0ea5e9" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="chart-card">
          <h3>Joint Positions</h3>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="t" tickFormatter={(v) => `${v.toFixed(0)}s`} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="jp1" stroke="#22c55e" dot={false} />
                <Line type="monotone" dataKey="jp2" stroke="#f59e0b" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}

function LogsRecordingWidget({ title }: { title: string }) {
  return (
    <section className="card widget-fill">
      <h2>{title}</h2>
      <div className="logs-actions">
        <button className="header-button">Start recording</button>
        <button className="header-button stop">Stop recording</button>
      </div>
      <div className="axis-row">
        <label>Bag name</label>
        <input className="select" placeholder="session_01" />
      </div>
      <div className="axis-row">
        <label>Auto timestamp</label>
        <button className="toggle">On</button>
      </div>
    </section>
  );
}

function LogsSessionWidget({ title }: { title: string }) {
  return (
    <section className="card widget-fill">
      <h2>{title}</h2>
      <div className="logs-metrics">
        <div className="metric-item">
          <span className="metric-label">Active topics</span>
          <span className="metric-value">n/a</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Bag size</span>
          <span className="metric-value">0 MB</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Duration</span>
          <span className="metric-value">0:00</span>
        </div>
      </div>
      <button className="header-button">Download</button>
    </section>
  );
}

function ConfigAppearanceWidget({ title }: { title: string }) {
  const themeMode = useUiStore((s) => s.themeMode);
  const setThemeMode = useUiStore((s) => s.setThemeMode);

  return (
    <section className="card widget-fill">
      <h2>{title}</h2>
      <div className="axis-row">
        <label>Theme</label>
        <select
          className="select"
          value={themeMode}
          onChange={(e) => setThemeMode(e.target.value as "system" | "light" | "dark")}
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
    </section>
  );
}

function ConfigAdvancedWidget({ title }: { title: string }) {
  const maxVelocity = useTeleopStore((s) => s.maxVelocity);

  return (
    <section className="card widget-fill">
      <h2>{title}</h2>
      <div className="config-grid">
        <div className="axis-row">
          <label>Controller gains</label>
          <Slider.Root className="slider" min={0} max={2} step={0.01} value={[maxVelocity]}>
            <Slider.Track className="slider-track">
              <Slider.Range className="slider-range" />
            </Slider.Track>
            <Slider.Thumb className="slider-thumb" />
          </Slider.Root>
        </div>
        <div className="axis-row">
          <label>Filter cutoff</label>
          <Slider.Root className="slider" min={0} max={20} step={0.1} value={[5]}>
            <Slider.Track className="slider-track">
              <Slider.Range className="slider-range" />
            </Slider.Track>
            <Slider.Thumb className="slider-thumb" />
          </Slider.Root>
        </div>
        <div className="axis-row">
          <label>Max velocity</label>
          <Slider.Root className="slider" min={0} max={2} step={0.01} value={[maxVelocity]}>
            <Slider.Track className="slider-track">
              <Slider.Range className="slider-range" />
            </Slider.Track>
            <Slider.Thumb className="slider-thumb" />
          </Slider.Root>
        </div>
        <div className="axis-row">
          <label>Frame selection</label>
          <select className="select">
            <option>base</option>
            <option>ee</option>
          </select>
        </div>
        <div className="axis-row">
          <label>Robot type</label>
          <select className="select">
            <option>Kinova Gen3</option>
            <option>Explorer</option>
          </select>
        </div>
        <div className="axis-row">
          <label>Deadman logic</label>
          <select className="select">
            <option>Hold to move</option>
            <option>Toggle</option>
          </select>
        </div>
      </div>
    </section>
  );
}

function ConfigAxisWidget({ title }: { title: string }) {
  const scaleX = useTeleopStore((s) => s.scaleX);
  const scaleY = useTeleopStore((s) => s.scaleY);
  const scaleZ = useTeleopStore((s) => s.scaleZ);
  const setScaleX = useTeleopStore((s) => s.setScaleX);
  const setScaleY = useTeleopStore((s) => s.setScaleY);
  const setScaleZ = useTeleopStore((s) => s.setScaleZ);
  const invertX = useTeleopStore((s) => s.invertX);
  const invertY = useTeleopStore((s) => s.invertY);
  const invertZ = useTeleopStore((s) => s.invertZ);
  const setInvertX = useTeleopStore((s) => s.setInvertX);
  const setInvertY = useTeleopStore((s) => s.setInvertY);
  const setInvertZ = useTeleopStore((s) => s.setInvertZ);

  return (
    <section className="card widget-fill">
      <h2>{title}</h2>
      <div className="axis-row">
        <label>X Scale: {scaleX.toFixed(2)}</label>
        <Slider.Root
          className="slider"
          min={0}
          max={1}
          step={0.01}
          value={[scaleX]}
          onValueChange={(v) => setScaleX(v[0] ?? 1)}
        >
          <Slider.Track className="slider-track">
            <Slider.Range className="slider-range" />
          </Slider.Track>
          <Slider.Thumb className="slider-thumb" />
        </Slider.Root>
        <div className="axis-controls">
          <button className="toggle" onClick={() => setInvertX(!invertX)}>
            Invert X: {invertX ? "on" : "off"}
          </button>
        </div>
      </div>

      <div className="axis-row">
        <label>Y Scale: {scaleY.toFixed(2)}</label>
        <Slider.Root
          className="slider"
          min={0}
          max={1}
          step={0.01}
          value={[scaleY]}
          onValueChange={(v) => setScaleY(v[0] ?? 1)}
        >
          <Slider.Track className="slider-track">
            <Slider.Range className="slider-range" />
          </Slider.Track>
          <Slider.Thumb className="slider-thumb" />
        </Slider.Root>
        <div className="axis-controls">
          <button className="toggle" onClick={() => setInvertY(!invertY)}>
            Invert Y: {invertY ? "on" : "off"}
          </button>
        </div>
      </div>

      <div className="axis-row">
        <label>Z Scale: {scaleZ.toFixed(2)}</label>
        <Slider.Root
          className="slider"
          min={0}
          max={1}
          step={0.01}
          value={[scaleZ]}
          onValueChange={(v) => setScaleZ(v[0] ?? 1)}
        >
          <Slider.Track className="slider-track">
            <Slider.Range className="slider-range" />
          </Slider.Track>
          <Slider.Thumb className="slider-thumb" />
        </Slider.Root>
        <div className="axis-controls">
          <button className="toggle" onClick={() => setInvertZ(!invertZ)}>
            Invert Z: {invertZ ? "on" : "off"}
          </button>
        </div>
      </div>
    </section>
  );
}

function DebugSummaryWidget({ title }: { title: string }) {
  const wsStatus = useTeleopStore((s) => s.wsStatus);
  const wsState = useTeleopStore((s) => s.wsState);
  const seq = useTeleopStore((s) => s.seq);
  const mode = useTeleopStore((s) => s.mode);

  return (
    <section className="card widget-fill">
      <h2>{title}</h2>
      <div className="debug">
        <div className={`status ${wsStatus}`}>WS: {wsStatus}</div>
        <div>seq: {seq}</div>
        <div>mode: {mode}</div>
        <div>modeLabel: {selectModeLabel(mode)}</div>
        <div>state: {wsState ? "ok" : "n/a"}</div>
        {wsState && <pre>{JSON.stringify(wsState, null, 2)}</pre>}
      </div>
    </section>
  );
}

function DebugStreamsWidget({ title }: { title: string }) {
  const joyX = useTeleopStore((s) => s.joyX);
  const joyY = useTeleopStore((s) => s.joyY);
  const rotX = useTeleopStore((s) => s.rotX);
  const rotY = useTeleopStore((s) => s.rotY);
  const z = useTeleopStore((s) => s.z);
  const rz = useTeleopStore((s) => s.rz);
  const maxVelocity = useTeleopStore((s) => s.maxVelocity);
  const wsState = useTeleopStore((s) => s.wsState);
  const jointPositions = useUiStore((s) => s.jointPositions);
  const watchdogStatus = selectWatchdogStatus(wsState);

  return (
    <section className="card widget-fill">
      <h2>{title}</h2>
      <div className="debug-grid">
        <div className="debug-block">
          <h3>Raw teleop_cmd</h3>
          <pre>{JSON.stringify({
            mode: useTeleopStore.getState().mode,
            linear: {
              x: joyX,
              y: joyY,
              z,
            },
            angular: {
              x: rotX,
              y: rotY,
              z: rz,
            },
          }, null, 2)}</pre>
        </div>
        <div className="debug-block">
          <h3>Raw joint state</h3>
          <pre>{JSON.stringify({
            positions: jointPositions,
            torques: wsState?.joint_torques ?? [],
          }, null, 2)}</pre>
        </div>
        <div className="debug-block">
          <h3>Controller state</h3>
          <pre>{JSON.stringify({
            gain: maxVelocity,
            watchdog: watchdogStatus,
          }, null, 2)}</pre>
        </div>
        <div className="debug-block">
          <h3>Robot state</h3>
          <pre>{JSON.stringify({
            ee_pose: wsState?.ee_pose ?? null,
            tcp_speed: wsState?.tcp_speed_mps ?? null,
          }, null, 2)}</pre>
        </div>
      </div>
    </section>
  );
}
