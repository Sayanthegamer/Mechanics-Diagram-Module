# Phase 9: Schematic Breadboard Canvas UI & Parameter Bindings - Context

**Gathered:** 2026-06-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Render circuit components schematically (resistors, switches, capacitors, inductors, batteries, AC sources, wires, grounds) on the canvas. Bind mouse/touch interactions to allow toggling switch states, selecting components to highlight them, and binding selected component variables to side-panel control sliders.

</domain>

<decisions>
## Implementation Decisions

### Schematic Renderer Integration
- **D-01:** Port drawing routines from `scratch/circuitjs/circuit-sim/src/renderer/element-renderers.ts` and house them directly in a new self-contained rendering class `CircuitDiagram` at `src/lib/diagrams/CircuitDiagram.ts`.
- **D-02:** Use the standard dynamic voltage coloring scheme from `scratch/circuitjs/circuit-sim/src/renderer/voltage-colors.ts` (wires and components colored green/gray for 0V/ground, fading to bright red for positive potentials, and fading to bright blue for negative potentials).
- **D-03:** Port the moving current flow dots algorithm from `scratch/circuitjs/circuit-sim/src/renderer/current-dots.ts`. Animate the dots along wires and components at a speed proportional to the computed current magnitude and direction matching the current flow.

### Interaction & Parameter Bindings
- **D-04:** Allow users to click switches directly on the canvas to toggle their open/closed state, triggering immediate topological parsing and solver matrix recalculations.
- **D-05:** Implement component selection on click. When a component (e.g. resistor, capacitor, inductor, voltage source) is selected, highlight it visually on the canvas and dynamically bind its parameter values (e.g. resistance, capacitance) to the sidebar control sliders for real-time adjustments.

### the agent's Discretion
- Canvas highlighting styles for selected components.
- Default scaling factors and grid margins on the breadboard display.
- Visual speeds and densities of animated current flow dots.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Source Renderers
- `scratch/circuitjs/circuit-sim/src/renderer/element-renderers.ts` — Component outline rendering functions.
- `scratch/circuitjs/circuit-sim/src/renderer/current-dots.ts` — Animation math for moving charge particles.
- `scratch/circuitjs/circuit-sim/src/renderer/voltage-colors.ts` — Potentials-to-color mapping.

### Main Controller
- `src/main.ts` — Dynamic sliders rendering and interaction callbacks to extend.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PhysicsCanvas`: Contains coordinate mapping conversions (`toScreen`, `toPhysics`), line/grid drawing helpers, and basic themes.
- `Circuit` (`src/lib/diagrams/circuit/circuit.ts`): Holds active solver states, node potentials, component matrices, and step runners.

### Established Patterns
- Coordinate systems are rounded to nearest integers to build node-connection graphs.
- Real-time simulation loop triggers `step()` and `draw()` on active configs at 60fps.

### Integration Points
- `src/main.ts`: Event listeners for interaction `mousedown`/`mousemove`/`mouseup` and preset loaders.

</code_context>

<deferred>
## Deferred Ideas

- Full component toolbox drawer to add/remove components dynamically (deferred to future backlog; current focus is on preset configurations interaction).

</deferred>

---

*Phase: 09-schematic-breadboard-canvas-ui-parameter-bindings*
*Context gathered: 2026-06-11*
