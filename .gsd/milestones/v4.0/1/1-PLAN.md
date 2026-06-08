---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Gas Particle Physics & Collision Core

## Objective
Introduce thermodynamics configuration schemas in `types.ts` and build the core particle dynamics, boundary reflections, and pairwise elastic collision solver inside the new `ThermoDiagram` simulation class.

## Context
- .gsd/SPEC.md
- [types.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/types.ts)

## Tasks

<task type="auto">
  <name>Extend Shared Configuration Types for Thermodynamics</name>
  <files>
    <file>src/lib/types.ts</file>
  </files>
  <action>
    - Add `'thermo'` to the `DiagramType` union.
    - Define and export the `ThermoConfig` interface:
      ```typescript
      export interface ThermoConfig extends BaseConfig {
        type: 'thermo';
        mode: 'kinetic-theory' | 'piston-engine' | 'diffusion';
        temperature: number;
        particleCount: number;
        volume: number;
        heatInput: number;
        showDistribution: boolean;
        showEntropy: boolean;
        autoCycle: boolean;
      }
      ```
    - Append `ThermoConfig` to the `PhysicsConfig` union type.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>
    - typescript compiler successfully checks type modifications.
  </done>
</task>

<task type="auto">
  <name>Create ThermoDiagram Class with Elastic Collision Core</name>
  <files>
    <file>src/lib/diagrams/ThermoDiagram.ts</file>
  </files>
  <action>
    - Create `src/lib/diagrams/ThermoDiagram.ts`.
    - Implement the `ThermoDiagram` class conforming to the standard diagram API.
    - Define a `Particle` interface:
      ```typescript
      interface Particle {
        x: number;
        y: number;
        vx: number;
        vy: number;
        radius: number;
        mass: number;
        color: string;
      }
      ```
    - Maintain particle positions and velocities, placing Species A (Heavy/Red, radius=10, mass=4) on the left and Species B (Light/Blue, radius=6, mass=1) on the right.
    - Implement `step(dt)` Verlet integration and boundary reflections, keeping coordinates clamped inside the container bounds:
      - Horizontally: $[r, W_{\text{container}} - r]$ where $W_{\text{container}}$ matches the configuration volume.
      - Vertically: $[r, H_{\text{container}} - r]$.
    - Sum wall collision impulses $2 \cdot m \cdot |v_n|$ on each frame and compute instant Pressure.
    - Implement naive $O(N^2)$ pairwise elastic collisions using vector updates and resolve overlaps by shifting colliding particles apart.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>
    - `ThermoDiagram.ts` compiles cleanly.
    - Particles collide elastically and remain strictly confined within the boundaries without sticking.
  </done>
</task>

## Success Criteria
- [ ] TypeScript types cleanly incorporate the new `'thermo'` diagram.
- [ ] `ThermoDiagram.ts` is created and passes compilation with zero type errors.
