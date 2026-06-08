# Debug Session: Missing Thermodynamics UI Presets

## Symptom
No options, sliders, presets, or canvas elements related to thermodynamics are visible on the website.

**When:** Upon loading the index.html/main.ts page.
**Expected:** The user should see a "Thermodynamics" option in the simulator diagram type dropdown, along with presets (Kinetic Theory, Piston Engine, Carnot Cycle, Diffusion).
**Actual:** The dropdown options only contain FBD, Vectors, SHM, Waves, Mechanics, Fluids, and Gravity. No references to "Thermo" exist in the UI.

## Hypotheses

| # | Hypothesis | Likelihood | Status |
|---|------------|------------|--------|
| 1 | The UI panel integration, presets, and plotting wiring are scheduled for Phase 5 | 100% | CONFIRMED |
| 2 | `ThermoDiagram.ts` is not registered or imported inside the main application entrypoint `src/main.ts` | 100% | CONFIRMED |

## Resolution

**Root Cause:**
This is not a bug. Rather, it is the expected state of the codebase at the end of Phase 4.
The roadmap specifies Phase 5 (UI Panel Controls, Plots, & Polish) as the phase responsible for:
1. Registering the `'thermo'` type in `src/main.ts`.
2. Initializing `ThermoDiagram` on the canvas.
3. Adding the sidebar UI panel sliders (temperature, volume, heat input, particle count).
4. Wiring up the real-time PV plotting graph canvas.

**Fix:**
Proceed to Phase 5 to implement the UI panels, wire the presets, and register `ThermoDiagram` in `src/main.ts`.
