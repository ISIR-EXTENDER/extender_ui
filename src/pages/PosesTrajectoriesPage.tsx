import { useWidgetConfig } from "../hooks/useWidgetConfig";

export function PosesTrajectoriesPage() {
  const { isVisible, titleFor } = useWidgetConfig();

  return (
    <main className="layout poses-layout tab-accent tab-poses">
      {isVisible("poses.saved") && (
        <section className="card">
          <h2>{titleFor("poses.saved", "Saved Poses")}</h2>
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
      )}

      {isVisible("poses.builder") && (
        <section className="card">
          <h2>{titleFor("poses.builder", "Trajectory Builder")}</h2>
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
      )}

      {isVisible("poses.preview") && (
        <section className="card">
          <h2>{titleFor("poses.preview", "Trajectory Preview")}</h2>
          <div className="preview-grid">
            <div className="preview-card">Time graph</div>
            <div className="preview-card">Joint interpolation curves</div>
            <div className="preview-card">Cartesian preview</div>
          </div>
          {/* TODO(backend): merge Courbes tab into previews */}
        </section>
      )}
    </main>
  );
}
