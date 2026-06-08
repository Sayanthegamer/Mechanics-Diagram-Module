# Todo List

This file tracks outstanding feature requests, optimizations, and technical debt.

## Future Phase 4 Features
- [x] **Circular Motion**: Add centripetal force visualization preset (ball on string, orbit, loop-the-loop). (Done in Phase 4)
- [x] **Interactive Drag Handles**: Allow users to click and drag vectors or blocks directly on the canvas to modify underlying parameters. (Done in Phase 4)
- [x] **Keyboard Shortcuts**:
  - `Space`: Toggle play/pause
  - `R`: Reset active simulation
  - `[` / `]`: Cycle presets (Done in Phase 4)
- [x] **Mobile/Touch Support**: Better touch-event handlers for parameter dragging. (Done in Phase 4)

## Maintenance & Refactoring
- [x] **RK4 Integrator**: Propose Runge-Kutta 4th order solver option for systems with heavy damping or stiff springs to reduce numerical energy drift. (Done in Sprint 2)
- [x] **Panning/Scrolling**: Implement simulation space scrolling and repositioning of the view of the simulation (allow users to drag/pan the canvas viewport). (Done in Phase 7)
- [x] fix viewport dragging for all `medium` — 2026-06-08 (Done in Sprint 2)
