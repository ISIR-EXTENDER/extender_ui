# Contributing to Extender UI

## Commit Convention
Use Conventional Commits:
- `feat(scope): ...`
- `fix(scope): ...`
- `refactor(scope): ...`
- `chore(scope): ...`
- `docs(scope): ...`
- `test(scope): ...`

Examples:
- `feat(canvas): add manual widget resize action`
- `refactor(controls): extract history hook`
- `fix(router): normalize trailing slash handling`

## Pull Request Checklist
- Keep change scope narrow and coherent.
- Run local checks:
  - `npm run build`
  - `npm run lint`
- Include UI screenshots/GIF for visible changes.
- Add or update docs for architectural changes.

## Testing Strategy
Priority order:
1. Pure logic tests (fast and deterministic).
2. Component behavior tests.
3. End-to-end workflow tests.

High-value first targets:
- `src/pages/controls/canvasPresetResizing.ts`
- `src/components/widgets/canvasSettings.ts`
- `src/app/router.ts`
- `src/pages/controls/useCanvasHistory.ts` (behavior-focused tests)

## Coverage Policy
Coverage should be used as a quality signal, not a vanity metric.
- Enforce coverage for changed lines in PRs.
- Require higher coverage for critical pure modules.
- Avoid blocking contributors on global percentage until baseline tests exist.

## Architecture Expectations
- Prefer pure functions for math/transforms and serialization.
- Keep page files thin by extracting hooks/utilities.
- Preserve runtime-designer parity when changing widget models.
- Avoid introducing new `any` in TypeScript code.

## Current Lint Baseline
The project currently allows some hook-pattern warnings while legacy code is migrated.
Treat warnings as migration backlog, not as permanent acceptance.
