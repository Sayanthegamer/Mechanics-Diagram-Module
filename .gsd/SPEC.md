# SPEC.md — Project Specification

> **Status**: `FINALIZED`

## Vision
To build a premium, textbook-quality, and interactive physics diagram and simulation playground for the web. This tool enables students, educators, and developers to visualize physics problems dynamically from JSON configurations, facilitating better conceptual understanding of classical mechanics, simple harmonic motion, wave behavior, and vector mathematics.

## Goals
1. **Accurate Simulations**: Implement physically and geometrically accurate visual representations of physics scenarios (e.g., inclined wedges with correct angles, friction forces, pulley alignments).
2. **Textbook Aesthetics**: Use premium styling, consistent vector arrow styling (force colors, components, dashed guidelines, arc angles), and real-time state feedback.
3. **Interactive Playground**: Allow real-time parameters tuning via UI sliders, instant preset changes, and direct JSON configuration editing.
4. **Real-time Plotting**: Show live data graphs (e.g., position/velocity/acceleration vs. time, energy conservation, phase space orbits) synchronized with the active simulation.
5. **Robust Architecture**: Maintain a clean, framework-free Vanilla TS module design that is easy to extend.

## Non-Goals (Out of Scope)
- **AI Integration**: No automated AI explanation generator or chat interface within the application.
- **Exporting Features**: No PNG, SVG, or video export functionality.
- **Database/User Accounts**: The application is a purely client-side static site; no server-side persistence or user accounts.

## Users
- **Physics Students & Educators**: Wanting high-fidelity, dynamic, and clean visualizations of standard physics problems (FBDs, SHM, Collisions, Waves).
- **Developers/Writers**: Needing a reference implementation of interactive canvas physics and graphing in vanilla TypeScript.

## Constraints
- **Tech Stack**: Vanilla TypeScript + Vite + Vanilla CSS. No frontend frameworks (React, Vue, Svelte) and no TailwindCSS.
- **Physics Solver**: Numerical step integrations must balance visual stability and real-time responsiveness at standard 60fps.
- **Responsiveness**: The app layout must adjust dynamically to the browser window size and feature premium aesthetics (e.g., glassmorphism, fluid transitions).

## Success Criteria
- [x] Renders FBDs with horizontal, inclined, and suspended geometries, matching input parameters (mass, gravity, mu, angle) and showing components.
- [x] Renders 2D/3D vectors with addition, subtraction, dot product projection, and isometric cross product.
- [x] Simulates spring-mass and pendulum oscillations under damped/driven conditions and displays kinetic/potential/total energy graphs.
- [x] Simulates transverse/longitudinal waves, wave pulse superposition, and standing waves with labeled nodes/antinodes.
- [x] Simulates projectiles with drag, Atwood/inclined pulley systems, and 1D/2D collisions with restoration coefficient and visual collision sparks.
- [x] Zero console warnings/errors, strict type checks pass (`tsc --noEmit`), and dev/production build runs smoothly.
