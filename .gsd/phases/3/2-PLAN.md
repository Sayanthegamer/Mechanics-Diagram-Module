---
phase: 3
plan: 2
wave: 2
---

# Plan 3.2: Escape Velocity UI and Rendering

## Objective
Configure UI sliders and presets in `main.ts` / `index.html` / `types.ts` and implement high-quality vector rendering (planet body, probe circle, trail path, crash indicator, velocity vector) in `GravityDiagram.draw()`.

## Context
- .gsd/SPEC.md
- [types.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/types.ts)
- [main.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/main.ts)
- [GravityDiagram.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/diagrams/GravityDiagram.ts)

## Tasks

<task type="auto">
  <name>UI Configuration and Sliders for Escape Launcher</name>
  <files>
    <file>src/lib/types.ts</file>
    <file>src/main.ts</file>
    <file>index.html</file>
  </files>
  <action>
    - Add `launchAltitude` and `launchAngle` fields to `EscapeVelocityParams` in `types.ts`.
    - Register option "Gravity: Escape Velocity Launcher" with value `gravity-escape` in `index.html` preset dropdown.
    - Register preset configuration `gravity-escape` in `PRESETS` map in `main.ts`:
      - `mode: 'escape'`
      - Default parameters: `planetMass: 15.0`, `planetRadius: 0.8`, `launchAltitude: 1.2`, `launchVelocity: 3.5`, `launchAngle: 90.0` (tangential).
    - Update `renderSliders()` in `main.ts` to show sliders for Escape mode:
      - Launch Speed ($v_0$) [0.5 to 8.0]
      - Launch Altitude ($r_0$) [0.8 to 4.0]
      - Launch Angle ($\theta$) [0 to 180 degrees]
      - Planet Mass ($M_p$) [1.0 to 50.0]
      - Planet Radius ($R_p$) [0.3 to 2.0]
    - Update `updateStatusBar()` in `main.ts` to output:
      - Sim Time, Probe Position `(px, py)`, Probe Speed ($v$), and computed Escape Speed at current height ($v_{\text{esc}} = \sqrt{2GM_p/r}$).
  </action>
  <verify>npm run build</verify>
  <done>
    - Escape launcher preset loads correctly.
    - Sliders render and update state properly.
    - Build completes with no type warnings.
  </done>
</task>

<task type="auto">
  <name>Dynamic Orbit Conic Section Rendering</name>
  <files>
    <file>src/lib/diagrams/GravityDiagram.ts</file>
  </files>
  <action>
    - Implement `drawEscape()` in `GravityDiagram.ts`:
      - Draw the central planet as a radial glowing sphere (e.g., green-blue textured circle) with radius $R_p$ (converted to screen scale).
      - Draw the probe as a small circle (silver/grey) at `(px, py)`.
      - Draw the velocity vector arrow from the probe tip with label showing speed $v$.
      - Draw the probe's historical trail line with alpha-fading.
      - Draw a clean central crosshair marker representing the planet center.
      - If `probeCrashed` is true, render a warning badge:
        - `this.pc.ctx.fillStyle = 'rgba(239, 68, 68, 0.9)'`
        - Draw background banner and write text: `"PROBE CRASH LANDED"` in bold font centered on canvas.
  </action>
  <verify>npm run build</verify>
  <done>
    - Orbit trail, planet sphere, and velocity arrow render with high visual quality.
    - Crash warning banner displays clearly when probe hits surface.
  </done>
</task>

## Success Criteria
- [ ] Slider controls dynamically update planet size and launch trajectory.
- [ ] Specific status values (current speed vs. escape velocity) display in footer.
- [ ] Visual crash alerts function as expected.
