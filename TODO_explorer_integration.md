# Explorer Integration TODO

Date: 2026-02-24
Owner: Susana Sanchez Restrepo
Scope: Explorer tablet control + petanque state-machine integration

## Contribution Guidelines
- [x] Before coding, make sure you are on a `feat/*` branch in each repo you touch.
- [ ] Keep changes scoped: do not modify unrelated files.
- [ ] Commit in small, testable steps using conventional commit prefixes (`feat:`, `fix:`, `chore:`, `refactor:`).
- [ ] After each phase, stop and ask for validation before continuing.
- [ ] Every validation must be done with launch + RViz checks.
- [ ] Update this TODO file at every iteration (phase status + test results + notes).
- [ ] Keep user-facing behavior safe and predictable first; optimize second.

## Best Practices
- [ ] Reuse existing architecture and message flows before introducing new abstractions.
- [ ] Prefer explicit contracts for WS payloads and ROS interfaces (topic/type/value constraints).
- [ ] Add clear logs for command flow and safety decisions.
- [ ] Keep backend safety logic centralized (watchdog, clamping, input arbitration).
- [ ] Make UI state obvious to operators (connected/disconnected, active control source, current mode).
- [ ] Document run commands and expected behavior for each new integration point.

## Rules For This Sprint
- [x] Work only on feat branches in each touched repo.
- [ ] Commit iteratively with conventional prefixes (`feat:`, `fix:`, `chore:`, `refactor:`).
- [ ] Stop after each phase for RViz validation before moving forward.

## Phase Plan

### Phase 0 - Preflight launch and architecture baseline
- [x] Install missing runtime package: `ros-humble-yasmin-viewer` (and `ros-humble-yasmin-msgs`).
- [x] Relaunch `petanque_state_machine explorer_petanque_app.launch.py` in sim and confirm `petanque_state_machine` node starts.
- [ ] Resolve petanque controller startup path (`tip_frame/tool_frame = petanque_ball` chain errors) so throw controller configures.
- [ ] Freeze and document GUI <-> ROS interface contract before integration code changes.

### Phase 1 - Branch prep
- [x] Verify/switch to feat branch in `extender_ui`.
- [x] Verify/switch to feat branch in `input_interfaces`.
- [x] Verify/switch to feat branch in `apps-petanque`.

### Phase 2 - Tablet explorer mapping
- [x] Add tablet mapping config for explorer (axis/sign behavior aligned with joystick explorer mapping).
- [x] Apply mapping in tablet backend command conversion path.
- [ ] Validate teleop motion in sim (`cartesian_velocity` launch + backend + UI).

### Phase 3 (Bonus) - Input arbitration: physical joystick vs tablet
- [ ] Define ownership strategy (target: fluid operator interaction, safe behavior).
- [ ] Implement minimal arbitration guard (single active source or timed lease).
- [ ] Expose/indicate active source state for operator clarity.
- [ ] Validate concurrent input behavior in RViz.

### Phase 4 - Backend state-machine bridge
- [x] Extend tablet backend WS contract for state-machine commands.
- [x] Publish `std_msgs/String` to `/petanque_state_machine/change_state`.
- [x] Allow values: `teleop`, `activate_throw`, `go_to_start`, `throw` (optionally `stop`).

### Phase 5 - UI petanque command wiring
- [x] Rewire petanque action buttons to send state-machine commands.
- [x] Remove/avoid direct throw-service semantics from UI layer.

### Phase 6 - Petanque runtime app (2 pages)
- [ ] Configure dedicated app with `default_control` + `petanque`.
- [ ] Set home screen to `default_control`.
- [ ] Verify runtime navigation between both pages.

### Phase 7 - Speed wiring
- [x] Map petanque speed widget to `/petanque_throw` runtime parameter `total_duration`.
- [ ] Validate speed effect in sim (throw timing changes while keeping stable state transitions).

### Phase 8 - Single-command developer launcher
- [ ] Add a standard local launcher script/target for ROS launch + backend + UI.
- [ ] Document usage briefly.

## Validation Gates
- [ ] Gate 0: petanque launch baseline healthy (state machine + controllers up in sim).
- [ ] Gate A: teleop mapping correctness (RViz + sim).
- [ ] Gate B: state-machine command path from UI.
- [ ] Gate C: full petanque interaction flow.
- [ ] Gate D: launcher workflow.

