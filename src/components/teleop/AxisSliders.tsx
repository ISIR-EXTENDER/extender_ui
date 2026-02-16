import * as Slider from "@radix-ui/react-slider";

type ZSliderProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
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
  showLabel = true,
  showReadout = true,
}: ZSliderProps) {
  return (
    <div className="z-vertical">
      {showLabel && <label className="z-label">{label}</label>}
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
      {showReadout && <div className="z-readout">z: {value.toFixed(2)}</div>}
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
  showLabel = true,
  showReadout = true,
}: RzSliderProps) {
  return (
    <div className="rz-top">
      {showLabel && <label className="z-label">{label}</label>}
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
