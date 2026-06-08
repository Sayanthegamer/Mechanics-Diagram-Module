---
phase: 2
plan: 2
wave: 2
---

# Plan 2.2: Two-Body UI and Render Settings

## Objective
Connect Two-Body presets and parameter sliders in `main.ts`, and implement the binary rendering displaying orbital trails and barycenter vectors.

## Context
- .gsd/SPEC.md
- [main.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/main.ts)
- [GravityDiagram.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/diagrams/GravityDiagram.ts)

## Tasks

<task type="auto">
  <name>UI Slider Configuration & Presets</name>
  <files>
    <file>src/main.ts</file>
  </files>
  <action>
    - Add 'gravity-twobody' preset in the PRESETS map in main.ts.
    - Update index.html to add "Gravity: Two-Body Barycentric Orbit" to the dropdown options.
    - Update main.ts renderSliders() to inject sliders for Two-Body mode: Mass Ratio (m2/m1), Initial Distance, and Initial Velocity.
    - Update main.ts updateStatusBar() to output the positions of both bodies, current velocities, and the barycenter coordinates (0, 0).
  </action>
  <verify>npm run build</verify>
  <done>
    - Two-Body preset appears in dropdown and loads successfully.
    - Mass ratio, separation distance, and launch velocity sliders show in parameter panel.
    - Compilation passes without warnings.
  </done>
</task>

<task type="auto">
  <name>Orbit Trails & Barycenter Rendering</name>
  <files>
    <file>src/lib/diagrams/GravityDiagram.ts</file>
  </files>
  <action>
    - Update GravityDiagram.draw() to handle Two-Body mode:
      1. Draw a small "+" crosshair symbol at the focus origin (0, 0) representing the barycenter.
      2. Render faded orbital trail lines for both bodies.
      3. Render both orbiting bodies as circles with radius proportional to their masses, with mass text labeled.
      4. Render velocity arrows for both bodies using their respective velocities.
  </action>
  <verify>npm run build</verify>
  <done>
    - Two bodies orbit each other stably.
    - Faded path trails render correctly behind both bodies.
    - Center of mass crosshair marker (+) is drawn at (0, 0).
  </done>
</task>

## Success Criteria
- [ ] User can adjust mass ratio and launch velocity in the UI sidebar.
- [ ] Orbit trails trace ellipses of varying sizes based on mass ratio.
- [ ] Star and planet circles render with proportional sizes and mass labels.
