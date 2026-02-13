import { useWidgetConfig } from "../hooks/useWidgetConfig";

export function PetanquePage() {
  const { isVisible, titleFor } = useWidgetConfig();

  return (
    <main className="layout petanque-layout tab-accent tab-petanque">
      {isVisible("petanque.status") && (
        <section className="card petanque-card petanque-top">
          <div className="petanque-header">♦ {titleFor("petanque.status", "Pétanque Mode")}</div>
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
      )}

      {isVisible("petanque.actions") && (
        <section className="card petanque-left">
          <h2>{titleFor("petanque.actions", "Robot Actions")}</h2>
          <div className="petanque-actions">
            <button className="header-button">Position Robot</button>
            <button className="header-button">Align Throw</button>
            <button className="header-button">Arm Ready</button>
          </div>
          {/* TODO(backend): petanque control actions */}
        </section>
      )}

      {isVisible("petanque.vision") && (
        <section className="card petanque-right">
          <h2>{titleFor("petanque.vision", "Vision & Trajectory")}</h2>
          <div className="petanque-vision-grid">
            <div className="preview-card">Camera feed</div>
            <div className="preview-card">Target detection</div>
            <div className="preview-card">Trajectory overlay</div>
          </div>
          {/* TODO(backend): camera + detection overlays */}
        </section>
      )}
    </main>
  );
}
