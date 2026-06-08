---
phase: 7
plan: 1
wave: 1
depends_on: []
files_modified:
  - src/lib/diagrams/FluidsDiagram.ts
  - src/lib/diagrams/GraphModule.ts
  - src/lib/PhysicsCanvas.ts
  - src/main.ts
autonomous: true
must_haves:
  truths:
    - "Bernoulli preset graphs inlet speed, throat speed, and pressure drop over time"
    - "Viscosity preset graphs sphere position, downward speed, and terminal velocity reference line"
    - "Canvas can be panned by dragging empty canvas space, and panning resets on preset change"
  artifacts:
    - "src/lib/PhysicsCanvas.ts has panX and panY fields"
---

# Plan 7.1: UI Integration, Plotting & Polish

<objective>
Connect the real-time graphing canvas to the new Hydrodynamics simulation modes (Bernoulli, Viscosity) and Pascal mode, and implement canvas viewport panning for a premium interactive experience.

Purpose: Completes Phase 7 requirements and allows users to visualize simulated variables and navigate the workspace.
Output: Extended FluidsState, updated GraphModule, PhysicsCanvas panning variables, and updated main.ts event loops.
</objective>

<context>
Load for context:
- .gsd/SPEC.md
- src/lib/diagrams/FluidsDiagram.ts
- src/lib/diagrams/GraphModule.ts
- src/lib/PhysicsCanvas.ts
- src/main.ts
</context>

<tasks>

<task type="auto">
  <name>Extend FluidsState and History logging</name>
  <files>
    - src/lib/diagrams/FluidsDiagram.ts
  </files>
  <action>
    - Update `FluidsState` interface with optional physics parameters:
      - `piston1Y?: number`, `piston2Y?: number` (Pascal piston heights)
      - `v1?: number`, `v2?: number`, `deltaP?: number` (Bernoulli velocities and pressure drop)
      - `sphereY?: number`, `sphereVy?: number`, `terminalVy?: number` (Viscosity sphere physics)
    - In `step(dt)`, compute these parameters based on the active mode and push them to `this.history`.
  </action>
  <verify>Run `npx tsc --noEmit` to ensure type checks pass.</verify>
  <done>FluidsState holds mode-specific simulation data, logged on every physics step.</done>
</task>

<task type="auto">
  <name>Implement Multi-Mode Graphing in GraphModule</name>
  <files>
    - src/lib/diagrams/GraphModule.ts
  </files>
  <action>
    - Update `drawFluids` method signature to accept the current fluids mode: `drawFluids(history: FluidsState[], mode: 'buoyancy' | 'pascal' | 'bernoulli' | 'viscosity'): void`
    - Add custom plot curves, scaling limits, colors, and legend labels for each mode:
      - **buoyancy**: Block Y position, Block Y velocity, Gauge Pressure (kPa)
      - **pascal**: Piston 1 displacement (Y), Piston 2 displacement (Y), Gauge Pressure (kPa)
      - **bernoulli**: Inlet Speed v1 (m/s), Throat Speed v2 (m/s), Pressure Drop ΔP (kPa)
      - **viscosity**: Sphere Position Y (m), Sphere Speed (m/s), Terminal Velocity vt (m/s)
  </action>
  <verify>Run `npx tsc --noEmit` to ensure type checks pass.</verify>
  <done>GraphModule handles separate plotting representations for all fluids modes cleanly.</done>
</task>

<task type="auto">
  <name>Implement Viewport Panning</name>
  <files>
    - src/lib/PhysicsCanvas.ts
    - src/main.ts
  </files>
  <action>
    - Add `panX: number = 0` and `panY: number = 0` to `PhysicsCanvas.ts`.
    - Modify `resetOrigin()` in `PhysicsCanvas.ts` to offset `originX` and `originY` by `panX` and `panY`.
    - In `main.ts`, define `lastPanX` and `lastPanY` variables.
    - At the end of `handleInteractionStart`, if no interactive element is clicked, set `dragTarget = 'pan'` and store coordinates.
    - In `handleInteractionMove`, if `dragTarget === 'pan'`, compute offset differences, update `pc.panX` / `pc.panY`, and call `pc.resetOrigin()`.
    - Reset `pc.panX = 0; pc.panY = 0; pc.resetOrigin();` inside `loadPreset` to clear panning when switching presets.
    - Also update `drawActiveSimulation()` to call `graphModule.drawFluids(fluidsDiagram.history, activeConfig.mode)` and set correct graph titles for Bernoulli and Viscosity modes.
  </action>
  <verify>Run `npx tsc --noEmit` and check that the dev server builds without errors.</verify>
  <done>Dragging canvas blank space pans the viewport, and presets load with clean alignment.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] TypeScript type checks pass
- [ ] Build passes
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
