# Plan 5.1: UI Controls, Thermodynamics Presets, & Real-Time Plots Summary

## What was done
- Registered Thermodynamics preset configurations in `index.html` and `src/main.ts` (`thermo-kinetic-theory`, `thermo-piston-engine`, `thermo-diffusion`).
- Instantiated `ThermoDiagram` at start and wired up step, draw, and reset cycles in the main simulation loop.
- Implemented dynamic sidebar sliders:
  - Kinetic Theory: Temperature ($T$), Particle Count ($N$), Volume ($V$).
  - Piston Engine: Volume ($V$), Process Mode (`isothermal`, `isobaric`, `isochoric`, `adiabatic`), Heat Input (`heating`, `cooling`), Carnot Cycle automation toggle.
  - Diffusion: Barrier open/close toggle.
- Extended `EnergyStatePoint` with pressure `p` and volume `v` history logging.
- Developed real-time plotting modes in `GraphModule`:
  - Kinetic Theory: 2D Rayleigh speed distribution histograms for both heavy and light species overlayed with their theoretical curves.
  - Piston Engine: Pressure-Volume (PV) diagram tracing the state trajectory and highlighting the theoretical color-coded Carnot loop.
  - Diffusion: Live Shannon entropy curve over time vs maximum possible mixing state ($\ln 2$).
- Displayed macroscopic temperature, pressure, and volume parameters inside the status bar.

## Verification
- Strict type check and production builds complete successfully with 0 errors via `npm run verify`.
