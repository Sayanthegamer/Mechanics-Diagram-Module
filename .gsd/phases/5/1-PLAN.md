---
phase: 5
plan: 1
wave: 1
---

# Plan 5.1: Fluids Codebase Foundation & Buoyancy Engine

## Objective
Establish the framework-level configuration schemas and create the core class `FluidsDiagram.ts` with a fully integrated buoyancy physics simulation (gravity, submerged volume calculation, buoyant force, and stabilization damping).

## Context
- [types.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/types.ts)
- [PhysicsCanvas.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/PhysicsCanvas.ts)

## Tasks

<task type="auto">
  <name>Extend Shared Types for Fluids Config</name>
  <files>
    <file>src/lib/types.ts</file>
  </files>
  <action>
    - Add 'fluids' to DiagramType union.
    - Define BuoyancyParams, PascalParams, and FluidsConfig interfaces.
    - Update PhysicsConfig union to include FluidsConfig.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>
    - TypeScript compiles cleanly with the new fluids types.
  </done>
</task>

<task type="auto">
  <name>Create FluidsDiagram Class & Buoyancy Solver</name>
  <files>
    <file>src/lib/diagrams/FluidsDiagram.ts</file>
  </files>
  <action>
    - Create a new file `src/lib/diagrams/FluidsDiagram.ts` implementing the common diagram structure: `setConfig`, `resetState`, `step`, and `draw`.
    - Implement the Buoyancy solver:
      - Compute submerged height $h_{sub}$ and submerged volume $V_{sub}$ based on block coordinates and fluid height.
      - Apply Buoyant force ($F_b = \rho_{fluid} V_{sub} g$), Gravity ($F_g = m \cdot g$), and submerged-volume proportional damping ($F_d = -5.0 \cdot v \cdot \frac{V_{sub}}{V_b}$).
      - Update block velocity and position via Euler-Cromer integration.
      - Constrain the block to prevent clipping container bottom and sides.
    - Render the scene: draw the glassmorphic fluid tank, gridlines, fluid volume level, block shape, and color-coded vector force arrows (Gravity in red, Buoyancy in cyan).
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>
    - FluidsDiagram.ts exists and compiles without type errors.
    - Buoyancy forces and position integration equations are fully implemented.
  </done>
</task>

## Success Criteria
- [ ] Fluids configuration schema successfully integrated in `src/lib/types.ts`.
- [ ] `FluidsDiagram.ts` compiles cleanly and implements buoyancy physical state solver equations.
