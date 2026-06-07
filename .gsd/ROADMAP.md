# ROADMAP.md

> **Current Phase**: Phase 3 (Completed)
> **Milestone**: v1.0 (Released & Polished)

## Must-Haves (from SPEC)
- [x] HTML5 Canvas coordinate transform system with grids (`PhysicsCanvas.ts`)
- [x] Free Body Diagram (FBD) rendering for horizontal, inclined, and suspended states
- [x] Vector algebra visualizer (addition, subtraction, dot product projection, 3D cross product)
- [x] Simple Harmonic Motion (SHM) simulator with springs and pendulums
- [x] Wave physics simulator (transverse, longitudinal, wave pulse superposition, standing waves)
- [x] Mechanics solver (air drag projectiles, pulleys, 1D/2D collisions with sparks)
- [x] Sync'd real-time plotting engine (`GraphModule.ts`)
- [x] Bottom status bar and playground sidebar parameter tuning UI

---

## Phases

### Phase 1: Foundation (Core Engine)
**Status**: 🟩 Completed
**Objective**: Build the initial bundler configuration, common canvas coordinate mapping systems, grid drawing utilities, and dashboard UI layout.
- [x] Init TypeScript + Vite project
- [x] Create custom glassmorphism style rules in `style.css`
- [x] Develop Y-up Cartesian transform helpers in `PhysicsCanvas.ts`
- [x] Integrate basic sidebar layout in `index.html`

### Phase 2: Core Physics Engines
**Status**: 🟩 Completed
**Objective**: Implement math/simulation classes for all five major categories.
- [x] Vector diagrams with component projections and isometric 3D math
- [x] Free Body Diagrams with Euler-solver block movement
- [x] Oscillating SHM systems (masses and pendulums) with energy tracking
- [x] Particle wave models (sine waves, pulses)
- [x] Macroscopic mechanics (projectiles, pulleys, collisions)

### Phase 3: Visual Polish & Math Accuracy
**Status**: 🟩 Completed
**Objective**: Address edge cases, visually fine-tune the animations, and fix inaccuracies.
- [x] Correct incline angle rendering calculations for wedges
- [x] Stop inclined block clipping using normal direction offsets
- [x] Render standing wave envelope lines and label Nodes/Antinodes
- [x] Add dynamic force labels on pulleys and blocks
- [x] Implement collision particle spark explosions on impact
- [x] Setup status bars showing time, position, velocities, energies

### Phase 4: User Interaction & Accessibility
**Status**: ⬜ Planned
**Objective**: Enhance direct manipulation and expand physics presets.
- [ ] Implement circular/centripetal motion preset
- [ ] Add interactive drag handles to adjust vectors and block positions directly on the canvas
- [ ] Add keyboard hotkeys (e.g., Space to pause/play, R to reset, numbers to switch presets)
- [ ] Optimize touch events for mobile/tablet screens
