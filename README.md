# Extender UI — Tablet Teleoperation Console

This is a touch-first teleoperation UI for the Extender robot system. It is designed for a tablet, supports focus mode, and separates tasks across tabs so each answers a single operator question.

## Project Docs
- Architecture: `docs/ARCHITECTURE.md`
- Contributing guide: `docs/CONTRIBUTING.md`

## Architecture Overview

- Frontend: React + TypeScript (Vite) for fast UI iteration.
- State: Zustand store for teleop input state.
- Transport: WebSocket served by the ROS2 tablet_interface node (rclpy) that publishes teleop_cmd and state updates.
- Rendering: Lightweight cards, two joysticks, and responsive layouts for large touch targets.

### Data Flow

1. User gestures update joystick and buttons (Z/RZ, mode).
2. UI sends teleop_cmd messages over WebSocket at a fixed rate + on changes.
3. The tablet_interface node validates + scales commands, then publishes `/teleop_cmd` (ROS2).
4. UI listens for state messages and renders live telemetry (watchdog, speed, pose, etc.).

## Tabs (What each tab answers)

1. Controls — How do I move?
  - Motion controls (translation + rotation joysticks).
2. Live Teleop — What is happening while I move?
  - Live teleop dashboard + RViz preview.
3. Articular — How do I position joints?
  - Joint sliders with limits, torque display, and send/sync actions.
  - RViz live + joint mini plots on the right.
4. Poses & Trajectories — How do I replay motion?
  - Saved poses list, trajectory builder, and preview panels (graphs, interpolation, Cartesian preview).
5. Pétanque — Use-case optimized interface.
  - Game status, actions, and vision/trajectory cards.
6. Camera — What do I see?
  - Central feed, camera settings side panel, and recording controls.
7. Visual Servoing — How do I servo to a target?
  - Target selection, enable toggle, PID, and live visual overlays.
8. Curves — What do the signals look like?
  - Live plots for linear/angular velocity, joint velocities, error norms, and gains.
9. Logs / Rosbags — What did I record?
  - Start/stop capture, bag naming, and session metrics.
10. Configuration — How do I configure?
  - Advanced settings (gains, filters, frames, inversion, robot type, deadman).
11. Debug — What is happening internally?
   - Raw streams, controller state, latency, and watchdog diagnostics.

## Libraries Used (and why)

- React + TypeScript: Strong typing for complex UI state and predictable component behavior.
- Vite: Fast development server and modern build pipeline for quick iteration.
- Zustand: Minimal, fast global state management for teleop inputs.
- Radix Slider: Accessible, touch-friendly sliders for gains and joint controls.
- NippleJS: Mature, reliable joystick behavior for touch screens.
- Recharts: Lightweight charting for live plots; good tradeoff of features vs. bundle size.

## Backend (tablet_interface) Notes

- **ROS2 rclpy Node**: The tablet_interface package hosts the WebSocket server and publishes `/teleop_cmd`.
- **FastAPI + Uvicorn**: Lightweight async WebSocket server embedded in the node.
- **Pydantic**: Validates incoming WS payloads.
- **SafetyGate**: Enforces watchdog and max velocity limits before publishing.
- **Default WS endpoint**: ws://<bind_host>:8765/ws/control (configurable in tablet_interface parameters).

## TODOs (Backend Wiring)

- Wire all buttons/sliders to ROS2 services/actions/topics:
  - Gripper actions and parameters
  - Pose management (add/rename/delete/move)
  - Trajectory builder + execution
  - Joint control publish/feedback
  - Camera controls + overlay toggle
  - Rosbag start/stop + list + download
  - Visual servoing target selection + PID

## Notes

- The UI is touch-optimized and should not require scrolling on the target tablet resolution.
- Focus mode displays only the motion panel for low-distraction teleop.

## Development

- npm install
- npm run dev


