# Phase 10: Oscilloscope Graph Integration & Verification - Context

**Gathered:** 2026-06-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire up secondary graph canvas to function as an oscilloscope plotter. Render transient charging curves, AC phase shifts, and resonant waveforms using virtual voltage/current probes. Build presets for RC charging/discharging, RLC resonance, and AC phase lag, and run strict verification tests.

</domain>

<decisions>
## Implementation Decisions

### Probe Target Selection
- **D-06:** Implement *Preset-Defaults with Selection Overrides*. Each preset loads with predefined default channels (e.g. source voltage vs. capacitor voltage). When a component is selected, the oscilloscope dynamically overrides the curves to plot that component's differential voltage ($V_{diff}$) and current ($I$). Clicking empty space clears the selection and reverts the plot to preset defaults.

### Oscilloscope Channels and Scale Rendering
- **D-07:** Scale Channel A (voltage) and Channel B (current) independently to fit the graph height. This avoids dual Y-axis clutter while ensuring both waveforms remain highly visible. The legends will dynamically show the live values and units (V, mA) corresponding to each curve.

### Oscilloscope XY Plotting Mode
- **D-08:** Support XY mode plotting (plotting one channel against the other) for AC presets. This allows users to visualize phase shifts as circles or ellipses (Lissajous curves) when selected from the dropdown list.

### AC Sweep and Resonance Peak
- **D-09:** Standard transient plots are sufficient for the RLC preset. Real-time updates to the frequency slider will dynamically update the transient waveform on the graph, demonstrating resonance (amplitude peaking) in real-time.

### the agent's Discretion
- Graph line thicknesses and custom colors for Channel A and Channel B curves.
- Time-axis division ticks and zoom controls on the time-base.
- Layout and styling of the XY mode plot grids.

</decisions>

<specifics>
## Specific Ideas

- "We want to see the classic RC charging curves where voltage rises and current spikes then decays."
- "Lissajous curves in XY mode are extremely premium for showing phase differences under AC sine wave excitation."

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Graphics Plotting
- `src/lib/diagrams/GraphModule.ts` — Contains the graph rendering engine and `drawCircuit()` method.

### Main Controller
- `src/main.ts` — Orchestrates the active preset updates and ticks the circuit histories.

### Circuits Engine
- `src/lib/diagrams/circuit/circuit.ts` — Manages simulation stepping and node potential updates.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `GraphModule.drawCircuit(history)`: already implemented to plot node voltages relative to ground.
- `circuitHistory` array: accumulates simulation time and node voltages.

### Established Patterns
- Coordinate systems are rounded to nearest integers to build node-connection graphs.
- Telemetry buffer histories are capped at 500 points to prevent memory leaks.

### Integration Points
- `src/main.ts`: `circuitHistory` pushes nodes data, and `drawActiveSimulation()` triggers `graphModule.drawCircuit(circuitHistory)`.

</code_context>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope.

</deferred>

---

*Phase: 10-oscilloscope-graph-integration-verification*
*Context gathered: 2026-06-11*
