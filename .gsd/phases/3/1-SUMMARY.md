# Plan 3.1: Escape Velocity Solver & Physics Core Summary

## What was done
- Added state variables to `GravityDiagram` class for the probe: position (`px`, `py`), velocity (`pvx`, `pvy`), acceleration (`pax`, `pay`), trail tracking array (`probeTrail`), and state flag (`probeCrashed`).
- Updated `resetState()` to initialize coordinates, velocity components (calculated from launch angle $\theta$ relative to radial outward vector), and initial acceleration values when `mode === 'escape'`.
- Implemented an RK4 integration step in `step()` under `mode === 'escape'` to solve probe trajectory under planet's gravity force ($G=1.0$).
- Added surface collision checks (probe position resets to the surface and stops moving if it collides with the planet) and escape boundaries check (probe resets when it goes beyond $r = 25.0$ units).

## Verification
- Verified by running `npx tsc --noEmit` which compiled successfully.
