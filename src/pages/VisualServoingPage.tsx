import * as Slider from "@radix-ui/react-slider";

import { useWidgetConfig } from "../hooks/useWidgetConfig";

export function VisualServoingPage() {
  const { isVisible, titleFor } = useWidgetConfig();

  return (
    <main className="layout servo-layout">
      {isVisible("servo.controls") && (
        <section className="card">
          <h2>{titleFor("servo.controls", "Visual Servoing")}</h2>
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
      )}

      {isVisible("servo.visuals") && (
        <section className="card">
          <h2>{titleFor("servo.visuals", "Live View")}</h2>
          <div className="servo-visuals">
            <div className="preview-card">Live camera</div>
            <div className="preview-card">Target overlay</div>
            <div className="preview-card">Error vector visualization</div>
          </div>
          {/* TODO(backend): stream camera + overlays + error vector */}
        </section>
      )}
    </main>
  );
}
