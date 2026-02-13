import { useTeleopStore, selectModeLabel, selectWatchdogStatus } from "../store/teleopStore";
import { useWidgetConfig } from "../hooks/useWidgetConfig";
import { useUiStore } from "../store/uiStore";

export function DebugPage() {
  const wsStatus = useTeleopStore((s) => s.wsStatus);
  const wsState = useTeleopStore((s) => s.wsState);
  const seq = useTeleopStore((s) => s.seq);
  const mode = useTeleopStore((s) => s.mode);
  const joyX = useTeleopStore((s) => s.joyX);
  const joyY = useTeleopStore((s) => s.joyY);
  const rotX = useTeleopStore((s) => s.rotX);
  const rotY = useTeleopStore((s) => s.rotY);
  const z = useTeleopStore((s) => s.z);
  const rz = useTeleopStore((s) => s.rz);
  const maxVelocity = useTeleopStore((s) => s.maxVelocity);
  const jointPositions = useUiStore((s) => s.jointPositions);
  const { isVisible, titleFor } = useWidgetConfig();

  const watchdogStatus = selectWatchdogStatus(wsState);

  return (
    <main className="layout">
      {isVisible("debug.summary") && (
        <section className="card">
          <h2>{titleFor("debug.summary", "Debug")}</h2>
          <div className="debug">
            <div className={`status ${wsStatus}`}>WS: {wsStatus}</div>
            <div>seq: {seq}</div>
            <div>mode: {mode}</div>
            <div>modeLabel: {selectModeLabel(mode)}</div>
            <div>state: {wsState ? "ok" : "n/a"}</div>
            {wsState && <pre>{JSON.stringify(wsState, null, 2)}</pre>}
          </div>
        </section>
      )}

      {isVisible("debug.streams") && (
        <section className="card">
          <h2>{titleFor("debug.streams", "Low-level Streams")}</h2>
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
            <div className="debug-block">
              <h3>Latency metrics</h3>
              <pre>{JSON.stringify({
                cmd_age_ms: wsState?.cmd_age_ms ?? null,
                watchdog_timeout_ms: wsState?.watchdog_timeout_ms ?? null,
              }, null, 2)}</pre>
            </div>
            <div className="debug-block">
              <h3>Watchdog</h3>
              <pre>{JSON.stringify({
                status: watchdogStatus,
                last_seq: wsState?.last_seq ?? null,
              }, null, 2)}</pre>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
