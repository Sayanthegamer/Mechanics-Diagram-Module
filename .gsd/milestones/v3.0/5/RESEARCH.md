---
phase: 5
level: 1
researched_at: 2026-06-08
---

# Phase 5 Research

## Questions Investigated
1. **Memory Growth & Trail Capping**: Are all trajectory trails and simulation history arrays capped to prevent memory leakages?
2. **Build Integrity and Warnings**: Do strict type-checks and production bundling pass without warnings or errors?
3. **Resize / Layout Robustness**: Does dynamic resizing of the viewport/canvas preserve grid rendering, scaling, and trails properly?

## Findings

### 1. Memory and Capping Analysis
All diagrams maintain fixed bounds for their trail tracking and historical logs:
- **Gravity Diagrams**:
  - Two-body trails: Capped at 500 coordinates.
  - Escape launcher trail: Capped at 400 coordinates.
  - Real-time energy graph history: Capped at 200 elements.
- **SHM, Fluids, & FBD Diagrams**:
  - All history arrays use a dedicated `.shift()` check against their maximum bounds (`maxHistoryLen`, `maxHistory`).

**Recommendation**: The current capping limits are highly optimized for a 60fps rendering context. No changes are needed here.

### 2. Type Checking and Build Verification
Running strict compilation checks confirms there are no compilation warnings or errors.
- `npx tsc --noEmit` returns success.
- `npm run build` bundles all 14 TS/CSS modules cleanly.

### 3. Layout and Resize Robustness
The dynamic layout handles resizes smoothly via `resize()` calls and `checkResize()` inside `PhysicsCanvas` and `GraphModule`. On resizing, high-DPI scaling checks ensure that canvases adjust their internal resolution matching their viewport bounding rect.

## Decisions Made
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Verification Tooling | Single target check | A standard pre-commit verification checking both TS compilation and Vite build ensures code integrity. |
| Resize optimization | Passive resize listener | Canvases check bounds periodically / on window resize to update layout dynamically without resetting active trajectories. |

## Patterns to Follow
- Keep history updates tightly integrated at the end of simulation physics step iterations.
- Rely on custom coordinate mappings (`toScreen` / `toPhysics`) from `PhysicsCanvas` instead of hardcoding raw pixel values.

## Anti-Patterns to Avoid
- Avoid growing history lists unboundedly without capping checks.
- Do not call `resetState` automatically during a passive window resize event, as that would clear the user's active trails prematurely.

## Risks
- **Performance degradation on low-end hardware**: If multiple orbits are simulated with extensive rendering steps.
  - *Mitigation*: Ensure canvas rendering loops only run when the preset tab is active.
