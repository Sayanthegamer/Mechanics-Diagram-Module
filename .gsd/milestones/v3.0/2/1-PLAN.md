---
phase: 2
plan: 1
wave: 1
---

# Plan 2.1: Two-Body Solver & Barycenter Core

## Objective
Implement Velocity Verlet integration equations, barycenter centering calculations, and orbital trail tracking in `GravityDiagram.ts` to support stable binary systems.

## Context
- .gsd/SPEC.md
- [GravityDiagram.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/diagrams/GravityDiagram.ts)

## Tasks

<task type="auto">
  <name>Implement Two-Body State & Verlet Solver</name>
  <files>
    <file>src/lib/diagrams/GravityDiagram.ts</file>
  </files>
  <action>
    - Add state variables for Two-Body mode: coordinates (x1, y1, x2, y2), velocities (vx1, vy1, vx2, vy2), accelerations (ax1, ay1, ax2, ay2), and masses (m1, m2).
    - Add trail array variables for both bodies: body1Trail and body2Trail.
    - Implement Velocity Verlet integration step in step() method when mode is 'twobody':
      1. Update positions of both bodies using current velocity and acceleration.
      2. Calculate mutual gravitational force with softening factor epsilon = 0.15.
      3. Obtain new accelerations.
      4. Update velocities using average of old and new accelerations.
    - Shift coordinates relative to the barycenter:
      Rcom = (m1*x1 + m2*x2)/(m1+m2)
      x1_shifted = x1 - Rcom_x, etc.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>
    - State variables and trails are declared.
    - Velocity Verlet integration updates positions and velocities cleanly.
    - Barycenter centering is performed after each integration step.
    - Code compiles with no errors.
  </done>
</task>

## Success Criteria
- [ ] GravityDiagram class compiles with Velocity Verlet solver.
- [ ] Barycenter locks the center of mass to (0, 0) coordinates.
