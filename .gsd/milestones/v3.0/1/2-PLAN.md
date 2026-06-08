---
phase: 1
plan: 2
wave: 2
---

# Plan 1.2: Keplerian Render & UI Sector Sweeps

## Objective
Hook up the gravitation module to the main application interface, render the elliptical orbit, and implement Kepler's 2nd Law sweeping area animation.

## Context
- .gsd/SPEC.md
- [main.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/main.ts)
- [GravityDiagram.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/diagrams/GravityDiagram.ts)

## Tasks

<task type="auto">
  <name>UI Integration & Preset Setup</name>
  <files>
    <file>src/main.ts</file>
  </files>
  <action>
    - Import GravityDiagram and instantiate it in the main loop.
    - Add a new tab/button for 'Gravity' category.
    - Register gravity presets (e.g., Kepler's ellipse) in the PRESETS map.
    - Hook up sliders for eccentricity, semi-major axis, and simulation speed.
    - Connect the active diagram switch block to route to the Gravity diagram instance.
  </action>
  <verify>npm run build</verify>
  <done>
    - 'Gravity' presets can be selected.
    - Gravity parameter sliders show in the panel.
    - Build succeeds with no warnings.
  </done>
</task>

<task type="auto">
  <name>Elliptical Orbit & Sector Sweeps Render</name>
  <files>
    <file>src/lib/diagrams/GravityDiagram.ts</file>
  </files>
  <action>
    - Update GravityDiagram.draw() to draw a dotted elliptical path representing the orbit.
    - Render the planet orbiting the central star.
    - Implement the "Show Kepler's 2nd Law (Equal Areas)" sweep animation: every fixed interval, store the current angle/position, and draw shaded wedges (sectors) representing the equal area swept.
  </action>
  <verify>npm run build</verify>
  <done>
    - Planet orbits along the ellipse.
    - Shaded wedges representing equal areas sweep at fixed intervals when sector sweeps are enabled.
  </done>
</task>

## Success Criteria
- [ ] Gravity presets load correctly in the browser.
- [ ] Planetary orbit runs dynamically with adjustable eccentricity.
- [ ] Show Kepler's 2nd Law toggle shows colored sectors of equal areas.
