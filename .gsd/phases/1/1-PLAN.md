---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Core Electrostatics Solver & Types

## Objective
Establish the database models and core physics solver for the electrostatics simulation. This sets up the configuration interfaces in `types.ts` and the main `EmDiagram` class with Coulomb's law potential and electric field solvers.

## Context
- [.gsd/SPEC.md](file:///c:/Users/Anon/Desktop/Physics-Diagrams/.gsd/SPEC.md)
- [.gsd/phases/1/RESEARCH.md](file:///c:/Users/Anon/Desktop/Physics-Diagrams/.gsd/phases/1/RESEARCH.md)
- [src/lib/types.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/types.ts)

## Tasks

<task type="auto">
  <name>Extend Shared Configuration Types</name>
  <files>src/lib/types.ts</files>
  <action>
    Modify `src/lib/types.ts` to support the electromagnetism module:
    1. Add `'em'` to `DiagramType`.
    2. Define `EmCharge` interface: `{ id: string; x: number; y: number; q: number; isDragging?: boolean }`.
    3. Define `EmConfig` extending `BaseConfig`:
       - `type: 'em'`
       - `charges: EmCharge[]`
       - `showVectors: boolean`
       - `showLines: boolean`
       - `showEquipotentials: boolean`
       - `numLinesPerCharge: number`
    4. Add `EmConfig` to the unified `PhysicsConfig` union type.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>
    TypeScript compiler checks pass with the extended configurations.
  </done>
</task>

<task type="auto">
  <name>Create Core EmDiagram Solver Skeleton</name>
  <files>src/lib/diagrams/EmDiagram.ts</files>
  <action>
    Create `src/lib/diagrams/EmDiagram.ts` with standard diagram lifecycle methods:
    1. Implement class `EmDiagram` with `setConfig(config: EmConfig)`, `resetState()`, `step(dt: number)`, and `draw(canvas: PhysicsCanvas)`.
    2. Maintain local state: `public charges: EmCharge[]`, and configuration variables.
    3. Implement `public getPotentialAt(x: number, y: number): number` solving:
       $$V(x, y) = k_e \sum \frac{q_i}{\sqrt{(x-x_i)^2 + (y-y_i)^2 + \epsilon^2}}$$
    4. Implement `public getFieldAt(x: number, y: number): { ex: number; ey: number }` solving:
       $$E_x(x, y) = k_e \sum \frac{q_i (x-x_i)}{((x-x_i)^2 + (y-y_i)^2 + \epsilon^2)^{1.5}}$$
       $$E_y(x, y) = k_e \sum \frac{q_i (y-y_i)}{((x-x_i)^2 + (y-y_i)^2 + \epsilon^2)^{1.5}}$$
    Use $k_e = 10.0$ and softening length $\epsilon^2 = 0.04$ for numerical stability.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>
    `EmDiagram.ts` is created and compiles cleanly. Solvers correctly compute non-infinite field vectors near charge boundaries.
  </done>
</task>

## Success Criteria
- [ ] TypeScript configuration type support for `'em'` diagrams.
- [ ] Core `EmDiagram` module initialized with Coulomb field and potential solvers.
