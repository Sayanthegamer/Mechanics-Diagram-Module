# Architecture Decision Records (ADRs)

This document logs key architectural decisions made during the development of the Physics Diagrams & Simulation Module.

---

## ADR 01: Core Architecture & Rendering Engine
- **Status**: `ACCEPTED`
- **Date**: 2026-06-07

### Context
We need to render highly detailed, interactive, and textbook-quality physics diagrams (FBDs, spring-mass systems, waves, projectiles, collisions, pulleys) in the browser.

### Decision
Use vanilla TypeScript, HTML5 Canvas 2D API, and vanilla CSS:
- No visual frameworks (React, Vue, Svelte) to keep dependencies zero and page load instant.
- Canvas 2D context is chosen for its simplicity, pixel-perfect layout controls, custom transformation matrix options, and vector arrow math execution performance.
- Vanilla CSS allows custom glassmorphism panels, CSS variables for dark/light themes, and CSS grids/flexbox for side-by-side canvas dashboards.

### Consequences
- **Pros**: Lightning-fast loading speed, zero build complexity, absolute visual control over vector arrows/pulley geometry.
- **Cons**: UI elements (sliders, inputs) must be managed using vanilla DOM event listeners; no virtual DOM state synchronization.

---

## ADR 02: Scoping Constraints (No AI, No Exports)
- **Status**: `ACCEPTED`
- **Date**: 2026-06-07

### Context
The application needs to focus engineering resources strictly on visual polish, physics correctness, and real-time state plotting.

### Decision
Omit AI capabilities (such as automated diagram explanation generation) and PNG/SVG export options.

### Consequences
- **Pros**: Reduced dependency footprint, zero backend endpoints, simpler security posture, and direct focus on layout/coordinate math.
- **Cons**: Users cannot save/download diagrams directly; they must capture screenshots.
