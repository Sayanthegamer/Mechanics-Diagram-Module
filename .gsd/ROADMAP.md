# ROADMAP.md

> **Current Milestone**: v5.0 (Electromagnetism & Circuits)
> **Goal**: Build an interactive electromagnetism and circuits simulation playground supporting point charge electrostatics, Lorentz force deflection, and real-time AC/DC circuit solving with oscilloscope waveforms.

## Must-Haves
- [ ] **Electrostatics Sandbox**: Draggable point charges ($+q$, $-q$) showing dynamic Coulomb electric field vectors/lines and equipotential curves.
- [ ] **Lorentz Force Particle Tracer**: launching charged particles through uniform magnetic field sectors to show helical, circular, and cycloid motion under $\vec{F} = q(\vec{E} + \vec{v} \times \vec{B})$.
- [ ] **Circuits Solver Engine**: Real-time loop equations solver for DC batteries, AC sinusoidal generators, resistors ($R$), capacitors ($C$), inductors ($L$), and switches.
- [ ] **Oscilloscope Waveforms**: Interactive voltage/current probe plotting in `GraphModule` showing charging curves, phase shifts, and resonance.

## Phases

### Phase 1: Electrostatics Sandbox (Point Charges & Fields)
**Status**: ⬜ Not Started
**Objective**: Implement the `EmDiagram.ts` module with point charge mechanics. Support draggable charges, field vector grids, and equipotential field contours.

### Phase 2: Lorentz Force & Magnetic Deflections
**Status**: ⬜ Not Started
**Objective**: Extend `EmDiagram.ts` to include uniform magnetic fields, particle guns, and trace rendering under Lorentz force kinematics.

### Phase 3: Circuits Engine (Resistors, Caps, & Inductors Solver)
**Status**: ⬜ Not Started
**Objective**: Build a real-time differential equation solver for basic circuits containing DC/AC sources, Resistors ($R$), Capacitors ($C$), Inductors ($L$), and Switches.

### Phase 4: Schematic Breadboard Canvas UI & Parameter Bindings
**Status**: ⬜ Not Started
**Objective**: Render circuit components schematically (resistors, switches, capacitors, inductors, batteries, AC sources) and bind click/drag controls to edit values and toggle switches.

### Phase 5: Oscilloscope Graph Integration, Presets, & Verification
**Status**: ⬜ Not Started
**Objective**: Wire up oscilloscope graphs to `GraphModule`, build presets for RC charging/discharging, RLC resonance, and AC phase lag, and run strict verification tests.

---

Previous milestone phases archived in `.gsd/milestones/v4.0/`
