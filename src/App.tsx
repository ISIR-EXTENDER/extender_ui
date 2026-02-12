import { useEffect, useMemo, useRef, useState, useCallback } from "react";
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

import { Joystick } from "./components/Joystick";
import { useTeleopStore } from "./store";
import rvizPlaceholder from "./assets/explorer-rviz.png";
import "./App.css";

// WebSocket endpoint for teleop commands + live robot state.
const WS_URL = "ws://127.0.0.1:8765/ws/control";

// Minimal subset of the server "state" message used by the UI.
type WsState = {
  connected: boolean;
  cmd_age_ms: number | null;
  watchdog_timeout_ms: number;
  last_seq: number;
  publishing_rate_hz: number;
  current_mode: number;
  tcp_speed_mps?: number;
  ee_pose?: {
    x: number;
    y: number;
    z: number;
  };
  watchdog_state?: string;
};

function App() {
  const {
    joyX,
    joyY,
    rotX,
    rotY,
    z,
    rz,
    mode,
    wsStatus,
    seq,
    scaleX,
    scaleY,
    scaleZ,
    invertX,
    invertY,
    invertZ,
  } = useTeleopStore();
  const setJoy = useTeleopStore((s) => s.setJoy);
  const setZ = useTeleopStore((s) => s.setZ);
  const setRot = useTeleopStore((s) => s.setRot);
  const setRz = useTeleopStore((s) => s.setRz);
  const setWsStatus = useTeleopStore((s) => s.setWsStatus);
  const setScaleX = useTeleopStore((s) => s.setScaleX);
  const setScaleY = useTeleopStore((s) => s.setScaleY);
  const setScaleZ = useTeleopStore((s) => s.setScaleZ);
  const setInvertX = useTeleopStore((s) => s.setInvertX);
  const setInvertY = useTeleopStore((s) => s.setInvertY);
  const setInvertZ = useTeleopStore((s) => s.setInvertZ);
  const cycleMode = useTeleopStore((s) => s.cycleMode);
  const nextSeq = useTeleopStore((s) => s.nextSeq);

  const wsRef = useRef<WebSocket | null>(null);
  const [stateMsg, setStateMsg] = useState<WsState | null>(null);
  const [activeTab, setActiveTab] = useState<
    "controls" | "articular" | "configurations" | "debug" | "camera" | "logs" | "poses" | "petanque" | "curves" | "visual_servoing"
  >("controls");
  const [rvizStreamUrl, setRvizStreamUrl] = useState("");
  const [cameraStreamUrl, setCameraStreamUrl] = useState("webrtc://localhost:8001/stream");
  const [maxVelocity, setMaxVelocity] = useState(1.0);
  const [gripperSpeed, setGripperSpeed] = useState(0.5);
  const [gripperForce, setGripperForce] = useState(0.5);
  const [focusMode, setFocusMode] = useState(false);
  const [themeMode, setThemeMode] = useState<"system" | "light" | "dark">("system");
  const [jointPositions, setJointPositions] = useState([0, 0, 0, 0, 0, 0]);
  const jointNames = ["Joint 1", "Joint 2", "Joint 3", "Joint 4", "Joint 5", "Joint 6"];
  const jointLimits = [
    { min: -3.14, max: 3.14 },
    { min: -3.14, max: 3.14 },
    { min: -3.14, max: 3.14 },
    { min: -3.14, max: 3.14 },
    { min: -3.14, max: 3.14 },
    { min: -3.14, max: 3.14 },
  ];
  const jointTorques = stateMsg && Array.isArray((stateMsg as any).joint_torques)
    ? ((stateMsg as any).joint_torques as number[])
    : null;
  const chartStartRef = useRef<number>(Date.now());
  // Lightweight rolling buffer for Curves tab.
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

  const magnitude = useMemo(
    () => Math.min(1, Math.hypot(joyX, joyY)),
    [joyX, joyY]
  );

  // Derived live telemetry (optional fields if server provides them).
  const tcpSpeed = stateMsg?.tcp_speed_mps ?? null;
  const eePose = stateMsg?.ee_pose ?? null;
  const watchdogStatus = useMemo(() => {
    if (!stateMsg) return "n/a";
    if (stateMsg.watchdog_state) return stateMsg.watchdog_state;
    if (stateMsg.cmd_age_ms == null || stateMsg.watchdog_timeout_ms == null) return "n/a";
    return stateMsg.cmd_age_ms > stateMsg.watchdog_timeout_ms ? "timeout" : "ok";
  }, [stateMsg]);

  const modeLabel = useMemo(() => {
    switch (mode) {
      case 0:
        return "TRANSLATION_ROTATION";
      case 1:
        return "ROTATION";
      case 2:
        return "TRANSLATION";
      case 3:
        return "BOTH";
      default:
        return "UNKNOWN";
    }
  }, [mode]);

  const rotationOnly = mode === 1 || mode === 3;
  const translationActive = mode === 0 || mode === 2 || mode === 3;

  // Apply theme to root element (system/light/dark).
  // Curves: derive quick plots from UI inputs + watchdog age (placeholder for telemetry).
  useEffect(() => {
    if (!translationActive && z !== 0) {
      setZ(0);
    }
    if (!rotationOnly && rz !== 0) {
      setRz(0);
    }
  }, [translationActive, rotationOnly, z, rz, setZ, setRz]);

  // WebSocket connection for live state + command send.
  useEffect(() => {
    const stored = localStorage.getItem("themeMode");
    if (stored === "light" || stored === "dark" || stored === "system") {
      setThemeMode(stored);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === "system") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", themeMode);
    }
    localStorage.setItem("themeMode", themeMode);
  }, [themeMode]);


  useEffect(() => {
    if (typeof WebSocket === "undefined") {
      setWsStatus("disconnected");
      return;
    }

    setWsStatus("connecting");
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => setWsStatus("connected");
      ws.onclose = () => setWsStatus("disconnected");
      ws.onerror = () => setWsStatus("disconnected");
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "state") {
            setStateMsg(msg);
          }
        } catch {
          // ignore
        }
      };
    } catch {
      setWsStatus("disconnected");
    }

    return () => {
      wsRef.current?.close();
    };
  }, [setWsStatus]);

  const sendTeleop = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const seq = nextSeq();
    const payload = {
      type: "teleop_cmd",
      seq,
      mode,
      linear: {
        x: translationActive ? (invertX ? -1 : 1) * joyX * scaleX : 0,
        y: translationActive ? (invertY ? -1 : 1) * joyY * scaleY : 0,
        z: translationActive ? (invertZ ? -1 : 1) * z * scaleZ : 0,
      },
      angular: {
        x: rotationOnly ? (invertX ? -1 : 1) * rotX * scaleX : 0,
        y: rotationOnly ? (invertY ? -1 : 1) * rotY * scaleY : 0,
        z: rotationOnly ? (invertZ ? -1 : 1) * rz * scaleZ : 0,
      },
    };
    ws.send(JSON.stringify(payload));
  }, [joyX, joyY, rotX, rotY, z, rz, mode, nextSeq, scaleX, scaleY, scaleZ, invertX, invertY, invertZ, rotationOnly, translationActive]);

  const sendZero = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const seq = nextSeq();
    const payload = {
      type: "teleop_cmd",
      seq,
      mode,
      linear: { x: 0, y: 0, z: 0 },
      angular: { x: 0, y: 0, z: 0 },
    };
    ws.send(JSON.stringify(payload));
  }, [mode, nextSeq]);

  const handleStop = useCallback(() => {
    setJoy(0, 0);
    setRot(0, 0);
    setZ(0);
    setRz(0);
    sendZero();
  }, [sendZero, setJoy, setRot, setRz, setZ]);

  useEffect(() => {
    sendTeleop();
  }, [sendTeleop]);

  useEffect(() => {
    const interval = setInterval(() => {
      sendTeleop();
    }, 10);

    return () => clearInterval(interval);
  }, [sendTeleop]);

  useEffect(() => {
    const interval = setInterval(() => {
      const t = (Date.now() - chartStartRef.current) / 1000;
      const lin = Math.hypot(joyX * scaleX, joyY * scaleY);
      const ang = Math.hypot(rotX * scaleX, rotY * scaleY);
      const err = stateMsg?.cmd_age_ms != null && stateMsg?.watchdog_timeout_ms
        ? Math.min(1, stateMsg.cmd_age_ms / stateMsg.watchdog_timeout_ms)
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
  }, [joyX, joyY, rotX, rotY, scaleX, scaleY, stateMsg, maxVelocity, jointPositions]);

  const motionPanel = (
    <section className="card motion-card">
      <div className="joystick-header">
        <h2>Motion Controls</h2>
        <div className="mode-compact">
          <span className="mode-label">Mode</span>
          <button className="deadman compact" onClick={cycleMode}>
            {modeLabel}
          </button>
        </div>
      </div>
      <div className="joystick-grid">
        <div className="joystick-panel">
          <h3>Translation</h3>
          <div className="joystick-wrap">
            <Joystick onMove={(x, y) => setJoy(x, y)} />
            <div className="axis-labels">
              <span className="axis-label axis-top">Y+</span>
              <span className="axis-label axis-right">X+</span>
              <span className="axis-label axis-bottom">Y-</span>
              <span className="axis-label axis-left">X-</span>
            </div>
          </div>
          <div className="vector">
            <div>joyX: {joyX.toFixed(2)}</div>
            <div>joyY: {joyY.toFixed(2)}</div>
            <div>mag: {magnitude.toFixed(2)}</div>
          </div>
          <div className="z-controls">
            <button
              className="z-button"
              onPointerDown={() => setZ(1)}
              onPointerUp={() => setZ(0)}
              onPointerLeave={() => setZ(0)}
            >
              Z+
            </button>
            <button
              className="z-button"
              onPointerDown={() => setZ(-1)}
              onPointerUp={() => setZ(0)}
              onPointerLeave={() => setZ(0)}
            >
              Z-
            </button>
            <div className="z-readout">z: {z.toFixed(2)}</div>
          </div>
        </div>
        <div className="joystick-panel">
          <h3>Rotation</h3>
          <div className="joystick-wrap">
            <Joystick onMove={(x, y) => setRot(x, y)} color="#f97316" />
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
          <div className="z-controls">
            <button
              className="z-button"
              onPointerDown={() => setRz(1)}
              onPointerUp={() => setRz(0)}
              onPointerLeave={() => setRz(0)}
            >
              RZ+
            </button>
            <button
              className="z-button"
              onPointerDown={() => setRz(-1)}
              onPointerUp={() => setRz(0)}
              onPointerLeave={() => setRz(0)}
            >
              RZ-
            </button>
            <div className="z-readout">rz: {rz.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <div className="app">
      <header className="header">
        <h1>Extender Tablet Interface</h1>
        <div className="header-actions">
          <button
            className="header-button focus"
            type="button"
            onClick={() => setFocusMode((prev) => !prev)}
          >
            {focusMode ? "Exit Focus" : "Focus"}
          </button>
          <button className="header-button home" type="button">
            🏠 Home
          </button>
          <button className="header-button stop" type="button" onClick={handleStop}>
            STOP
          </button>
        </div>
      </header>

      {!focusMode && (
        <div className="tab-bar">
          <button
            className={`tab-button ${activeTab === "controls" ? "active" : ""}`}
            onClick={() => setActiveTab("controls")}
          >
            Controls
          </button>
          <button
            className={`tab-button ${activeTab === "articular" ? "active" : ""}`}
            onClick={() => setActiveTab("articular")}
          >
            Articular
          </button>
          <button
            className={`tab-button ${activeTab === "camera" ? "active" : ""}`}
            onClick={() => setActiveTab("camera")}
          >
            Camera
          </button>
          <button
            className={`tab-button ${activeTab === "visual_servoing" ? "active" : ""}`}
            onClick={() => setActiveTab("visual_servoing")}
          >
            Visual Servoing
          </button>
          <button
            className={`tab-button ${activeTab === "logs" ? "active" : ""}`}
            onClick={() => setActiveTab("logs")}
          >
            Logs/Rosbags
          </button>
          <button
            className={`tab-button ${activeTab === "poses" ? "active" : ""}`}
            onClick={() => setActiveTab("poses")}
          >
            Poses/Trajectories
          </button>
          <button
            className={`tab-button ${activeTab === "petanque" ? "active" : ""}`}
            onClick={() => setActiveTab("petanque")}
          >
            Pétanque
          </button>
          <button
            className={`tab-button ${activeTab === "curves" ? "active" : ""}`}
            onClick={() => setActiveTab("curves")}
          >
            Courbes
          </button>
          <button
            className={`tab-button ${activeTab === "configurations" ? "active" : ""}`}
            onClick={() => setActiveTab("configurations")}
          >
            Configurations
          </button>
          <button
            className={`tab-button ${activeTab === "debug" ? "active" : ""}`}
            onClick={() => setActiveTab("debug")}
          >
            Debug
          </button>
        </div>
      )}

      {focusMode && (
        <main className="layout focus-layout tab-accent tab-controls">
          {motionPanel}
        </main>
      )}

      {!focusMode && activeTab === "controls" && (
        <main className="layout controls-layout tab-accent tab-controls">
          <div className="controls-main">
            {motionPanel}

            <section className="card">
              <h2>Max Velocity</h2>
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
            </section>

            <section className="card">
              <h2>Gripper Control</h2>
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
            </section>

            <section className="card pose-card">
              <h2>Saved Poses</h2>
              <div className="pose-grid">
                <button className="pose-button">🏠 Home</button>
                <button className="pose-button">⭐ Custom 1</button>
                <button className="pose-button">⭐ Custom 2</button>
                <button className="pose-button">⭐ Custom 3</button>
              </div>
              {/* TODO(backend): wire pose recall service/action */}
            </section>
          </div>

          <aside className="controls-side">
            <section className="card dashboard-card">
              <div className="dashboard-header">
                <h2>Live Teleoperation Dashboard</h2>
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
                  <div className="dashboard-value">
                    {watchdogStatus.toUpperCase()}
                  </div>
                </div>
              </div>
            </section>
            <section className="card rviz-card">
              <h2>RViz Live</h2>
              <div className="stream-card">
                <img
                  src={rvizStreamUrl || rvizPlaceholder}
                  alt="RViz stream"
                />
              </div>
              <div className="stream-config">
                <label>Stream URL</label>
                <input
                  value={rvizStreamUrl}
                  onChange={(e) => setRvizStreamUrl(e.target.value)}
                />
              </div>
              {/* TODO(backend): provide RViz stream bridge (MJPEG/WebRTC) */}
            </section>
          </aside>
        </main>
      )}

      {!focusMode && activeTab === "camera" && (
        <main className="layout camera-layout tab-accent tab-camera">
          <section className="card camera-feed">
            <h2>Camera</h2>
            <div className="stream-card camera-stream">
              <div className="stream-placeholder">Camera feed placeholder</div>
            </div>
          </section>
          <section className="card camera-side">
            <h2>Camera Settings</h2>
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
              <input
                value={cameraStreamUrl}
                onChange={(e) => setCameraStreamUrl(e.target.value)}
              />
            </div>
            {/* TODO(backend): connect camera settings */}
          </section>
          <section className="card camera-bottom">
            <h2>Actions</h2>
            <div className="camera-actions">
              <button className="header-button">Snapshot</button>
              <button className="header-button">Record</button>
              <button className="header-button">Overlay</button>
            </div>
          </section>
        </main>
      )}

      {!focusMode && activeTab === "visual_servoing" && (
        <main className="layout servo-layout">
          <section className="card">
            <h2>Visual Servoing</h2>
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
            {/* TODO(backend): wire target selection, enable, and PID */}
          </section>

          <section className="card">
            <h2>Live View</h2>
            <div className="servo-visuals">
              <div className="preview-card">Live camera</div>
              <div className="preview-card">Target overlay</div>
              <div className="preview-card">Error vector visualization</div>
            </div>
            {/* TODO(backend): stream camera + overlays + error vector */}
          </section>
        </main>
      )}

      {!focusMode && activeTab === "articular" && (
        <main className="layout controls-layout tab-accent tab-articular">
          <div className="controls-main">
            <section className="card motion-card joint-card">
              <div className="joint-header">
                <h2>Articular Control</h2>
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
                      <span className="joint-value">
                        {jointPositions[idx].toFixed(2)} rad
                      </span>
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

            <section className="card">
              <h2>Gripper</h2>
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
              {/* TODO(backend): wire gripper actions in articular tab */}
            </section>

            <section className="card pose-card">
              <h2>Saved Poses</h2>
              <div className="pose-grid">
                <button className="pose-button">🏠 Home</button>
                <button className="pose-button">⭐ Custom 1</button>
                <button className="pose-button">⭐ Custom 2</button>
                <button className="pose-button">⭐ Custom 3</button>
              </div>
              {/* TODO(backend): wire pose recall service/action */}
            </section>
          </div>

          <aside className="controls-side">
            <section className="card rviz-card">
              <h2>RViz Live</h2>
              <div className="stream-card tight">
                <img
                  src={rvizStreamUrl || rvizPlaceholder}
                  alt="RViz stream"
                />
              </div>
              <div className="stream-config">
                <label>Stream URL</label>
                <input
                  value={rvizStreamUrl}
                  onChange={(e) => setRvizStreamUrl(e.target.value)}
                />
              </div>
            </section>
            <section className="card">
              <h2>Joint Graphs</h2>
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
          </aside>
        </main>
      )}

      {!focusMode && activeTab === "logs" && (
        <main className="layout logs-layout tab-accent tab-logs">
          <section className="card">
            <h2>Recording</h2>
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
            {/* TODO(backend): rosbag start/stop + naming */}
          </section>
          <section className="card">
            <h2>Active Session</h2>
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
            {/* TODO(backend): active topics + size + duration + download */}
          </section>
        </main>
      )}

      {!focusMode && activeTab === "poses" && (
        <main className="layout poses-layout tab-accent tab-poses">
          <section className="card">
            <h2>Saved Poses</h2>
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
            {/* TODO(backend): list poses + add/rename/delete/move */}
          </section>

          <section className="card">
            <h2>Trajectory Builder</h2>
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
            {/* TODO(backend): build trajectory from pose list */}
          </section>

          <section className="card">
            <h2>Trajectory Preview</h2>
            <div className="preview-grid">
              <div className="preview-card">Time graph</div>
              <div className="preview-card">Joint interpolation curves</div>
              <div className="preview-card">Cartesian preview</div>
            </div>
            {/* TODO(backend): merge Courbes tab into previews */}
          </section>
        </main>
      )}

      {!focusMode && activeTab === "petanque" && (
        <main className="layout petanque-layout tab-accent tab-petanque">
          <section className="card petanque-card petanque-top">
            <div className="petanque-header">♦ Pétanque Mode</div>
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

          <section className="card petanque-left">
            <h2>Robot Actions</h2>
            <div className="petanque-actions">
              <button className="header-button">Position Robot</button>
              <button className="header-button">Align Throw</button>
              <button className="header-button">Arm Ready</button>
            </div>
            {/* TODO(backend): petanque control actions */}
          </section>

          <section className="card petanque-right">
            <h2>Vision & Trajectory</h2>
            <div className="petanque-vision-grid">
              <div className="preview-card">Camera feed</div>
              <div className="preview-card">Target detection</div>
              <div className="preview-card">Trajectory overlay</div>
            </div>
            {/* TODO(backend): camera + detection overlays */}
          </section>
        </main>
      )}

      {!focusMode && activeTab === "curves" && (
        <main className="layout">
          <section className="card">
            <h2>Courbes</h2>
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
                      <Line type="monotone" dataKey="gain" stroke="#14b8a6" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      {!focusMode && activeTab === "configurations" && (
        <main className="layout tab-accent tab-config">
          <section className="card">
            <h2>Appearance</h2>
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
          <section className="card">
            <h2>Advanced Configuration</h2>
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
            {/* TODO(backend): advanced parameters */}
          </section>
          <section className="card">
            <h2>Axis Inversion</h2>
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
        </main>
      )}

      {!focusMode && activeTab === "debug" && (
        <main className="layout">
          <section className="card">
            <h2>Debug</h2>
            <div className="debug">
              <div className={`status ${wsStatus}`}>WS: {wsStatus}</div>
              <div>seq: {seq}</div>
              <div>mode: {mode}</div>
              <div>modeLabel: {modeLabel}</div>
              <div>state: {stateMsg ? "ok" : "n/a"}</div>
              {stateMsg && (
                <pre>{JSON.stringify(stateMsg, null, 2)}</pre>
              )}
            </div>
          </section>
          <section className="card">
            <h2>Low-level Streams</h2>
            <div className="debug-grid">
              <div className="debug-block">
                <h3>Raw teleop_cmd</h3>
                <pre>{JSON.stringify({
                  mode,
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
                  torques: jointTorques ?? [],
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
                  ee_pose: eePose ?? null,
                  tcp_speed: tcpSpeed ?? null,
                }, null, 2)}</pre>
              </div>
              <div className="debug-block">
                <h3>Latency metrics</h3>
                <pre>{JSON.stringify({
                  cmd_age_ms: stateMsg?.cmd_age_ms ?? null,
                  watchdog_timeout_ms: stateMsg?.watchdog_timeout_ms ?? null,
                }, null, 2)}</pre>
              </div>
              <div className="debug-block">
                <h3>Watchdog</h3>
                <pre>{JSON.stringify({
                  status: watchdogStatus,
                  last_seq: stateMsg?.last_seq ?? null,
                }, null, 2)}</pre>
              </div>
            </div>
          </section>
        </main>
      )}
    </div>
  );
}

export default App;
