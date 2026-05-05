import type { RosMessageToggleWidget } from "../widgetTypes";
import {
  buildRosMessageToggleCliExample,
  COMMON_ROS_MESSAGE_TYPES,
  findMatchingRosMessageTogglePreset,
  ROS_MESSAGE_TOGGLE_PRESETS,
} from "./model";

type RosMessageToggleFieldsProps = {
  widget: RosMessageToggleWidget;
  onChange: (next: RosMessageToggleWidget) => void;
};

const MESSAGE_TYPE_DATALIST_ID = "ros-message-toggle-type-options";

export function RosMessageToggleFields({
  widget,
  onChange,
}: RosMessageToggleFieldsProps) {
  const matchingPreset = findMatchingRosMessageTogglePreset(widget);
  const selectedPresetValue =
    widget.presetId === "custom" ? "" : widget.presetId ?? matchingPreset?.id ?? "";

  return (
    <>
      <div className="controls-property-title">ROS Message Toggle</div>
      <div className="controls-hint">
        Configure a topic, a ROS message type, and the exact ON/OFF message body using ROS CLI-style syntax.
      </div>
      <label className="controls-field">
        <span>Quick Start Template</span>
        <select
          className="editor-input"
          value={selectedPresetValue}
          onChange={(event) => {
            const selectedPreset = ROS_MESSAGE_TOGGLE_PRESETS.find(
              (preset) => preset.id === event.target.value
            );
            if (!selectedPreset) {
              onChange({
                ...widget,
                presetId: "custom",
              });
              return;
            }

            onChange({
              ...widget,
              presetId: selectedPreset.id,
              messageType: selectedPreset.messageType,
              onPayload: selectedPreset.onPayload,
              offPayload: selectedPreset.offPayload,
            });
          }}
        >
          <option value="">Custom configuration</option>
          {ROS_MESSAGE_TOGGLE_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
      </label>
      <div className="controls-hint">
        {matchingPreset?.description ??
          "Choose a template to prefill common ROS message types, then adjust the payloads if needed."}
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
        <span>ROS Message Type</span>
        <input
          className="editor-input"
          list={MESSAGE_TYPE_DATALIST_ID}
          value={widget.messageType}
          placeholder="std_msgs/msg/String"
          onChange={(event) =>
            onChange({
              ...widget,
              presetId: "custom",
              messageType: event.target.value,
            })
          }
        />
        <datalist id={MESSAGE_TYPE_DATALIST_ID}>
          {COMMON_ROS_MESSAGE_TYPES.map((messageType) => (
            <option key={messageType} value={messageType} />
          ))}
        </datalist>
      </label>
      <label className="controls-field">
        <span>ON Message Body</span>
        <textarea
          className="editor-input"
          rows={4}
          value={widget.onPayload}
          placeholder="{data: 'activate_throw'}"
          onChange={(event) =>
            onChange({
              ...widget,
              presetId: "custom",
              onPayload: event.target.value,
            })
          }
        />
      </label>
      <label className="controls-field">
        <span>OFF Message Body</span>
        <textarea
          className="editor-input"
          rows={4}
          value={widget.offPayload}
          placeholder="{data: 'teleop'}"
          onChange={(event) =>
            onChange({
              ...widget,
              presetId: "custom",
              offPayload: event.target.value,
            })
          }
        />
      </label>
      <div className="controls-hint">
        Examples: <code>{`{data: 'activate_throw'}`}</code>, <code>{`{data: [13, 1]}`}</code>,{" "}
        <code>{`{x: 0.1, y: 0.0, z: 0.0}`}</code>
      </div>
      <div className="controls-hint">
        CLI preview ON: <code>{buildRosMessageToggleCliExample(widget, "on")}</code>
      </div>
      <div className="controls-hint">
        CLI preview OFF: <code>{buildRosMessageToggleCliExample(widget, "off")}</code>
      </div>
    </>
  );
}
