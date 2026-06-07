---
phase: 5
plan: 3
wave: 2
---

# Plan 5.3: UI Controls & Canvas Drag Integration

## Objective
Wire the new `FluidsDiagram` presets (Buoyancy and Pascal Press) into the main dashboard controller, mapping dynamic sliders, updating status bars, and integrating direct canvas mouse/touch drag event listeners.

## Context
- [main.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/main.ts)
- [index.html](file:///c:/Users/Anon/Desktop/Physics-Diagrams/index.html)
- [FluidsDiagram.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/diagrams/FluidsDiagram.ts)

## Tasks

<task type="auto">
  <name>Register Fluids Diagram in Dashboard Orchestrator</name>
  <files>
    <file>src/main.ts</file>
  </files>
  <action>
    - Import `FluidsDiagram` and instantiate it under the `'fluids'` key in the diagram registry.
    - Define default configurations and presets for:
      - **Buoyancy Lab**: Fluid density $1000\text{ kg/m}^3$ (Water), block mass $2.0\text{ kg}$, block volume $0.005\text{ m}^3$ (floating).
      - **Heavy Block Buoyancy**: Fluid density $800\text{ kg/m}^3$ (Oil), block mass $6.0\text{ kg}$, block volume $0.005\text{ m}^3$ (sinks).
      - **Pascal Press**: Left cylinder area $1.0\text{ m}^2$, right cylinder area $3.0\text{ m}^2$, applied force $10\text{ N}$.
    - Bind sliders to dynamically update fluid density, block mass, block volume, piston areas, and applied force.
    - Set up status bar callbacks to report submerged percentage, buoyant force magnitude, pressure gauge reading, and output force amplification.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>
    - Fluids presets are selectable in the dashboard dropdown menu.
    - Parameter sliders update the underlying fluid physics configuration.
  </done>
</task>

<task type="auto">
  <name>Implement Canvas Click-and-Drag Controls</name>
  <files>
    <file>src/main.ts</file>
    <file>src/lib/diagrams/FluidsDiagram.ts</file>
  </files>
  <action>
    - Add hover distance test functions to `FluidsDiagram.ts` to identify close coordinates:
      - **Buoyancy Mode**: Clicking near the block center grabs the block; clicking near the probe sensor grabs the pressure probe.
      - **Pascal Mode**: Clicking near the left piston or right piston grabs the respective piston.
    - Extend mouse and touch event listeners in `src/main.ts` to map screen drags back to physics coordinates, updating the block drop position, pressure probe location, or piston displacement offset parameters.
    - Apply cursor style changes (`grab` and `grabbing`) to indicate interactive components.
  </action>
  <verify>npm run build</verify>
  <done>
    - Drag handles for the buoyancy block, pressure probe, and pistons respond dynamically to mouse/touch inputs.
    - Strict typescript compilation and production asset bundler succeed without warnings.
  </done>
</task>

## Success Criteria
- [ ] Buoyancy and Pascal presets are fully functional in the main sidebar dropdown.
- [ ] User can click-and-drag the block, pressure probe, and pistons directly on the canvas to update physics variables.
