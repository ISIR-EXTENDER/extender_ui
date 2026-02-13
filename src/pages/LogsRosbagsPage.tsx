import { useWidgetConfig } from "../hooks/useWidgetConfig";

export function LogsRosbagsPage() {
  const { isVisible, titleFor } = useWidgetConfig();

  return (
    <main className="layout logs-layout tab-accent tab-logs">
      {isVisible("logs.recording") && (
        <section className="card">
          <h2>{titleFor("logs.recording", "Recording")}</h2>
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
      )}
      {isVisible("logs.session") && (
        <section className="card">
          <h2>{titleFor("logs.session", "Active Session")}</h2>
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
      )}
    </main>
  );
}
