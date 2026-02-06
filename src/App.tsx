import { useEffect, useMemo, useRef, useState } from "react";
import * as Slider from "@radix-ui/react-slider";

import { Joystick } from "./components/Joystick";
import { useTeleopStore } from "./store";
import "./App.css";

const WS_URL = "ws://127.0.0.1:8765/ws/control";

type WsState = {
  connected: boolean;
  cmd_age_ms: number | null;
  watchdog_timeout_ms: number;
  last_seq: number;
  publishing_rate_hz: number;
  current_mode: number;
};

function App() {
  const {
    joyX,
    joyY,
    z,
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
  const setZ = useTeleopStore((s) => s.setZ);
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

  const magnitude = useMemo(
    () => Math.min(1, Math.hypot(joyX, joyY)),
    [joyX, joyY]
  );

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

  useEffect(() => {
    const interval = setInterval(() => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;

      const seq = nextSeq();
      const payload = {
        type: "teleop_cmd",
        seq,
        mode,
        linear: {
          x: (invertX ? -1 : 1) * joyX * scaleX,
          y: (invertY ? -1 : 1) * joyY * scaleY,
          z: (invertZ ? -1 : 1) * z * scaleZ,
        },
        angular: {
          x: 0,
          y: 0,
          z: 0,
        },
      };
      ws.send(JSON.stringify(payload));
    }, 20);

    return () => clearInterval(interval);
  }, [joyX, joyY, z, mode, nextSeq, scaleX, scaleY, scaleZ, invertX, invertY, invertZ]);

  return (
    <div className="app">
      <header className="header">
        <h1>Extender Tablet Interface</h1>
        <div className={`status ${wsStatus}`}>WS: {wsStatus}</div>
      </header>

      <main className="layout">
        <section className="card">
          <h2>Joystick</h2>
          <div className="joystick-wrap">
            <Joystick />
            <div className="cardinal">
              <span>↑</span>
              <span>↓</span>
              <span>←</span>
              <span>→</span>
            </div>
          </div>
          <div className="vector">
            <div>joyX: {joyX.toFixed(2)}</div>
            <div>joyY: {joyY.toFixed(2)}</div>
            <div>mag: {magnitude.toFixed(2)}</div>
          </div>
        </section>

        <section className="card">
          <h2>Mode</h2>
          <button className="deadman" onClick={cycleMode}>
            Change Mode (current: {mode})
          </button>
          <div className="deadman-status">Mode cycles 0 → 1 → 2 → 3</div>
        </section>

        <section className="card">
          <h2>Z Axis</h2>
          <Slider.Root
            className="slider"
            min={-1}
            max={1}
            step={0.01}
            value={[z]}
            onValueChange={(v) => setZ(v[0] ?? 0)}
          >
            <Slider.Track className="slider-track">
              <Slider.Range className="slider-range" />
            </Slider.Track>
            <Slider.Thumb className="slider-thumb" />
          </Slider.Root>
          <div className="slider-value">z: {z.toFixed(2)}</div>
        </section>

        <section className="card">
          <h2>Axis Config</h2>
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

        <section className="card">
          <h2>Debug</h2>
          <div className="debug">
            <div>seq: {seq}</div>
            <div>mode: {mode}</div>
            <div>state: {stateMsg ? "ok" : "n/a"}</div>
            {stateMsg && (
              <pre>{JSON.stringify(stateMsg, null, 2)}</pre>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
