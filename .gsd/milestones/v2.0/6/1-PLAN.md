---
phase: 6
plan: 1
wave: 1
---

# Plan 6.1: Bernoulli Flow & Venturi Nozzle Simulation

## Objective
Implement Bernoulli flow and Venturi tube kinematics/pressure solvers, drawing converging-diverging pipes, streamlines, pressure columns, and dynamic flow markers in `FluidsDiagram.ts`.

## Context
- [FluidsDiagram.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/diagrams/FluidsDiagram.ts)
- [PhysicsCanvas.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/PhysicsCanvas.ts)

## Tasks

<task type="auto">
  <name>Implement Bernoulli Nozzle Geometry & Physics Solver</name>
  <files>
    <file>src/lib/diagrams/FluidsDiagram.ts</file>
  </files>
  <action>
    - Define a varying pipe diameter profile along the horizontal axis $x \in [-2.5, 2.5]$.
    - Continuity: Solve flow speed $v(x) = \frac{Q}{\pi (D(x)/2)^2}$ where $Q$ is the input volume flow rate.
    - Bernoulli: Solve local pressure $P(x) = P_1 + \frac{1}{2} \rho_f (v_1^2 - v(x)^2)$.
    - Add particle streamlines array to track position $x_p$ of multiple fluid markers.
    - Update particle positions in `step(dt)` by stepping $dx_p = v(x_p) \cdot dt$. Wrap particles when they exceed boundaries.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>
    - Bernoulli math solvers and particle advection loops compile without error.
  </done>
</task>

<task type="auto">
  <name>Draw Venturi Tube & Streamlines</name>
  <files>
    <file>src/lib/diagrams/FluidsDiagram.ts</file>
  </files>
  <action>
    - Draw the pipe contour shape on the canvas using bezier curves or path segments.
    - Render vertical Venturi gauge glass columns showing liquid height column proportional to local static pressure $P(x)$.
    - Render moving flow markers along 5 distinct flow lanes inside the pipe.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>
    - Pipe outline, Venturi height indicators, and flow particles render correctly.
  </done>
</task>

## Success Criteria
- [ ] FluidsDiagram simulates Continuity and Bernoulli pressure equations in pipe flow.
- [ ] Particles move faster through narrower sections of the pipe, corresponding to a drop in the vertical liquid column height (Venturi effect).
