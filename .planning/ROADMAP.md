# Roadmap: Physics Diagrams & Simulators

## Milestones

- ✅ **v1.0 Vectors & FBDs** - Phases 1-2 (Shipped 2026-05-15)
- ✅ **v2.0 SHM & Oscillations** - Phase 3 (Shipped 2026-05-25)
- ✅ **v3.0 Wave Dynamics** - Phase 4 (Shipped 2026-06-01)
- ✅ **v4.0 Fluids, Gravity & Thermodynamics** - Phase 5 (Shipped 2026-06-08)
- 🚧 **v5.0 Electromagnetism & Circuits** - Phases 6-10 (In Progress)

## Past Milestones (Archived)

<details>
<summary>✅ v1.0 to v4.0 MVP & Physics Library Extensions - SHIPPED 2026-06-08</summary>

### Phase 1: Force Vector Systems & Cartesian Vectors

- Shipped. Implemented 2D vector coordinates and nose-to-tail addition visualizers.

### Phase 2: Incline & Suspension Free-Body Diagrams

- Shipped. Implemented block geometries, components drawing, and friction sliding systems.

### Phase 3: Simple Harmonic Motion Integrator

- Shipped. Implemented vertical/horizontal spring damping and pendulum RK4 solvers.

### Phase 4: Wave Propagation & Interference

- Shipped. Implemented transverse/longitudinal oscillators and standing wave nodes.

### Phase 5: Mechanics, Fluids, Orbits & Thermodynamics Playground

- Shipped. Implemented collision sparks, Atwood pulleys, Stokes drag, Kepler sectors, Carnot cycle transitions, gas diffusion entropy, and live plots.

</details>

## 🚧 v5.0 Electromagnetism & Circuits (In Progress)

**Milestone Goal:** Build an interactive electromagnetism and circuits simulation playground supporting point charge electrostatics, Lorentz force deflection, and real-time AC/DC circuit solving with oscilloscope waveforms.

### Phase 6: Electrostatics Sandbox (Point Charges & Fields)

**Goal**: Implement the `EmDiagram.ts` module with point charge mechanics. Support draggable charges, field vector grids, and equipotential field contours.
**Depends on**: Phase 5
**Requirements**: EM-01, EM-02, EM-03, EM-04
**Success Criteria** (what must be TRUE):

  1. User can click and drag positive/negative charges on the canvas, showing their coordinates updating.
  2. Canvas renders a dynamic vector grid representing electric field vectors E.
  3. Canvas draws smooth field lines originating from positive and terminating on negative charges.
  4. Canvas draws equipotential contours representing constant electric potentials V.

**Plans**: 2 plans

- [ ] 06-01-PLAN.md — Configure types, integrate EmDiagram core, build charge interaction UI & custom controls
- [x] 06-02-PLAN.md — Implement field vector grids, RK2 integration, and equipotential contouring

### Phase 7: Lorentz Force & Magnetic Deflections

**Goal**: Extend `EmDiagram.ts` to include uniform magnetic fields, particle guns, and trace rendering under Lorentz force kinematics.
**Depends on**: Phase 6
**Requirements**: EM-05, EM-06
**Success Criteria** (what must be TRUE):

  1. Particle gun fires customizable charges into the magnetic field.
  2. Trails of fired particles trace perfect circles, helices, and cycloids.

**Plans**: 2 plans

- [x] 07-01-PLAN.md — Types, config, manual sidebar controls & aim/reposition gun interaction on canvas
- [x] 07-02-PLAN.md — Lorentz RK4 Integration Step, trail rendering, background B-field visual modes, collisions, and telemetry

### Phase 8: Circuits Engine (Resistors, Caps, & Inductors Solver)

**Goal**: Build a real-time differential equation solver for basic circuits containing DC/AC sources, Resistors ($R$), Capacitors ($C$), Inductors ($L$), and Switches.
**Depends on**: Phase 7
**Requirements**: EM-07
**Success Criteria** (what must be TRUE):

  1. Circuit solver resolves loop equations and computes node potentials/loop currents in real-time.

**Plans**: 2 plans

- [x] 08-01-PLAN.md — Port matrix solver, types, serialization and element base classes
- [x] 08-02-PLAN.md — Port Circuit solver engine and integrate stepping loops

### Phase 9: Schematic Breadboard Canvas UI & Parameter Bindings

**Goal**: Render circuit components schematically (resistors, switches, capacitors, inductors, batteries, AC sources) and bind click/drag controls to edit values and toggle switches.
**Depends on**: Phase 8
**Requirements**: EM-08
**Success Criteria** (what must be TRUE):

  1. User can click components to edit values or click switches to toggle open/closed state.
  2. Canvas displays standard electrical schematics dynamically.

**Plans**: 2 plans

- [x] 09-01-PLAN.md — Port drawing routines, voltage potential color mapping, and current animation dots
- [x] 09-02-PLAN.md — Implement click/drag canvas interaction, selection highlights, and parameter bindings

### Phase 10: Oscilloscope Graph Integration & Verification

**Goal**: Wire up oscilloscope graphs to `GraphModule`, build presets for RC charging/discharging, RLC resonance, and AC phase lag, and run strict verification tests.
**Depends on**: Phase 9
**Requirements**: EM-09
**Success Criteria** (what must be TRUE):

  1. Secondary graph plots real-time voltage/current oscilloscope curves.
  2. Transient charging, resonance, and AC phase differences are visually verified.

**Plans**: TBD

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Vectors | v1.0 | 2/2 | Complete | 2026-05-15 |
| 2. FBDs | v1.0 | 2/2 | Complete | 2026-05-15 |
| 3. SHM | v2.0 | 2/2 | Complete | 2026-05-25 |
| 4. Waves | v3.0 | 2/2 | Complete | 2026-06-01 |
| 5. Mechanics/Thermo | v4.0 | 5/5 | Complete | 2026-06-08 |
| 6. Electrostatics | v5.0 | 2/2 | Complete    | 2026-06-10 |
| 7. Lorentz Force | v5.0 | 2/2 | Complete   | 2026-06-10 |
| 8. Circuit Engine | v5.0 | 2/2 | Complete   | 2026-06-10 |
| 9. Schematic UI | v5.0 | 2/2 | Complete | 2026-06-11 |
| 10. Oscilloscope | v5.0 | 0/0 | Not started | - |

---
*Roadmap defined: 2026-06-10*
*Last updated: 2026-06-10 after initialization*
