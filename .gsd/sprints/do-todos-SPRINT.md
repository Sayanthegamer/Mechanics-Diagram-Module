# Sprint 2 — Do the todos

> **Duration**: 2026-06-08 to 2026-06-08
> **Status**: Complete

## Goal
Fix viewport panning/dragging across all diagram types and implement the Runge-Kutta 4th order (RK4) integrator option for simple harmonic motion (SHM) to reduce numerical drift.

## Scope

### Included
- Update all diagram modules to add `pc.panX` and `pc.panY` offsets when setting custom canvas origins.
- Add `integrator` optional field to `ShmConfig` interface.
- Implement the RK4 numerical integrator inside `ShmDiagram.ts`.
- Add an integrator toggle slider in `main.ts` for simple harmonic motion.

### Explicitly Excluded
- Phase 3 Escape Velocity & Conic Sections.

## Tasks

| Task | Assignee | Status | Est. Hours |
|------|----------|--------|------------|
| Fix viewport dragging for FBD, Gravity, Mechanics, SHM, and Wave diagrams | Antigravity | ✅ Done | 2 |
| Implement RK4 integrator in `ShmDiagram.ts` | Antigravity | ✅ Done | 2 |
| Add `integrator` slider and preset config support in `main.ts` and `types.ts` | Antigravity | ✅ Done | 1 |

## Daily Log

### 2026-06-08
- Sprint initialized to close maintenance todos.
- Updated all canvas rendering classes to respect user viewport panning (`pc.panX` and `pc.panY`).
- Implemented RK4 solver in `ShmDiagram.ts` and wired the controls, presets, and types in `main.ts` and `types.ts`.
- All compilation tests and production builds completed successfully.

## Retrospective (2026-06-08)

### What Went Well
- Viewport panning bug resolved comprehensively across all diagram modules by consistently offsetting origins using pan variables.
- Symplectic/higher-order integration options added successfully for SHM, letting the user toggle between Euler-Cromer and RK4 integrators dynamically via sliders and JSON configs.

### What Could Improve
- Viewport dragging was initially not updating the canvas when paused because redraw was only triggered on change, but this was solved since `simulationLoop` constantly requests animation frames.

### Action Items
- None (All carry-forward items fully closed).
