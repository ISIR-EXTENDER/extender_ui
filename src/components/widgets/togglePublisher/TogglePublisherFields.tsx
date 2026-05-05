import type { TogglePublisherWidget } from "../widgetTypes";

type TogglePublisherFieldsProps = {
  widget: TogglePublisherWidget;
  onChange: (next: TogglePublisherWidget) => void;
};

export function TogglePublisherFields({
  widget,
  onChange,
}: TogglePublisherFieldsProps) {
  return (
    <>
      <div className="controls-property-title">Toggle Publisher</div>
      <div className="controls-hint">
        Publishes ON/OFF through the configured ROS topic using a simple scalar or boolean value.
      </div>
      <label className="controls-field">
        <span>Output Topic</span>
        <input
          className="editor-input"
          value={widget.topic}
          onChange={(event) =>
            onChange({
              ...widget,
              topic: event.target.value,
            })
          }
        />
      </label>
      <label className="controls-field">
        <span>Output Mode</span>
        <select
          className="editor-input"
          value={widget.outputMode}
          onChange={(event) =>
            onChange({
              ...widget,
              outputMode: event.target.value === "boolean" ? "boolean" : "numeric",
            })
          }
        >
          <option value="numeric">numeric 0 / 1</option>
          <option value="boolean">boolean true / false</option>
        </select>
      </label>
    </>
  );
}
