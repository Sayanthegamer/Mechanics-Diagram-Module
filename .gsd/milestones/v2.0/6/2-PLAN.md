---
phase: 6
plan: 2
wave: 1
---

# Plan 6.2: Viscous Drag & Stokes' Law Falling Sphere

## Objective
Implement Stokes' Law dynamic viscous drag physics, simulating a sphere falling through a high-viscosity fluid cylinder and converging to its terminal velocity.

## Context
- [FluidsDiagram.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/diagrams/FluidsDiagram.ts)
- [PhysicsCanvas.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/PhysicsCanvas.ts)

## Tasks

<task type="auto">
  <name>Implement Stokes' Law Viscosity Solver</name>
  <files>
    <file>src/lib/diagrams/FluidsDiagram.ts</file>
  </files>
  <action>
    - Add state variables for falling sphere position Y and velocity $v_y$.
    - Implement the viscosity force equation:
      - Gravity: $F_g = \frac{4}{3} \pi r^3 \rho_s g$
      - Buoyancy: $F_b = \frac{4}{3} \pi r^3 \rho_f g$
      - Viscous Drag (Stokes' Law): $F_d = 6 \pi \eta r v_y$
      - Net Force: $F_{net} = F_g - F_b - F_d$.
    - Step velocity and position in `step(dt)`. Limit sphere boundary to container bottom.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>
    - Viscous drag equations and step loop compile correctly.
  </done>
</task>

<task type="auto">
  <name>Render Viscous Cylinder & Vectors</name>
  <files>
    <file>src/lib/diagrams/FluidsDiagram.ts</file>
  </files>
  <action>
    - Draw a tall glass cylinder containing the liquid.
    - Draw the falling sphere, and label terminal velocity limit $v_t$.
    - Draw force vectors representing Gravity, Buoyancy, and Drag forces.
  </action>
  <verify>npm run build</verify>
  <done>
    - Cylinder, falling sphere, terminal velocity labels, and vectors render cleanly.
    - TypeScript compilation and production assets bundle successfully.
  </done>
</task>

## Success Criteria
- [ ] Falling sphere velocity asymptotically approaches terminal velocity ($v_t$) as dynamic drag balances gravitational pull.
- [ ] Cylinder, fluid columns, and vectors are fully rendered.
