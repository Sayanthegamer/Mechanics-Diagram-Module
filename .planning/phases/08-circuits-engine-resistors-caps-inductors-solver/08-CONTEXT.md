# Phase 8: Circuits Engine (Resistors, Caps, & Inductors Solver) - Context

**Gathered:** 2026-06-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Build a real-time differential equation solver for basic circuits containing DC/AC sources, Resistors ($R$), Capacitors ($C$), Inductors ($L$), and Switches (completing requirement EM-07).
We will port the core matrix analysis and MNA Newton-Raphson circuit solver engine directly from the user's `Sayanthegamer/circuitjs` repository and integrate it as a vanilla TypeScript module in the `Physics-Diagrams` codebase.

</domain>

<decisions>
## Implementation Decisions

### Engine Porting & Integration Strategy
- **D-01:** Port the MNA circuit solver files (`circuit.ts`, `matrix.ts`, `types.ts`, and core elements) from the `Sayanthegamer/circuitjs` scratch clone into a vanilla TS module inside `src/lib/diagrams/circuit/` or similar structure.
- **D-02:** Remove React, eslint, and other frontend-specific dependencies from the ported engine, focusing purely on the mathematical solver.
- **D-03:** Support Resistors ($R$), Capacitors ($C$), Inductors ($L$), Switches, Voltage Sources, and Ground as the initial core components mapped to MNA stamp values.

### Real-Time Solving & Stepping
- **D-04:** Run the circuit solver timestep loop inside the standard animation frame stepping pipeline to update voltages and currents at 60fps.
- **D-05:** Track node voltages and branch currents calculated by the solver and prepare the telemetry data format to interface with the visualization layers in subsequent phases.

### the agent's Discretion
- The choice of time-stepping interval (e.g., standard `5e-6` from the original engine), the file organization structure inside the project library, and the exact naming conventions for variables in the ported code are left to the agent's discretion.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Circuits Solver Requirements
- `ROADMAP.md` §Phase 8 — Goal, dependencies, and success criteria
- `REQUIREMENTS.md` §Circuits Solver Engine — Requirement EM-07

### Porting Sources (Cloned Repository)
- `scratch/circuitjs/circuit-sim/src/engine/circuit.ts` — Core circuit solver and topology analysis class
- `scratch/circuitjs/circuit-sim/src/engine/matrix.ts` — Matrix solver utilities (LU decomposition, LU solve)
- `scratch/circuitjs/circuit-sim/src/engine/types.ts` — Type definitions for elements, nodes, and stampers
- `scratch/circuitjs/circuit-sim/src/engine/elements/` — Element models for resistor, capacitor, inductor, voltage-source, ground, and switch

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scratch/circuitjs/circuit-sim/src/engine/` contains a high-quality MNA engine ready to be ported.
- `PhysicsCanvas`: Can be used for testing telemetry output.

### Established Patterns
- Indentation: 2-space indentation.
- Vanilla TypeScript modules with clear separation between physics/math engines and UI draw loops.

### Integration Points
- Create a new directory `src/lib/diagrams/circuit/` to house the ported files (`circuit.ts`, `matrix.ts`, `types.ts` and element classes) to keep them modular.

</code_context>

<specifics>
## Specific Ideas

- Ensure that any external `console.error` or debugging outputs from the java-to-js ported java dependencies are cleaned up to match the codebase styling guidelines.

</specifics>

<deferred>
## Deferred Ideas

- Schematic Breadboard Canvas UI and dragging components (deferred to Phase 9).
- Oscilloscope Telemetry plot integration (deferred to Phase 10).

</deferred>

---

*Phase: 08-circuits-engine-resistors-caps-inductors-solver*
*Context gathered: 2026-06-10*
