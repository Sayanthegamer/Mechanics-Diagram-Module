---
phase: 5
plan: 1
wave: 1
---

# Plan 5.1: UI Controls, Thermodynamics Presets, & Real-Time Plots

## Objective
Integrate control sliders for temperature, particles, and volume, register thermodynamic presets, and implement three real-time plotting modes (Rayleigh velocity distribution, PV state diagrams, and Shannon entropy over time) inside `GraphModule`.

## Context
- .gsd/SPEC.md
- .gsd/phases/5/RESEARCH.md
- [index.html](file:///c:/Users/Anon/Desktop/Physics-Diagrams/index.html)
- [main.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/main.ts)
- [types.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/types.ts)
- [ThermoDiagram.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/diagrams/ThermoDiagram.ts)
- [GraphModule.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/diagrams/GraphModule.ts)

## Tasks

<task type="auto">
  <name>Register Presets and Import ThermoDiagram in Main Application</name>
  <files>
    <file>index.html</file>
    <file>src/main.ts</file>
  </files>
  <action>
    - In `index.html`, add a select option group for "Thermodynamics & Kinetic Theory" containing:
      - `thermo-kinetic-theory` (Kinetic Theory of Gases)
      - `thermo-piston-engine` (Thermodynamic Piston & Processes)
      - `thermo-diffusion` (Statistical Gas Diffusion)
    - In `src/main.ts`:
      - Import `ThermoDiagram` from `./lib/diagrams/ThermoDiagram`.
      - Define three new presets in the `PRESETS` map matching `ThermoConfig` type:
        - `thermo-kinetic-theory`: mode `'kinetic-theory'`, temperature 3.0, particleCount 100, volume 3.0, showDistribution true, showEntropy false, autoCycle false.
        - `thermo-piston-engine`: mode `'piston-engine'`, temperature 3.0, particleCount 60, volume 3.0, showDistribution false, showEntropy false, autoCycle false.
        - `thermo-diffusion`: mode `'diffusion'`, temperature 3.0, particleCount 120, volume 3.0, showDistribution false, showEntropy true, autoCycle false.
      - Declare `let thermoDiagram: ThermoDiagram;` at the file level.
      - In `init()`, instantiate `thermoDiagram = new ThermoDiagram(pc)`.
      - In `stepSimulation(dt)`, add case for `activeConfig.type === 'thermo'` calling `thermoDiagram.step(dt)`.
      - In `drawActiveSimulation()`, add case for `activeConfig.type === 'thermo'` calling `thermoDiagram.draw()`.
      - In `resetSimulation()`, add case for `activeConfig.type === 'thermo'` calling `thermoDiagram.resetState()`.
      - Update `updateTitles()` to set custom titles for thermodynamics diagrams.
      - In `updateStatusBar()`, render Sim Time, current Temperature, Pressure, and Volume for `'thermo'` diagrams.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>
    - `index.html` preset list contains the new thermodynamic presets.
    - `main.ts` successfully imports, instantiates, and executes step/draw cycles for `ThermoDiagram`.
  </done>
</task>

<task type="auto">
  <name>Implement Sidebar Sliders and Control Handlers for Thermodynamics</name>
  <files>
    <file>src/main.ts</file>
  </files>
  <action>
    - Add a branch in `renderSliders(config)` for `config.type === 'thermo'`:
      - If mode is `'kinetic-theory'`:
        - Temperature slider (0.5 to 10.0, step 0.1)
        - Particle Count slider (10 to 150, step 5) -> resets state when changed
      - If mode is `'piston-engine'`:
        - Add a Process select input or slider to switch process mode (`'none' | 'isothermal' | 'isobaric' | 'isochoric' | 'adiabatic'`).
        - Add a Heat Transfer input or slider (`'none' | 'heating' | 'cooling'`).
        - Volume slider (1.0 to 5.0, step 0.1)
        - Carnot Cycle toggle slider or checkbox (0 = manual, 1 = auto Carnot loop).
      - If mode is `'diffusion'`:
        - Add a button or toggle slider to open / close the barrier (triggering `thermoDiagram.openBarrier()` and `thermoDiagram.closeBarrier()`).
        - Particle Count slider (10 to 150, step 5) -> resets state when changed
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>
    - Dynamic sidebar renders relevant inputs and sliders corresponding to the active thermodynamic mode.
    - State updates appropriately on interactive adjustments.
  </done>
</task>

<task type="auto">
  <name>Implement Real-Time Plotting in GraphModule</name>
  <files>
    <file>src/lib/diagrams/GraphModule.ts</file>
    <file>src/lib/diagrams/ThermoDiagram.ts</file>
    <file>src/main.ts</file>
  </files>
  <action>
    - Update `EnergyStatePoint` inside `GraphModule.ts` to include optional properties: `p?: number; v?: number;`.
    - In `ThermoDiagram.ts`, push `p: this.pressure` and `v: this.volume` in `this.history.push`.
    - In `GraphModule.ts`, implement `public drawThermo(diagram: ThermoDiagram)`:
      - If mode is `'kinetic-theory'`:
        - Render 2D velocity distribution histogram:
          - Speed range $v \in [0, 10.0]$, 20 bins.
          - Calculate particle speeds and increment the respective bin count.
          - Draw the histogram as semitransparent teal rectangles (`rgba(34, 211, 238, 0.4)`).
          - Calculate and plot the theoretical 2D Rayleigh distribution curves for Species A ($m_A=4.0$) and Species B ($m_B=1.0$) using the current temperature:
            $$f(v) = \frac{m v}{T} e^{-\frac{m v^2}{2 T}}$$
            Scale and draw them as red and blue line paths.
      - If mode is `'piston-engine'`:
        - Render Pressure-Volume (PV) diagram:
          - Draw axes (X: Volume $V$, Y: Pressure $P$).
          - Plot the historical trace of `(v, p)` from `diagram.history`.
          - If `diagram.autoCycle` is true, draw the complete theoretical Carnot loop path using `diagram.getCarnotLoopPoints()`, highlighted in stages.
          - Draw a bright, glowing tracking dot at the current `(volume, pressure)` position.
      - If mode is `'diffusion'`:
        - Render Shannon Entropy of Mixing over time:
          - Set X scale to time, Y scale to entropy (0.0 to 1.0).
          - Plot `diagram.entropyHistory` as a smooth line.
          - Add a reference dashed line at the theoretical maximum mixing entropy $S_{\text{max}} = \ln(2) \approx 0.693$.
    - Wire `drawActiveSimulation()` in `src/main.ts` to call `graphModule.drawThermo(thermoDiagram)` when `activeConfig.type === 'thermo'`.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>
    - Rayleigh velocity curves, PV tracing with Carnot paths, and Shannon entropy plots render smoothly and accurately at 60fps.
  </done>
</task>

## Success Criteria
- [ ] New thermodynamics presets are fully selectable and responsive in the UI.
- [ ] Slide controls update variables dynamically and trigger simulation resets where necessary.
- [ ] Graph canvases render state-appropriate visualizations (distributions, PV loops, entropy histories).
- [ ] No compilation errors and flawless performance.
