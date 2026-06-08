# ROADMAP.md

> **Current Milestone**: v4.0 (Thermodynamics & Kinetic Theory)
> **Goal**: Build an interactive thermodynamic simulation sandbox including 2D gas molecular dynamics (Maxwell-Boltzmann distribution), thermodynamic processes (Isothermal, Isobaric, Isochoric, Adiabatic), Carnot engine cycles on PV diagrams, and statistical entropy diffusion.

## Must-Haves
- [ ] **Kinetic Theory of Gases**: 2D molecular dynamics simulation with elastic particle-particle and particle-wall collisions, supporting Temperature ($T$), Volume ($V$), and Number of Particles ($N$) sliders.
- [ ] **Thermodynamic Processes & Engine Cycles**: Animated piston chamber demonstrating Isothermal, Isobaric, Isochoric, and Adiabatic transitions, with preset automation for Carnot cycles.
- [ ] **PV Diagram & Curve Plotting**: Real-time plots for Pressure-Volume curves (PV diagrams) and Maxwell-Boltzmann molecular velocity distribution curves.
- [ ] **Entropy & Diffusion**: Two-chamber gas diffusion simulation modeling the Second Law of Thermodynamics, plotting mixing entropy over time.

## Phases

### Phase 1: 2D Gas Molecular Dynamics & Particle Physics
**Status**: ✅ Complete
**Objective**: Build a high-performance 2D particle-collision engine in a customizable container to simulate pressure, volume, and temperature relations.

### Phase 2: Piston Engine Mechanics & Thermodynamic Processes
**Status**: ⬜ Not Started
**Objective**: Implement the movable piston chamber and solve the equations of state for Isothermal, Isobaric, Isochoric, and Adiabatic processes.

### Phase 3: Carnot Cycles & State Diagrams
**Status**: ⬜ Not Started
**Objective**: Implement automated closed-cycle engine presets (Carnot cycle) and coordinate mapping for thermodynamic state tracking.

### Phase 4: Statistical Entropy & Gas Diffusion
**Status**: ⬜ Not Started
**Objective**: Implement a split-chamber container with different gas species, simulating barrier removal, molecular mixing, and real-time entropy calculation.

### Phase 5: UI Panel Controls, Plots, & Polish
**Status**: ⬜ Not Started
**Objective**: Integrate control sliders, real-time graph plotting for PV diagrams/distributions/entropy, and verify compilation and performance at 60fps.
