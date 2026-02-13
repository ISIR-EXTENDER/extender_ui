import * as Slider from "@radix-ui/react-slider";

import { useTeleopStore } from "../store/teleopStore";
import { useUiStore } from "../store/uiStore";
import { useWidgetConfig } from "../hooks/useWidgetConfig";

export function ConfigurationsPage() {
  const themeMode = useUiStore((s) => s.themeMode);
  const setThemeMode = useUiStore((s) => s.setThemeMode);
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
  const maxVelocity = useTeleopStore((s) => s.maxVelocity);
  const { isVisible, titleFor } = useWidgetConfig();

  return (
    <main className="layout tab-accent tab-config">
      {isVisible("config.appearance") && (
        <section className="card">
          <h2>{titleFor("config.appearance", "Appearance")}</h2>
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
      )}

      {isVisible("config.advanced") && (
        <section className="card">
          <h2>{titleFor("config.advanced", "Advanced Configuration")}</h2>
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
      )}

      {isVisible("config.axis") && (
        <section className="card">
          <h2>{titleFor("config.axis", "Axis Inversion")}</h2>
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
      )}
    </main>
  );
}
