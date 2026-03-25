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
2. the UI sends websocket messages such as `teleop_cmd`, `ui_button`, `ui_scalar`, or `camera_frame`
3. `tablet_interface` republishes those messages into ROS 2
4. websocket state and events come back to the UI for live feedback

## Apps

- `SandboxV0.0`: generic teleop/sandbox app used for experiments
- pétanque screens: preserved as a compatibility app family during the refactor

The rule going forward is:

- keep the core generic
- put app-specific behavior in `src/apps/<app_name>`

## Camera direction

The UI can display streams and capture frames from stream widgets. Captured frames can now be sent to backend as `camera_frame`, so camera data can become ROS topics and later be reused by perception or visual-servoing nodes.

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
