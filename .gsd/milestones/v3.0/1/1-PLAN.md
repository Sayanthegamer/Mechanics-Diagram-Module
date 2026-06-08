---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Keplerian Orbit Solver Foundation

## Objective
Implement types and configuration interfaces for the gravitation module, and build the `GravityDiagram` core class featuring a Newton-Raphson Kepler solver.

## Context
- .gsd/SPEC.md
- [types.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/types.ts)
- [FbdDiagram.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/diagrams/FbdDiagram.ts) (as a pattern for diagram modules)

## Tasks

<task type="auto">
  <name>Extend Types & Configuration</name>
  <files>
    <file>src/lib/types.ts</file>
  </files>
  <action>
    - Add 'gravity' to the DiagramType union.
    - Define interfaces for GravityConfig, KeplerianParams, TwoBodyParams, and EscapeVelocityParams.
    - Add GravityConfig to the PhysicsConfig union type.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>
    - 'gravity' is declared in DiagramType.
    - GravityConfig is included in PhysicsConfig.
    - TypeScript compilation completes with no errors.
  </done>
</task>

<task type="auto">
  <name>Create GravityDiagram Solver Module</name>
  <files>
    <file>src/lib/diagrams/GravityDiagram.ts</file>
  </files>
  <action>
    - Create a new file src/lib/diagrams/GravityDiagram.ts implementing the GravityDiagram class.
    - Add a method to solve Kepler's Equation M = E - e*sin(E) using Newton-Raphson iteration:
      E_next = E - (E - e*sin(E) - M) / (1 - e*cos(E))
    - Implement a resetState() method to initialize the planet's position based on initial parameters.
    - Implement a basic draw() method that clears the canvas, centers origin, and draws a central star.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>
    - GravityDiagram class exists and exports.
    - Numerical solver solves Kepler's equation correctly within 5 iterations.
    - The code compiles cleanly.
  </done>
</task>

## Success Criteria
- [ ] DiagramType successfully extended to include 'gravity'.
- [ ] GravityDiagram class handles numerical calculation of Keplerian coordinates and compiles cleanly.
