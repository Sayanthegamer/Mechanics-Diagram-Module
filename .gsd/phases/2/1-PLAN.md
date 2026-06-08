---
phase: 2
plan: 1
wave: 1
---

# Plan 2.1: Piston Movement & Thermodynamic Transitions

## Objective
Implement state-transition formulas for thermodynamic processes inside `ThermoDiagram.ts` and update the visual rendering engine with moving piston boundaries, fire burners, and cooling blocks.

## Context
- .gsd/SPEC.md
- [ThermoDiagram.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/diagrams/ThermoDiagram.ts)

## Tasks

<task type="auto">
  <name>Implement Thermodynamic State Transition Physics</name>
  <files>
    <file>src/lib/diagrams/ThermoDiagram.ts</file>
  </files>
  <action>
    - Add state parameters to track active processes in `ThermoDiagram`:
      ```typescript
      public activeProcess: 'none' | 'isothermal' | 'isobaric' | 'isochoric' | 'adiabatic' = 'none';
      public heatTransfer: 'none' | 'heating' | 'cooling' = 'none';
      ```
    - Define properties for reference initial state ($P_0, V_0, T_0$) to evaluate ideal curves.
    - In `step(dt)`, solve the macroscopic equations based on changes in volume (e.g. compression or expansion transitions):
      - **Isothermal**: $T = T_0$, calculate $P = P_0 \frac{V_0}{V}$.
      - **Isobaric**: $P = P_0$, calculate $T = T_0 \frac{V}{V_0}$.
      - **Isochoric**: $V = V_0$, calculate $T = T_0 \frac{P}{P_0}$ (when pressure is shifted).
      - **Adiabatic**: Calculate $P = P_0 \left(\frac{V_0}{V}\right)^\gamma$ and $T = T_0 \left(\frac{V_0}{V}\right)^{\gamma - 1}$, where $\gamma \approx 1.67$.
    - Perform velocity scaling to align particle speeds with macroscopic temperature:
      - $\alpha = \sqrt{T_{\text{new}} / T_{\text{old}}}$.
      - $\mathbf{v}_i \leftarrow \alpha \mathbf{v}_i$.
      - Prevent speed runaway by capping maximum particle velocity.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>
    - `ThermoDiagram.ts` compiles cleanly.
    - Particle speed adjustments successfully respond to temperature state updates.
  </done>
</task>

<task type="auto">
  <name>Implement Piston Visuals, Flame, and Ice</name>
  <files>
    <file>src/lib/diagrams/ThermoDiagram.ts</file>
  </files>
  <action>
    - Update the `draw()` method in `ThermoDiagram.ts` to render piston details:
      - Draw the movable vertical piston head as a solid steel slab (thick gray filled rectangle) at $x_{\text{right}}$.
      - Draw a horizontal shaft/rod extending from the piston head out to the right.
      - Draw a heat source/sink underneath the cylinder chamber:
        - If `heatTransfer === 'heating'`: Draw a flame burner (fire-like glowing gradient with yellow, orange, and red stops).
        - If `heatTransfer === 'cooling'`: Draw ice block shapes (light blue squares with white highlights).
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>
    - Piston head and connecting rod render dynamically as volume varies.
    - Heating and cooling indicators show up under the cylinder correctly based on `heatTransfer` state.
  </done>
</task>

## Success Criteria
- [ ] `ThermoDiagram` compiles cleanly with the new transition formulas and visual states.
- [ ] Particle speeds scale dynamically matching macroscopic temperatures.
