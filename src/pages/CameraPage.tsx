import * as Slider from "@radix-ui/react-slider";

import { useUiStore } from "../store/uiStore";
import { useWidgetConfig } from "../hooks/useWidgetConfig";

export function CameraPage() {
  const cameraStreamUrl = useUiStore((s) => s.cameraStreamUrl);
  const setCameraStreamUrl = useUiStore((s) => s.setCameraStreamUrl);
  const { isVisible, titleFor } = useWidgetConfig();

  return (
    <main className="layout camera-layout tab-accent tab-camera">
      {isVisible("camera.feed") && (
        <section className="card camera-feed">
          <h2>{titleFor("camera.feed", "Camera")}</h2>
          <div className="stream-card camera-stream">
            <div className="stream-placeholder">Camera feed placeholder</div>
          </div>
        </section>
      )}
      {isVisible("camera.settings") && (
        <section className="card camera-side">
          <h2>{titleFor("camera.settings", "Camera Settings")}</h2>
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
      )}
      {isVisible("camera.actions") && (
        <section className="card camera-bottom">
          <h2>{titleFor("camera.actions", "Actions")}</h2>
          <div className="camera-actions">
            <button className="header-button">Snapshot</button>
            <button className="header-button">Record</button>
            <button className="header-button">Overlay</button>
          </div>
        </section>
      )}
    </main>
  );
}
