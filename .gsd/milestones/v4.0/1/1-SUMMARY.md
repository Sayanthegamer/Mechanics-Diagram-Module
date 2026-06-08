# Plan 1.1: Gas Particle Physics & Collision Core Summary

## What was done
- Extended the shared configuration schemas in `src/lib/types.ts` to support the new `'thermo'` diagram type, including `ThermoConfig` fields for temperature, particle count, volume, heat input, and animation modes.
- Built the core molecular dynamics class `ThermoDiagram` inside `src/lib/diagrams/ThermoDiagram.ts` following GSD diagram APIs.
- Implemented bi-disperse gas species: heavy/red Species A ($m=4.0$, $r=0.2$) and light/blue Species B ($m=1.0$, $r=0.12$).
- Implemented high-performance Verlet position updates and elastic wall reflections, accumulating momentum transfers to compute real-time smoothed Pressure.
- Implemented vector elastic pairwise particle collisions and resolved particle overlap clipping by shifting colliding pairs along the collision normal.
- Designed a sliding vertical divider barrier at $x = (x_{\text{left}} + x_{\text{right}}) / 2$ for the diffusion simulation.

## Verification
- Verified by running `npm run verify` which completes successfully with no warnings or errors.
