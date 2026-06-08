---
phase: 4
plan: 1
wave: 1
---

# Plan 4.1: Generic Energy Graphing and Gravity Diagram History

## Objective
Introduce a generic interface for energy plotting in `GraphModule.ts` and implement state history tracking in `GravityDiagram.ts` to calculate and store energy components (Kinetic, Potential, and Total energy) at each time step.

## Context
- .gsd/SPEC.md
- [GraphModule.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/diagrams/GraphModule.ts)
- [GravityDiagram.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/diagrams/GravityDiagram.ts)

## Tasks

<task type="auto">
  <name>Create Shared Energy Graphing Interface</name>
  <files>
    <file>src/lib/diagrams/GraphModule.ts</file>
  </files>
  <action>
    - Define and export the `EnergyStatePoint` interface in `GraphModule.ts`:
      ```typescript
      export interface EnergyStatePoint {
        t: number;
        kineticEnergy: number;
        potentialEnergy: number;
        totalEnergy: number;
      }
      ```
    - Modify the `draw` method in `GraphModule` to accept `EnergyStatePoint[]` instead of `ShmState[]`.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>
    - `EnergyStatePoint` interface is defined and exported.
    - `GraphModule.draw()` uses `EnergyStatePoint[]` signature.
  </done>
</task>

<task type="auto">
  <name>Implement History and Energy Calculators in Gravity Diagram</name>
  <files>
    <file>src/lib/diagrams/GravityDiagram.ts</file>
  </files>
  <action>
    - Import `EnergyStatePoint` in `GravityDiagram.ts`.
    - Declare a history array: `public history: EnergyStatePoint[] = [];`.
    - In `resetState()`, clear the history: `this.history = [];`.
    - In `step(dt)`, calculate energies after each integration step and append to `history` (cap length at 200 points):
      - **Keplerian**:
        - $KE = 0.5 \cdot (planetVx^2 + planetVy^2)$ (using planet mass $m = 1.0$).
        - $PE = -10.0 / r$ where $r = \sqrt{planetX^2 + planetY^2}$ (using star mass $M_{\text{star}} = 10.0$ and $G = 1.0$).
        - $TE = KE + PE$.
      - **Two-Body**:
        - $KE = 0.5 \cdot m_1 \cdot (vx_1^2 + vy_1^2) + 0.5 \cdot m_2 \cdot (vx_2^2 + vy_2^2)$.
        - $PE = - (G \cdot m_1 \cdot m_2) / \sqrt{r^2 + \epsilon^2}$ where $r$ is mutual distance, $G = 1.0$, and softening $\epsilon = 0.15$.
        - $TE = KE + PE$.
      - **Escape Launcher**:
        - $KE = 0.5 \cdot (pv_x^2 + pv_y^2)$ (using probe mass $m_{\text{probe}} = 1.0$).
        - $PE = - (G \cdot M_p) / r$ where $r = \sqrt{px^2 + py^2}$, planet mass $M_p = \text{escape.planetMass}$, and $G = 1.0$.
        - $TE = KE + PE$.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>
    - GravityDiagram compiles cleanly with the new history tracking and energy computations.
    - History tracks Kinetic, Potential, and Total energy for all three gravity modes.
  </done>
</task>

## Success Criteria
- [ ] GravityDiagram and GraphModule compile cleanly with shared `EnergyStatePoint`.
- [ ] GravityState calculations correctly incorporate mass, velocities, and softening parameters.
