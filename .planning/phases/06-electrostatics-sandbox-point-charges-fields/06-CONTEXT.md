# Phase 6: Electrostatics Sandbox (Point Charges & Fields) - Context

**Gathered:** 2026-06-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement the interactive electrostatics sandbox and field renderer in the EmDiagram.ts module. Supports point charge mechanics, draggable charges, field vector grids, field lines, and equipotential field contours.

</domain>

<decisions>
## Implementation Decisions

### Interaction & Charge Controls
- **D-01:** Add "Add Positive (+q)" and "Add Negative (-q)" buttons to the controls sidebar/panel.
- **D-02:** Support dragging charges on the canvas directly via mouse/touch interaction.
- **D-03:** When a charge is selected, display its coordinates and a magnitude adjustment slider (spanning -10nC to +10nC) in the control panel, along with a "Delete" button.

### Electric Field Vector Grid
- **D-04:** Render a grid of field vector arrows with a 30px spacing.
- **D-05:** Arrow length should scale using a non-linear (logarithmic or clamped arctan) mapping so arrows near charges do not dominate the canvas.
- **D-06:** Fade arrow opacity in very weak field regions to reduce visual noise.

### Field Lines Density & Integration
- **D-07:** Draw field lines originating from positive charges and terminating on negative charges or going off-screen.
- **D-08:** Draw exactly 8 field lines per unit charge (e.g., 8 lines for a +1nC charge, 16 lines for a +2nC charge).
- **D-09:** Integrate field lines using Euler or RK2 path tracing, starting slightly outside the charge radius and stopping when hitting an opposite charge's boundary or going far off-screen.

### Equipotential Contours Rendering
- **D-10:** Render smooth equipotential isolines representing constant electric potential at fixed intervals (e.g., ±10V, ±20V, ±50V).
- **D-11:** Render these contours as thin, semi-transparent green/teal lines so they do not clutter the field lines.

### the agent's Discretion
- The details of the RK2 integrator step sizes and the exact threshold for charge selection radius are left to the agent's discretion.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Electrostatics Sandbox Requirements
- `ROADMAP.md` §Phase 6 — Goal, depends on, and success criteria
- `REQUIREMENTS.md` §Electrostatics Sandbox — Requirements EM-01, EM-02, EM-03, EM-04

### Existing Code base & Conventions
- `.planning/codebase/CONVENTIONS.md` — Radian conversions, config setters, draw loop structure
- `src/lib/diagrams/EmDiagram.ts` — Existing module placeholder code to be extended

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PhysicsCanvas`: Used to translate between world and screen coordinates (`toScreen`/`toWorld`) and handle drawing loops.
- `EmDiagram`: Existing class skeleton in `src/lib/diagrams/EmDiagram.ts` with `getPotentialAt` and `getFieldAt` helpers.

### Established Patterns
- TS classes for diagrams: Implement `setConfig()`, `resetState()`, `step(dt)`, and `draw(canvas)`.
- Semicolons and 2-space indentation in TypeScript code.

### Integration Points
- `EmDiagram` needs to be initialized and integrated within `src/main.ts` so the user can select it from the sidebar or presetted options.

</code_context>

<specifics>
## Specific Ideas

- Highlight selected charge with a glowing dashed circle to indicate active selection.
- Follow the color scheme: Red/orange for positive charges, Blue for negative charges.

</specifics>

<deferred>
## Deferred Ideas

- Lorentz deflection kinematics and moving charge dynamics (deferred to Phase 7).

</deferred>

---

*Phase: 06-electrostatics-sandbox-point-charges-fields*
*Context gathered: 2026-06-10*
