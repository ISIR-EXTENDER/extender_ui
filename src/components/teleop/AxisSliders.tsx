import * as Slider from "@radix-ui/react-slider";

type LabelAlign = "left" | "center" | "right";

type ZSliderProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  labelAlign?: LabelAlign;
  showLabel?: boolean;
  showReadout?: boolean;
};

type RzSliderProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  labelAlign?: LabelAlign;
  showLabel?: boolean;
  showReadout?: boolean;
};

export function ZSlider({
  value,
  onChange,
  min = -1,
  max = 1,
  step = 0.01,
  label = "Z Velocity",
  labelAlign = "center",
  showLabel = true,
  showReadout = true,
}: ZSliderProps) {
  return (
    <div className={`z-vertical ${showLabel ? "has-label" : ""}`.trim()}>
      {showLabel ? (
        <label className="z-label z-label-vertical" style={{ textAlign: labelAlign, width: "100%" }}>
          {label}
        </label>
      ) : null}
      <div className="z-vertical-main">
        <Slider.Root
          className="slider vertical z-slider"
          orientation="vertical"
          min={min}
          max={max}
          step={step}
          value={[value]}
          onValueChange={(v) => onChange(v[0] ?? 0)}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <Slider.Track className="slider-track">
            <Slider.Range className="slider-range" />
          </Slider.Track>
          <Slider.Thumb className="slider-thumb" />
        </Slider.Root>
        {showReadout ? <div className="z-readout">z: {value.toFixed(2)}</div> : null}
      </div>
    </div>
  );
}

export function RzSlider({
  value,
  onChange,
  min = -1,
  max = 1,
  step = 0.01,
  label = "RZ Velocity",
  labelAlign = "center",
  showLabel = true,
  showReadout = true,
}: RzSliderProps) {
  return (
    <div className="rz-top">
      {showLabel && (
        <label className="z-label" style={{ textAlign: labelAlign, width: "100%" }}>
          {label}
        </label>
      )}
      <Slider.Root
        className="slider rz-slider"
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => onChange(v[0] ?? 0)}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <Slider.Track className="slider-track">
          <Slider.Range className="slider-range" />
        </Slider.Track>
        <Slider.Thumb className="slider-thumb" />
      </Slider.Root>
      {showReadout && <div className="z-readout">rz: {value.toFixed(2)}</div>}
    </div>
  );
}
