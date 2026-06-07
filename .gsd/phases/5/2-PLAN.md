---
phase: 5
plan: 2
wave: 1
---

# Plan 5.2: Pressure Probe & Pascal Hydraulic Press Solver

## Objective
Implement a draggable hydrostatic pressure probe (displaying gauge and absolute values) and add the Pascal principle hydraulic press solver (connected dual-cylinders with piston height adjustments) into the `FluidsDiagram` physics and rendering loop.

## Context
- [FluidsDiagram.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/diagrams/FluidsDiagram.ts)
- [PhysicsCanvas.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/PhysicsCanvas.ts)

## Tasks

<task type="auto">
  <name>Implement Hydrostatic Pressure Probe</name>
  <files>
    <file>src/lib/diagrams/FluidsDiagram.ts</file>
  </files>
  <action>
    - Add pressure probe position state (X/Y coordinate) to `FluidsDiagram.ts`.
    - Compute depth $h = \max(0, y_{fluid} - y_{probe})$.
    - Compute gauge pressure: $P_{gauge} = \rho_{fluid} \cdot g \cdot h$.
    - Compute absolute pressure: $P_{absolute} = P_{gauge} + P_{atmospheric}$ (defaulting $P_{atmospheric} = 101325\text{ Pa}$).
    - Render the probe sensor tip on the canvas with a hover highlight indicator and a connected numerical HUD callout bubble showing readings in kPa and atm.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>
    - Pressure probe depth pressure equations are implemented.
    - Draggable probe sensor node is drawn with a HUD reporting pressure.
  </done>
</task>

<task type="auto">
  <name>Implement Pascal's Hydraulic Press</name>
  <files>
    <file>src/lib/diagrams/FluidsDiagram.ts</file>
  </files>
  <action>
    - Implement Pascal's principle dual-piston solver under the `'pascal'` mode in `FluidsDiagram.ts`.
    - Maintain cylinder levels using a single vertical displacement offset parameter:
      - Left piston height: $y_1 = y_{neutral} - \Delta y$
      - Right piston height: $y_2 = y_{neutral} + \Delta y \cdot \frac{A_1}{A_2}$
      - Keep volume constant: $A_1 \cdot \Delta y_1 + A_2 \cdot \Delta y_2 = 0$.
    - Calculate mechanical force advantage: $F_2 = F_1 \cdot \frac{A_2}{A_1}$.
    - Draw the connected dual-cylinder vessel, left/right piston blocks, fluid filling, and vectors representing forces applied ($F_1$ and $F_2$).
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>
    - Pascal dual-cylinder geometric constraint solver is fully functional.
    - Piston heights dynamically shift maintaining constant total volume.
  </done>
</task>

## Success Criteria
- [ ] Hydrostatic pressure probe displays accurate Pascal readings dynamically with depth.
- [ ] Pascal's hydraulic press visually updates connected cylinder levels conserving total fluid volume.
