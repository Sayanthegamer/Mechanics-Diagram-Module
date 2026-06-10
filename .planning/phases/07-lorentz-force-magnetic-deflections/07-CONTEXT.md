# Phase 7: Lorentz Force & Magnetic Deflections - Context

**Gathered:** 2026-06-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Extend the EmDiagram.ts module to include uniform magnetic fields, particle guns, and trace rendering under Lorentz force kinematics.
Supports draggable/interactive particle gun launcher, manual sidebar controls (for firing speed, launcher angle, particle charge, mass, and fire action), magnetic field rendering toggle (between symbol grid and actual lines), solid trajectory trails, contact absorption collisions with static point charges, and real-time telemetry updates to GraphModule.

</domain>

<decisions>
## Implementation Decisions

### Particle Gun Interaction & Launcher controls
- **D-01:** Implement a draggable/interactive particle gun launcher on the canvas, allowing the user to reposition and aim the gun directly.
- **D-02:** Maintain full manual sidebar controls for adjusting particle parameters: launch speed, angle, particle charge $q$, mass $m$, and a "Fire" button to launch the particle.
- **D-03:** Support launching multiple test particles simultaneously, each following its independent Lorentz trajectory.

### Magnetic Field Rendering
- **D-04:** Support a uniform $B$-field controlled by a sidebar slider (e.g., from $-5\text{T}$ to $+5\text{T}$).
- **D-05:** Provide a visual mode toggle to switch the magnetic field rendering between a grid of $\times$ (into the page) / $\bullet$ (out of the page) symbols and actual magnetic field lines (where applicable).
- **D-06:** Render the field symbols/lines layered underneath the charges and test particle trails to maintain legibility.

### Trajectory Trails & Reset Behavior
- **D-07:** Draw solid trajectory trails (path history) for fired test particles.
- **D-08:** Clear the trajectory trails and delete active test particles upon simulation reset.

### Particle Physics & Collisions
- **D-09:** Update particle velocities using numerical integration under the Lorentz force $F = q(E + v \times B)$, considering both electric fields from static point charges and the uniform magnetic field.
- **D-10:** Implement textbook contact absorption/annihilation: if a moving test particle collides with a static point charge (defined by its radius/collision boundary), the particle is absorbed (annihilated/removed from the simulation).

### Telemetry Graphing
- **D-11:** Wire active test particle telemetry (e.g., speed, position coords, kinetic energy) to the real-time `GraphModule` curves.

### the agent's Discretion
- The color of the trajectory trails (e.g. glowing yellow/green), the spacing of the grid symbols, the integration time-step size, and the precise collision radius threshold are left to the agent's discretion.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Lorentz Deflection Requirements
- `ROADMAP.md` §Phase 7 — Goal, dependencies, and success criteria
- `REQUIREMENTS.md` §Lorentz Deflection Tracer — Requirements EM-05, EM-06

### Existing Codebase & Conventions
- `.planning/codebase/CONVENTIONS.md` — Radian conversions, config setters, draw loop structure
- `src/lib/diagrams/EmDiagram.ts` — Existing electrostatics module to be extended with magnetic field and moving test particles
- `src/lib/diagrams/GraphModule.ts` — Real-time telemetry graphing interface

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PhysicsCanvas`: Translates between screen and world coordinates and renders standard shapes.
- `EmDiagram`: Existing electrostatics class with `getFieldAt` and `draw` implementations.
- `GraphModule`: Telemetry plot system for graphing variables over time.

### Established Patterns
- Dynamic sidebar control sliders dynamically rendered via `renderSliders` in `src/main.ts`.
- Time-stepping simulation updates in `step(dt)` and canvas draws in `draw(canvas)`.

### Integration Points
- Update `EmConfig` type in `src/lib/types.ts` to support particle gun parameters (mass, charge, velocity, angle) and magnetic field intensity $B$.
- Connect particle telemetry updates to `GraphModule` inside the step loop.

</code_context>

<specifics>
## Specific Ideas

- Draw the particle gun launcher as a clean, styled turret shape with a directional aiming line or arrow.
- Maintain classic textbook aesthetics for the grid symbols: clearly render $\times$ inside a circle or simple crossed lines, and $\bullet$ as a dot inside a circle.

</specifics>

<deferred>
## Deferred Ideas

- AC/DC Circuits solver engine (deferred to Phase 8).

</deferred>

---

*Phase: 07-lorentz-force-magnetic-deflections*
*Context gathered: 2026-06-10*
