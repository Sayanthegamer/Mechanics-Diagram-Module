# Sprint 2 — Do the todos

> **Duration**: 2026-06-08 to 2026-06-08
> **Status**: In Progress

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
| Fix viewport dragging for FBD, Gravity, Mechanics, SHM, and Wave diagrams | Antigravity | ⬜ Todo | 2 |
| Implement RK4 integrator in `ShmDiagram.ts` | Antigravity | ⬜ Todo | 2 |
| Add `integrator` slider and preset config support in `main.ts` and `types.ts` | Antigravity | ⬜ Todo | 1 |

## Daily Log

### 2026-06-08
- Sprint initialized to close maintenance todos.