## Architecture Notes (Baseline)
- State machine command topic from GUI: `/petanque_state_machine/change_state` (`std_msgs/String`).
- Allowed command values: `teleop`, `activate_throw`, `go_to_start`, `throw`, `stop`.
- State machine internally switches controllers via `/controller_manager/switch_controller` (`controller_manager_msgs/srv/SwitchController`).
- Throw services expected once throwing controller is configured:
  - `/petanque_throw/go_to_start` (`std_srvs/srv/Trigger`)
  - `/petanque_throw/start_throw` (`std_srvs/srv/Trigger`)
- Teleop command flow:
  - Tablet UI -> WebSocket `ws://<tablet_interface_host>:8765/ws/control`
  - Tablet backend publishes `/teleop_cmd` (`extender_msgs/msg/TeleopCommand`)
  - `teleop_controller` consumes configured command interfaces.

## Iteration Log

### Iteration 1
- Status: Done (Phase 1 completed)
- What changed: Verified branches `feat-canvas-design` (`extender_ui`), `feat/tablet-interface` (`input_interfaces`), created and switched to `feat-petanque-state-machine-integration` (`apps-petanque`).
- RViz test result: N/A (branch prep only).
- Notes: Ready to start Phase 2.

### Iteration 2
- Status: In progress (Phase 2)
- What changed: Explorer mapping params added in tablet config, backend now remaps + scales vectors via shared helper before publishing, and unit tests were extended (`19 passed`).
- RViz test result:
- Notes:

### Iteration 3
- Status: In progress (Phase 0 preflight)
- What changed:
  - Reproduced launch with `use_simulation:=true use_sim_time:=true gui:=true`.
  - Confirmed first hard failure: `ModuleNotFoundError: No module named 'yasmin_viewer'`.
  - Confirmed installed YASMIN packages: `ros-humble-yasmin`, `ros-humble-yasmin-ros`; missing `ros-humble-yasmin-viewer` and `ros-humble-yasmin-msgs`.
  - After state machine crash, launch continues and reveals additional controller startup failures:
    - `qontrol_explorer`: failed qontrol model (`root_frame=base_link`, `tip_frame=petanque_ball`)
    - `petanque_throw`: failed chain `base_link -> petanque_ball`
- RViz test result: Launch is not yet healthy; simulation starts but petanque path is not operational.
- Notes:
  - Immediate prerequisite before integration: install missing viewer package(s), then re-run launch and address kinematic chain/controller config issue.

### Iteration 4
- Status: In progress (Phase 0 preflight)
- What changed:
  - Re-ran `ros2 launch petanque_state_machine explorer_petanque_app.launch.py use_simulation:=true use_sim_time:=true gui:=true`.
  - Confirmed `petanque_state_machine` no longer crashes and reaches `IDLE` waiting for GUI commands.
  - Remaining failures are now only kinematic chain related:
    - `qontrol_explorer` failed model creation for `tip_frame='petanque_ball'`.
    - `petanque_throw` failed chain `base_link -> petanque_ball`.
- RViz test result: Launch starts and state machine is alive; throwing path still blocked by missing `petanque_ball` frame in robot description.
- Notes:
  - This blocker is external to current scope and expected to disappear once colleague pushes updated robot description.

### Iteration 5
- Status: In progress (Phases 4, 5, 7 implementation done)
- What changed:
  - Backend (`tablet_interface`) now accepts WS `state_cmd` and `petanque_cfg` messages and bridges to ROS:
    - Publishes `std_msgs/String` on `/petanque_state_machine/change_state`.
    - Updates `/petanque_throw` parameter `total_duration` via `/petanque_throw/set_parameters`.
  - Backend keeps compatibility for `ui_button` and forwards it to state-machine bridge when topic matches.
  - UI `petanque` screen replaced with an MVP runtime view:
    - Buttons: `teleop`, `activate_throw`, `go_to_start`, `throw`, `stop`.
    - Throw speed widget mapped to backend `petanque_cfg.total_duration`.
    - RViz panel + runbook + quick nav to `default_control`.
  - Added migration logic so existing local storage with old petanque widgets updates to this new screen.
- RViz test result: Pending user validation in sim launch.
- Notes:
  - Local checks done: frontend build/lint passed, backend WS model/mapping tests passed.
