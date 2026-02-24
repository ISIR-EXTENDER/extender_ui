# Extender UI Architecture

## Scope
This document describes the current frontend architecture for `extender_ui`, with emphasis on the Canvas Designer and runtime application pages.

## High-Level Structure
- `src/app/`: app shell, route parsing, application metadata.
- `src/pages/`: page-level containers (`HomePage`, `ControlsPage`, `ApplicationPage`).
- `src/components/widgets/`: widget model, renderer, presets, persistence helpers.
- `src/store/`: Zustand stores for teleop and UI-level state.
- `src/services/`: transport clients (WebSocket).
- `src/pages/controls/`: extracted ControlsPage-specific logic modules.

## Runtime vs Designer
- Runtime (`ApplicationPage`):
  - Reads saved screen configurations.
  - Renders widgets in non-edit mode.
  - Applies runtime canvas mode (`left`, `center`, `fit`).
- Designer (`ControlsPage`):
  - Edits widget layout and properties.
  - Persists screen configurations.
  - Provides undo/redo history and canvas preset operations.

## Canvas Designer Data Flow
1. Screen config is loaded from local storage.
2. Widget/canvas edits mutate local page state.
3. History hook captures snapshots and supports undo/redo.
4. Save operation writes back to persisted configurations.

Related modules:
- `src/pages/ControlsPage.tsx`
- `src/pages/controls/useCanvasHistory.ts`
- `src/pages/controls/canvasPresetResizing.ts`
- `src/components/widgets/configurations.ts`

## State Ownership
- `useTeleopStore`: joystick/teleop live values and websocket status.
- `useUiStore`: focus mode, theme, stream URLs, global UI controls.
- `ControlsPage` local state: widget layout and designer session state.

## Key Architectural Decisions
- Keep widget persistence format close to runtime model for direct reuse.
- Keep canvas-resize math as pure functions (`canvasPresetResizing.ts`) for easier testing.
- Keep history management isolated in a hook (`useCanvasHistory.ts`) to shrink page complexity.

## Known Debt
- `ControlsPage.tsx` is still large and should be split further:
  - widget mutation handlers,
  - inspector controls,
  - canvas event handling.
- Legacy widget-store path exists under `src/store/widgetsStore.ts` and `src/components/widgets/WidgetCanvas.tsx`.
  It is not the primary path for current designer/runtime flow and should be formally deprecated or integrated.
- Current lint baseline allows several hook-pattern warnings while migration is in progress.

## Recommended Next Refactors
- Extract `useControlsSelection` (selected widget and navigation-bar helper state).
- Extract `useControlsPersistence` (load/save/delete/sync handlers).
- Extract `renderCanvasWidget` to a dedicated component factory.
- Document and retire legacy widget-store path if no longer used.
