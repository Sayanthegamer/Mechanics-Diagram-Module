---
phase: 4
plan: 2
wave: 2
---

# Plan 4.2: Canvas Drag Interactions & Hotkeys

## Objective
Implement direct canvas interaction. Clicking/touching and dragging vectors, force arrows, block displacements, or launcher bobs will update configuration parameters in real-time. Add keyboard shortcut hotkeys for quick controls.

## Context
- .gsd/SPEC.md
- .gsd/phases/4/RESEARCH.md
- [main.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/main.ts)
- [PhysicsCanvas.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/PhysicsCanvas.ts)
- [diagrams/*](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/diagrams/)

## Tasks

<task type="auto">
  <name>Bind Canvas Interaction Events</name>
  <files>src/main.ts</files>
  <action>
    - Add event listeners on `physics-canvas` in `main.ts` for:
      - `mousedown` / `touchstart`
      - `mousemove` / `touchmove`
      - `mouseup` / `touchend` / `touchcancel` / `mouseleave`
    - Create a hit-testing function:
      - Convert client coordinate to local screen pixel `(sx, sy)`.
      - Map to physics coordinates: `const p = pc.toPhysics(sx, sy)`.
      - Check if this click lies within `0.4` physics units of active drag handles:
        - **Vector Diagram**: tip of Vector A or Vector B. (Use the inverse projection formulas for 3D cross product).
        - **FBD Diagram**: applied force tip ($F_a$) or incline wedge peak.
        - **SHM Diagram**: pendulum bob or spring block center.
        - **Mechanics Diagram**: projectile launch arrow tip.
    - If hit succeeds, store `dragTarget` (e.g. `'vector-A'`, `'applied-force'`), set `isDragging = true`, and temporarily pause the simulation update loop.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Canvas interaction handlers are bound and register click hits successfully.</done>
</task>

<task type="auto">
  <name>Implement Drag Resolvers</name>
  <files>src/main.ts</files>
  <action>
    - In the `mousemove` / `touchmove` handler:
      - Get current physics coordinates `(px, py)`.
      - Update configuration parameters based on `dragTarget`:
        - Vector A/B: update `v.x` and `v.y`. For 3D cross product, invert isometric projection.
        - Applied Force: calculate magnitude (vector distance from block center) and angle (arctangent of difference).
        - Incline Wedge: update `inclineAngle` by calculating arctangent of wedge height-to-width.
        - SHM displacement: update `initialDisplacement` based on delta-x or pendulum angle.
        - Projectile launch: update `velocity` and `angle` from launch arrow vector tip.
      - Apply the updated config via `applyConfig(activeConfig)` to redraw and refresh the sidebar inputs dynamically.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>Dragging updates configuration values in real-time, resetting and redrawing the simulation at the new drag coordinate.</done>
</task>

<task type="auto">
  <name>Add Keyboard Hotkeys</name>
  <files>src/main.ts</files>
  <action>
    - Register a `keydown` event listener on `window`:
      - `Space`: Pause/Play simulation (`togglePlayPause()`).
      - `KeyR`: Reset current simulation (`resetSimulation()`).
      - `KeyT`: Toggle theme (`toggleTheme()`).
      - `BracketRight`: Cycle to next preset.
      - `BracketLeft`: Cycle to previous preset.
  </action>
  <verify>npm run build</verify>
  <done>Vite build passes successfully, and hotkeys trigger standard simulator operations.</done>
</task>

## Success Criteria
- [ ] Dragging vectors, blocks, or launch arrows updates their parameters in the sidebar.
- [ ] Inverse isometric calculations correctly update 3D cross product vectors.
- [ ] Keyboard hotkeys trigger play/pause, reset, theme toggles, and preset cycles.
