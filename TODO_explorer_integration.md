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

### Phase 1 - Branch prep
- [x] Verify/switch to feat branch in `extender_ui`.
- [x] Verify/switch to feat branch in `input_interfaces`.
- [x] Verify/switch to feat branch in `apps-petanque`.

### Phase 2 - Tablet explorer mapping
- [ ] Add tablet mapping config for explorer (axis/sign behavior aligned with joystick explorer mapping).
- [ ] Apply mapping in tablet backend command conversion path.
- [ ] Validate teleop motion in sim (`cartesian_velocity` launch + backend + UI).

### Phase 3 (Bonus) - Input arbitration: physical joystick vs tablet
- [ ] Define ownership strategy (target: fluid operator interaction, safe behavior).
- [ ] Implement minimal arbitration guard (single active source or timed lease).
- [ ] Expose/indicate active source state for operator clarity.
- [ ] Validate concurrent input behavior in RViz.

### Phase 4 - Backend state-machine bridge
- [ ] Extend tablet backend WS contract for state-machine commands.
- [ ] Publish `std_msgs/String` to `/petanque_state_machine/change_state`.
- [ ] Allow values: `teleop`, `activate_throw`, `go_to_start`, `throw` (optionally `stop`).

### Phase 5 - UI petanque command wiring
- [ ] Rewire petanque action buttons to send state-machine commands.
- [ ] Remove/avoid direct throw-service semantics from UI layer.

### Phase 6 - Petanque runtime app (2 pages)
- [ ] Configure dedicated app with `default_control` + `petanque`.
- [ ] Set home screen to `default_control`.
- [ ] Verify runtime navigation between both pages.

### Phase 7 - Speed wiring
- [ ] Ensure max-velocity widget affects effective teleop output.
- [ ] Validate scaling feel in sim.

### Phase 8 - Single-command developer launcher
- [ ] Add a standard local launcher script/target for ROS launch + backend + UI.
- [ ] Document usage briefly.

## Validation Gates
- [ ] Gate A: teleop mapping correctness (RViz + sim).
- [ ] Gate B: state-machine command path from UI.
- [ ] Gate C: full petanque interaction flow.
- [ ] Gate D: launcher workflow.

## Iteration Log

### Iteration 1
- Status: Done (Phase 1 completed)
- What changed: Verified branches `feat-canvas-design` (`extender_ui`), `feat/tablet-interface` (`input_interfaces`), created and switched to `feat-petanque-state-machine-integration` (`apps-petanque`).
- RViz test result: N/A (branch prep only).
- Notes: Ready to start Phase 2.

### Iteration 2
- Status:
- What changed:
- RViz test result:
- Notes:

### Iteration 3
- Status:
- What changed:
- RViz test result:
- Notes:
