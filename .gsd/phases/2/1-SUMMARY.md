# Plan 2.1: Piston Movement & Thermodynamic Transitions Summary

## What was done
- Implemented state-transition equations inside `ThermoDiagram.ts` for Isothermal ($T = \text{const}$), Isobaric ($P = \text{const}$), Isochoric ($V = \text{const}$), and Adiabatic ($Q = 0$) processes.
- Capped maximum particle speed to `30.0` units to prevent numerical speed runaway.
- Scaled particle velocities dynamically in `step(dt)` by the factor $\alpha = \sqrt{T_{\text{new}} / T_{\text{old}}}$ to keep simulated kinetic energy in sync with macroscopic thermodynamic states.
- Implemented robust boundary reflections with a coordinate clamping fallback to prevent particle clipping/trapping behind the piston during fast compression.
- Custom-drawn a metallic-textured steel slab piston head at the dynamic right-wall coordinate `xRight` and a horizontal steel shaft/rod extending to the right out of the open casing casing.
- Added animated thermodynamic flame burners (red, orange, yellow flickering gradients with shadow blur glow) and semi-transparent staggered ice blocks (light blue with specular white sheens) representing heat source/sink actions.
- Cylinder casing is now drawn as a U-shaped open-ended casing in piston/kinetic modes, and a closed rectangle casing in diffusion mode.

## Verification
- Verified by running `npm run verify` which completes successfully with no warnings or errors.
