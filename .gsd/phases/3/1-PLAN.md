---
phase: 3
plan: 1
wave: 1
---

# Plan 3.1: Escape Velocity Solver & Physics Core

## Objective
Implement state variables, initial conditions, and numerical ODE integration (using RK4 or Verlet) in `GravityDiagram.ts` to simulate a probe launched from a planet's surface at varying speeds, angles, and altitudes.

## Context
- .gsd/SPEC.md
- [types.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/types.ts)
- [GravityDiagram.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/diagrams/GravityDiagram.ts)

## Tasks

<task type="auto">
  <name>Initialize Escape Velocity State Variables</name>
  <files>
    <file>src/lib/diagrams/GravityDiagram.ts</file>
  </files>
  <action>
    - Add state variables to `GravityDiagram` class:
      - Probe positions (`px, py`), velocities (`pvx, pvy`), and acceleration.
      - Trail tracking array: `probeTrail: { x: number, y: number }[]`.
      - State flags: `probeCrashed: boolean` (to halt solver updates on surface impact).
    - Update `resetState()`:
      - If `mode === 'escape' && escape`:
        - Set `probeCrashed = false` and clear `probeTrail`.
        - Calculate initial coordinates based on planet center at (0,0), launch altitude (initial distance from center $r_0 = \text{escape.launchAltitude}$), launch speed $v_0 = \text{escape.launchVelocity}$, and launch angle $\theta$ relative to the radial vector.
        - Let's place the probe initially along the X-axis: $p_x = r_0, p_y = 0$.
        - With launch angle $\theta$ (in degrees, where $\theta = 0$ is radial/outward and $\theta = 90$ is tangential):
          - $v_x = v_0 \cos(\theta)$
          - $v_y = v_0 \sin(\theta)$
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>
    - State variables declared successfully.
    - Initial conditions for position and velocity are set correctly in resetState().
  </done>
</task>

<task type="auto">
  <name>Implement Escape Trajectory Solver & Collision Check</name>
  <files>
    <file>src/lib/diagrams/GravityDiagram.ts</file>
  </files>
  <action>
    - Update the `step()` method in `GravityDiagram.ts` for `mode === 'escape'`:
      - If `probeCrashed` is true, skip updates.
      - Implement the integration step (RK4 or Velocity Verlet) for the probe under planet's gravity force:
        - Accel $\vec{a} = - \frac{G M_p \vec{r}}{r^3}$ where $\vec{r} = (p_x, p_y)$ and $r = \sqrt{p_x^2 + p_y^2}$.
        - Use $G = 1.0$ and $M_p = \text{escape.planetMass}$.
      - Check for planet collision:
        - If $r \le \text{escape.planetRadius}$, set `probeCrashed = true` and lock position to the crash surface.
      - Check for off-screen bounds:
        - If $r > 25.0$, reset the simulation state (`this.resetState()`) to auto-loop the launch sequence.
      - Save positions to `probeTrail` (cap length at 400 points).
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>
    - step() method handles escape physics updates.
    - Crash detection and boundary resets are fully operational.
  </done>
</task>

## Success Criteria
- [ ] GravityDiagram compiles cleanly with escape velocity physics variables.
- [ ] Solver halts updates on surface crash and auto-loops on outer boundary escape.
