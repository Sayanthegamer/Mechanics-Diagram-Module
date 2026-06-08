---
phase: 3
plan: 1
wave: 1
---

# Plan 3.1: Carnot Cycle Automation & State Tracking

## Objective
Implement a time-interpolated Finite State Machine (FSM) inside `ThermoDiagram.ts` to automate the Carnot thermodynamic cycle, updating pressure, volume, and temperature across 4 stages, and map the PV coordinates for real-time loop rendering.

## Context
- .gsd/SPEC.md
- .gsd/phases/3/RESEARCH.md
- [ThermoDiagram.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/diagrams/ThermoDiagram.ts)

## Tasks

<task type="auto">
  <name>Implement Carnot Cycle FSM</name>
  <files>
    <file>src/lib/diagrams/ThermoDiagram.ts</file>
  </files>
  <action>
    - Add fields to `ThermoDiagram` to track the Carnot cycle state:
      - `public autoCycle: boolean = false;` (controls whether FSM automation is running)
      - `public cycleStage: 0 | 1 | 2 | 3 = 0;` (0: Isothermal Expansion, 1: Adiabatic Expansion, 2: Isothermal Compression, 3: Adiabatic Compression)
      - `public stageTimer: number = 0;`
      - `public readonly stageDuration: number = 3.0;`
    - Define constant values for the cycle boundaries:
      - `private readonly tHot: number = 6.0;`
      - `private readonly tCold: number = 3.0;`
      - `private readonly vA: number = 1.1;`
      - `private readonly vB: number = 1.6;`
    - Calculate `vC` and `vD` dynamically in `step(dt)` (or constructor/reset) using the adiabatic relation:
      - $V_C = V_B \cdot (T_H / T_C)^{1.4925}$
      - $V_D = V_A \cdot (T_H / T_C)^{1.4925}$
    - In `step(dt)`, if `this.config.autoCycle` is enabled, run the Carnot FSM:
      - Increment `this.stageTimer` by `dt`. If it exceeds `this.stageDuration`, transition to the next stage (wrapping back to 0) and reset the timer.
      - Calculate the current volume $V(u)$ and temperature $T(u)$ by interpolating based on the active stage ($u = t_{\text{stage}} / \tau$).
      - Set `this.activeProcess` and `this.heatTransfer` matching the stage's thermodynamic actions.
      - Scale particle speeds using the temperature change to sync molecular kinetics.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>
    - `ThermoDiagram.ts` compiles cleanly.
    - Particles respond to Carnot automation when `autoCycle` is active.
  </done>
</task>

<task type="auto">
  <name>Expose Coordinates for PV Curve Plotting</name>
  <files>
    <file>src/lib/diagrams/ThermoDiagram.ts</file>
  </files>
  <action>
    - Expose a public method `getCarnotLoopPoints()` on `ThermoDiagram` which returns 100 coordinates `(V, P)` tracing the full Carnot loop path.
    - Add public getters or properties to easily fetch the active stage state to render corresponding stage colors on the plots.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>
    - PV curve sample points are accurately returned for plotting.
  </done>
</task>

## Success Criteria
- [ ] Carnot cycle FSM interpolates $P, V, T$ smoothly across 4 distinct stages.
- [ ] Particle velocities and visual indicators (flame/ice) adapt dynamically to the FSM stage.
- [ ] `getCarnotLoopPoints()` traces a closed Carnot cycle on a PV diagram.
