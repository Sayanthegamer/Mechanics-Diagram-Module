---
phase: 4
plan: 1
wave: 1
---

# Plan 4.1: Circular Motion Preset

## Objective
Implement circular/centripetal motion simulation under classical mechanics. This provides a detailed, animated representation of forces (tension, centripetal acceleration, weight component projections) for both horizontal and vertical loops.

## Context
- .gsd/SPEC.md
- .gsd/phases/4/RESEARCH.md
- [types.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/types.ts)
- [MechanicsDiagram.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/diagrams/MechanicsDiagram.ts)
- [main.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/main.ts)

## Tasks

<task type="auto">
  <name>Extend Config Types</name>
  <files>src/lib/types.ts</files>
  <action>
    Modify the configuration types to support circular motion:
    - Define a new `CircularParams` interface:
      ```typescript
      export interface CircularParams {
        radius: number; // m
        speed: number;  // m/s (speed at the bottom for vertical, constant speed for horizontal)
        mass: number;   // kg
        gravity: number; // m/s^2
        isVertical: boolean; // vertical loop vs horizontal plane
      }
      ```
    - Update `MechanicsConfig` to accept `'circular'` mode.
    - Add `circular` property of type `CircularParams` to `MechanicsConfig`.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>types.ts compiles cleanly with new circular properties included.</done>
</task>

<task type="auto">
  <name>Implement Circular Motion Solver and Renderer</name>
  <files>src/lib/diagrams/MechanicsDiagram.ts</files>
  <action>
    - Add support for circular motion in `MechanicsDiagram.ts`.
    - Maintain internal state `circularAngle: number` (in radians).
    - In `step(dt)`:
      - For horizontal loop: update `circularAngle` using constant angular velocity $\omega = v/r$.
      - For vertical loop: compute current speed $v(\theta)$ from bottom speed $v_0$ using conservation of energy:
        $$v(\theta) = \sqrt{\max(0, v_0^2 - 2 g r (1 - \cos\theta))}$$
        Update `circularAngle` by $\omega(\theta) \cdot dt = (v(\theta) / r) \cdot dt$.
    - In `draw()`:
      - Draw center pivot, string line, and circular mass bob.
      - Draw force vectors originating from the bob COM:
        - Gravity component (red, pointing straight down).
        - Centripetal acceleration or net force vector (green, pointing inward along string).
        - Velocity vector (cyan, pointing tangentially).
        - Tension force vector (purple, pointing inward).
      - Ensure coordinate scaling matches physics-to-screen transforms.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>MechanicsDiagram compiles with circular motion logic and vector calculations implemented.</done>
</task>

<task type="auto">
  <name>Register Presets & Sliders</name>
  <files>src/main.ts</files>
  <action>
    - Add circular presets to `PRESETS`:
      - `mech-circular-horizontal`: horizontal circular motion ($r=2.5$m, $v=4.0$m/s, $m=1.5$kg).
      - `mech-circular-vertical`: vertical circular motion ($r=2.0$m, $v=7.0$m/s, $m=2.0$kg).
    - Update `applyConfig` and `updateTitles` to recognize `mode === 'circular'`.
    - Update `renderSliders` to build controls for circular parameters (Radius, Speed/Velocity, Mass, Loop Mode).
    - Update status bar mapping to output Time, Angle, Speed, Tension, and Centripetal Acceleration.
  </action>
  <verify>npm run build</verify>
  <done>Vite build passes successfully and the presets load in the UI.</done>
</task>

## Success Criteria
- [ ] Circular motion presets run with moving animation on screen.
- [ ] Sliders dynamically update circular motion parameters.
- [ ] Status bar displays real-time tension forces and orbital properties.
