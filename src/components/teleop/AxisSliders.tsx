import * as Slider from "@radix-ui/react-slider";

type ZSliderProps = {
  value: number;
  onChange: (value: number) => void;
};

type RzSliderProps = {
  value: number;
  onChange: (value: number) => void;
};

export function ZSlider({ value, onChange }: ZSliderProps) {
  return (
    <div className="z-vertical">
      <label className="z-label">Z Velocity</label>
      <Slider.Root
        className="slider vertical z-slider"
        orientation="vertical"
        min={-1}
        max={1}
        step={0.01}
        value={[value]}
        onValueChange={(v) => onChange(v[0] ?? 0)}
      >
        <Slider.Track className="slider-track">
          <Slider.Range className="slider-range" />
        </Slider.Track>
        <Slider.Thumb className="slider-thumb" />
      </Slider.Root>
      <div className="z-readout">z: {value.toFixed(2)}</div>
    </div>
  );
}

export function RzSlider({ value, onChange }: RzSliderProps) {
  return (
    <div className="rz-top">
      <label className="z-label">RZ Velocity</label>
      <Slider.Root
        className="slider rz-slider"
        min={-1}
        max={1}
        step={0.01}
        value={[value]}
        onValueChange={(v) => onChange(v[0] ?? 0)}
      >
        <Slider.Track className="slider-track">
          <Slider.Range className="slider-range" />
        </Slider.Track>
        <Slider.Thumb className="slider-thumb" />
      </Slider.Root>
      <div className="z-readout">rz: {value.toFixed(2)}</div>
    </div>
  );
}
