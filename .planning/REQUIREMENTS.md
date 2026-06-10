# Requirements: Physics Diagrams & Simulators

**Defined:** 2026-06-10
**Core Value:** To deliver mathematically, physically, and geometrically accurate visual simulations of physics concepts with premium aesthetic styling and real-time synchronized telemetry graphs.

## v1 Requirements

### Electrostatics Sandbox

- [x] **EM-01**: User can add, select, and drag positive ($+q$) and negative ($-q$) point charges on the canvas.
- [x] **EM-02**: Sandbox displays vector arrows on a grid representing electric field intensity and direction at discrete points.
- [x] **EM-03**: Sandbox displays field lines originating from positive charges and terminating on negative charges or extending to infinity.
- [x] **EM-04**: Sandbox renders equipotential curves as smooth isolines representing constant electric potential.

### Lorentz Deflection Tracer

- [ ] **EM-05**: Particle gun component launches charged test particles into uniform magnetic field regions.
- [ ] **EM-06**: Test particles trace circular, helical, or cycloidal paths depending on velocity vector and field parameters.

### Circuits Solver Engine

- [ ] **EM-07**: Solver engine computes dynamic loop equation values (currents, voltages) for resistor ($R$), capacitor ($C$), and inductor ($L$) networks.
- [ ] **EM-08**: Solver supports interactive switch component clicks to open/close loops.

### Oscilloscope Plots

- [ ] **EM-09**: GraphModule renders transient charging curves, AC phase shifts, and resonant waveforms from virtual voltage/current probes.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Interactive AI Explanations | Focus is on clean visual playground, avoiding prompt latency and token overhead. |
| Media Exporter (PNG/SVG/MP4) | Can be done via standard browser screenshots/recordings; not core to simulator. |
| User DB / Persistent Custom Layouts | Offline-first client-side app; parameters are saved via JSON code configurations. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| EM-01 | Phase 1 | Complete |
| EM-02 | Phase 1 | Complete |
| EM-03 | Phase 1 | Complete |
| EM-04 | Phase 1 | Complete |
| EM-05 | Phase 2 | Pending |
| EM-06 | Phase 2 | Pending |
| EM-07 | Phase 3 | Pending |
| EM-08 | Phase 4 | Pending |
| EM-09 | Phase 5 | Pending |

**Coverage:**

- v1 requirements: 9 total
- Mapped to phases: 9
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-10*
*Last updated: 2026-06-10 after initialization*
