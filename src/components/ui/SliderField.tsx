import * as Slider from "@radix-ui/react-slider";

type SliderFieldProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
};

export function SliderField({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  className,
}: SliderFieldProps) {
  return (
    <div className={`axis-row ${className ?? ""}`.trim()}>
      <label>{label}</label>
      <Slider.Root
        className="slider"
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => onChange(v[0] ?? 0)}
      >
        <Slider.Track className="slider-track">
          <Slider.Range className="slider-range" />
        </Slider.Track>
        <Slider.Thumb className="slider-thumb" />
      </Slider.Root>
    </div>
  );
}
