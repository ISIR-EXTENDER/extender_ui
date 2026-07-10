# Extender UI

`extender_ui` is the tablet frontend for Extender robots. It is used for teleoperation, app-specific workflows such as pétanque, and sandbox experiments that researchers can change without rewriting the whole UI.

## Architecture

The UI now follows a simple split:

- generic core: screens, widgets, storage, websocket client, runtime orchestration
- app modules: behavior that is specific to one app family
- backend contract: generic websocket messages handled by `tablet_interface`

Current app modules:

- `src/apps/petanque`
- `src/apps/sandbox`

Important runtime folders:

- `src/app/runtime`: generic runtime/plugin system
- `src/pages`: page orchestration
- `src/components/widgets`: reusable widget rendering

## Data flow

1. the user interacts with widgets
2. the UI sends websocket messages such as `teleop_cmd`, `ui_button`, `ui_scalar`, `ui_typed`, or `camera_frame`
3. `tablet_interface` republishes those messages into ROS 2
4. websocket state and events come back to the UI for live feedback

## Teleop and Topic Workflow

There are two different notions of "topic" in the tablet UI:

- widget `topic` fields such as `/cmd/joystick` or `/cmd/mode` are mostly UI metadata for the canvas, presets, and readouts.
- ROS topics such as `/teleop_cmd` are published by the backend after it receives websocket commands from the UI.

The normal joystick and mode path is:

1. joystick, slider, and mode widgets update the frontend teleop store in `src/store/teleopStore.ts`
2. the store builds a websocket message with `type: "teleop_cmd"`, the current `mode`, and the scaled `linear` / `angular` axes
3. `tablet_interface` receives that websocket message and republishes it as a ROS 2 `extender_msgs/msg/TeleopCommand`
4. controllers such as `sandbox_controller` consume the ROS topic `/teleop_cmd`

So for joystick based teleop, changing a widget field from `/cmd/joystick` to another value does not change the ROS topic. The ROS output remains the backend `teleop_cmd` bridge unless the backend contract changes.

The snake screen follows this split:

- the 2D joystick uses the existing `teleop_cmd` websocket flow, ending on ROS `/teleop_cmd`
- the green mode button cycles the frontend mode between `B1` and `B2`
- the orange hold button is independent from teleop and sends a typed websocket message through `ui_typed`

`B1` and `B2` do not change the joystick velocity computed by the frontend. The same joystick velocity is sent in both modes; only the `mode` field changes (`B1` -> `mode: 0`, `B2` -> `mode: 3`). The snake control algorithm can then interpret those modes on the backend side.

For typed ROS widgets, the widget topic is the real ROS target. The momentary snake button sends:

```text
press   -> ui_typed -> /snake_control/enable std_msgs/msg/Bool {data: true}
release -> ui_typed -> /snake_control/enable std_msgs/msg/Bool {data: false}
```

Use this path when a screen needs to publish a small standalone ROS message that should not be part of the continuous `teleop_cmd` stream.

## ROS Message Widgets

The canvas includes generic ROS publishing widgets for simple hardware and controller integrations:

- `ROS Message Toggle`: publishes one typed ROS payload for ON and another for OFF.
- `Momentary ROS Message`: publishes a typed ROS payload when pressed and another when released.

The momentary widget is used by the default `snake_control` screen for the snake hold button. Its default contract is:

```text
topic: /snake_control/enable
message_type: std_msgs/msg/Bool
pressed payload: {data: true}
released payload: {data: false}
```

At runtime it sends `ui_typed` websocket messages, so the existing `tablet_interface` typed-message bridge republishes the configured ROS message without needing a custom websocket message type.

The same `snake_control` screen keeps the 2D joystick on the existing `teleop_cmd` websocket flow and uses the regular mode button as a two-state `B1` / `B2` toggle.

## Widget Interaction Notes

Interactive widgets should compute pointer positions from the rendered DOM rectangle with `getBoundingClientRect()`. This keeps controls aligned when the canvas is zoomed, resized, or rendered in fit mode.

The joystick is implemented with pointer events directly in `src/components/teleop/NippleJoystick.tsx`. It clamps motion to the circular base, applies the configured deadzone before publishing, and visually moves the knob to the edge at saturation. The faint horizontal and vertical guide lines become brighter when the stick is aligned with one main axis, which helps users drive only `x/-x` or only `y/-y`.

The max velocity widget uses the same pointer-position rule. Its value source depends on the configured topic:

- known teleop configuration topics, such as `/cmd/max_velocity`, read and write the shared teleop store.
- custom topics keep an independent per-widget value in the controls page, so several max velocity widgets no longer force each other to the same value.

When a screen is saved or synchronized to a folder, `updatedAt` is preserved if the screen content is unchanged. This avoids timestamp-only JSON diffs when no widget, pose, or canvas setting actually changed.

## Apps

- `SandboxV0.0`: generic teleop/sandbox app used for experiments
- pétanque screens: preserved as a compatibility app family during the refactor

The rule going forward is:

- keep the core generic
- put app-specific behavior in `src/apps/<app_name>`

## Camera direction

The UI can display streams and capture frames from stream widgets. Captured frames can now be sent to backend as `camera_frame`, so camera data can become ROS topics and later be reused by perception or visual-servoing nodes.

## Visual Servoing Monitor

The sandbox visual-servoing flow is split across two screens:

- `control_panel`: a compact daily-operation screen for Sandbox with webcam preview, Cartesian velocity controls, max velocity, gripper, and visual-servoing save/on/off controls.
- `visual_servoing`: camera/RViz preview plus the visual-servoing toggle and save-tag action.
- `visual_servoing_monitor`: a dedicated ROS topic monitor for AprilTag detections, velocity command, and servo error snapshots.

`control_panel` is based on Robin's `default_control_with_camera` workflow. It keeps only the useful daily controls: `/cmd/joystick`, `/cmd/joystick_rxry`, `/cmd/joystick_z`, `/cmd/joystick_rz`, `/cmd/max_velocity`, `/cmd/gripper`, `/ui/visual_servoing/on`, and `/ui/visual_servoing/save`. The unused snake slider and generic ROS test toggle are intentionally left out.

The monitor uses the generic backend `topic_subscribe` / `topic_snapshot` websocket flow. It is meant for small diagnostic ROS messages, not for video frames; webcam preview stays on the stream widget path.

Topic monitor widgets support:

- a configurable stale threshold, so topics move from live to stale when snapshots stop updating.
- visible backend subscription events, including partial failures.
- local warnings for `sensor_msgs/msg/Image` and `sensor_msgs/msg/CompressedImage`; use stream widgets for those.
- adding, editing, and removing monitored topics from the editor inspector.

## Development

```bash
npm install
npm run build
npm run test:coverage
npm run test:e2e
```

## Contributing

- prefer generic websocket messages over app-specific transport
- keep pétanque-specific logic in `src/apps/petanque`
- keep sandbox-specific logic in `src/apps/sandbox`
- do not add new app behavior directly into the generic runtime/page layer unless it truly applies to every app
