import { useUiStore } from "../store/uiStore";
import { useTeleopStore, selectWatchdogStatus } from "../store/teleopStore";
import { useWidgetConfig } from "../hooks/useWidgetConfig";
import rvizPlaceholder from "../assets/explorer-rviz.png";

export function LiveTeleopPage() {
  const rvizStreamUrl = useUiStore((s) => s.rvizStreamUrl);
  const setRvizStreamUrl = useUiStore((s) => s.setRvizStreamUrl);
  const wsState = useTeleopStore((s) => s.wsState);
  const { isVisible, titleFor } = useWidgetConfig();

  const tcpSpeed = wsState?.tcp_speed_mps ?? null;
  const eePose = wsState?.ee_pose ?? null;
  const watchdogStatus = selectWatchdogStatus(wsState);

  return (
    <main className="layout controls-layout tab-accent tab-live">
      <div className="controls-main">
        {isVisible("live.dashboard") && (
          <section className="card dashboard-card motion-card">
            <div className="dashboard-header">
              <h2>{titleFor("live.dashboard", "Live Teleoperation Dashboard")}</h2>
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
        )}
      </div>

      <aside className="controls-side">
        {isVisible("live.rviz") && (
          <section className="card rviz-card">
            <h2>{titleFor("live.rviz", "RViz Live")}</h2>
            <div className="stream-card">
              <img src={rvizStreamUrl || rvizPlaceholder} alt="RViz stream" />
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
        )}
      </aside>
    </main>
  );
}
