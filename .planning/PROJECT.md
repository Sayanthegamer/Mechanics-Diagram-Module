# Physics Diagrams & Simulators

## What This Is
An interactive, high-fidelity, textbook-quality physics diagram and simulation playground for the web. It is designed for Class 11th/12th students, JEE/NEET aspirants, and educators to visualize classical mechanics, waves, thermodynamics, and electromagnetism topics.

## Core Value
To deliver mathematically, physically, and geometrically accurate visual simulations of physics concepts with premium aesthetic styling and real-time synchronized telemetry graphs.

## Requirements

### Validated
- ✓ FBD simulations (horizontal, inclined, suspended block geometries) — v1.0
- ✓ 2D/3D Vector math visualizer (addition, nose-to-tail, dot projection, isometric cross product) — v1.0
- ✓ Simple Harmonic Motion solver (horizontal/vertical springs, simple pendulums with damping/driving forces) — v2.0
- ✓ Wave dynamics (transverse, longitudinal, superposition pulses, standing waves) — v3.0
- ✓ Classical mechanics (projectile drag, Atwood/inclined pulleys, 1D/2D collisions, circular motion) — v4.0
- ✓ Fluid mechanics (buoyancy lab, Pascal press, Bernoulli pipe flow, viscous drag Stokes' law) — v4.0
- ✓ Gravity & Orbits (Keplerian sectors, barycentric two-body orbits, escape velocity launcher) — v4.0
- ✓ Thermodynamics & Kinetic Theory (2D bi-disperse gas, piston engine isothermal/isobaric/isochoric/adiabatic processes, Carnot cycle, gas diffusion entropy) — v4.0
- ✓ Real-time synchronized graphs (kinematics, energy conservation, phase-space orbits, PV diagrams, TS diagrams, Rayleigh speed histograms) — v4.0
- ✓ Electrostatics sandbox supporting draggable point charges, dynamic Coulomb electric field vectors/lines, and equipotential curves — v5.0
- ✓ Lorentz deflection tracer displaying trajectories of charged particles in uniform magnetic fields under Lorentz force kinematics — v5.0
- ✓ Circuits solver engine calculating DC/AC currents and voltages in RLC networks with interactive switches — v5.0
- ✓ Oscilloscope waveform plotter rendering voltage and current probe telemetry in real-time — v5.0

### Active
- None (All current milestone requirements completed)

### Out of Scope
- AI explanations, tutors, or interactive chatbots inside the web UI — to keep client load minimal.
- PNG/SVG export or video exporting features — focus is purely interactive visualization.
- Server-side database, user logins, and cloud-saved custom layouts — offline-first static page.

## Context
The project is built as a highly responsive single-page web app. It provides student/educator interactive controls via sidebars, dynamic code editor config overrides, and dual canvases. Milestone v5.0 (Electromagnetism & Circuits) is successfully completed and shipped.

## Constraints
- **Tech Stack**: Vanilla TypeScript + Vite + Vanilla CSS. No frontend UI frameworks (React, Vue, Svelte) and no TailwindCSS to maintain complete dependency-free control.
- **Performance**: High-fidelity integrations and field calculations must execute efficiently within a single-threaded animation frame loop at 60fps.
- **Aesthetics**: Textbook-quality visual assets using HSL customized dark themes, Outfit/JetBrains typography, and smooth micro-animations.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| No external UI libraries | Direct Canvas2D and vanilla DOM manipulation is lightweight and keeps bundle size extremely small | ✓ Good |
| In-memory telemetry histories | Sized arrays with a 500-point ceiling prevent memory leaks while keeping graph plotting smooth | ✓ Good |
| Standardized degrees to radians | Uniformly handling angle parameters in degrees in the config and converting internally via `Math.PI / 180` simplifies JSON configuration | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-10 after initialization*
