# Plan 4.1: Generic Energy Graphing and Gravity Diagram History Summary

## What was done
- Defined and exported the `EnergyStatePoint` interface in `GraphModule.ts` to represent the generic coordinate, velocity, and energy state points.
- Refactored `GraphModule.draw()` signature to accept `EnergyStatePoint[]` instead of SHM-specific states, allowing it to plot kinematics and energy curves for both SHM and Gravity diagrams.
- Imported `EnergyStatePoint` in `GravityDiagram.ts`.
- Declared and maintained a `history` array of type `EnergyStatePoint[]` in `GravityDiagram.ts`.
- Updated `resetState()` to clear `history` to handle resets properly.
- Added elapsed time progression (`this.t += dt`) to the Two-Body simulation step.
- Implemented real-time kinetic, potential, and total energy calculations at the end of `step(dt)` for Keplerian, Two-Body, and Escape velocity launcher modes, pushing them to `history` and capping the array length at 200 elements.

## Verification
- Verified by running `npx tsc --noEmit` which compiled successfully with no type errors.
