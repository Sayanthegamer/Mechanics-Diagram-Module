# Architecture

**Analysis Date:** 2026-06-10

## Pattern Overview

**Overall:** Client-Side Single Page Web Application (SPA) driven by an HTML5 Canvas2D rendering loops orchestrator.

**Key Characteristics:**
- **Object-Oriented Diagrams:** Modular simulation implementations using structured TypeScript classes.
- **Unified Engine Loop:** Centralized event handling and scheduling utilizing browser `requestAnimationFrame` for a smooth 60fps simulation experience.
- **Model-View-Controller (MVC) Alignment:** Separation between physical layout templates (`index.html`), coordination logic (`src/main.ts`), and computational rendering/physics models (`src/lib/diagrams/*.ts`).

## Layers

**View Layer:**
- Purpose: Frame the layout, controls sidebar, preset selection dropdowns, dynamic parameters controllers, simulation canvas holders, and terminal configuration code text editor.
- Contains: `index.html`, `src/style.css`
- Depends on: None
- Used by: User interactions

**Controller/Orchestrator Layer:**
- Purpose: Initialize coordinates mapper contexts, bind all UI event listeners, handle manual configuration overlays, detect canvas coordinate hover/drag targets, run the ticking frame loop, and manage accumulated telemetry graphs.
- Contains: `src/main.ts`
- Depends on: Graphic Wrapper Layer, Diagram Simulation Layer
- Used by: View Layer event dispatchers

**Diagram Simulation Layer:**
- Purpose: Perform math integration algorithms (Euler, RK4) for mechanics, wave propagation, harmonic motion, gas dynamics, thermal systems, and fluids, drawing the results to the Canvas wrapper.
- Contains: `src/lib/diagrams/*.ts` (e.g. [FbdDiagram.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/diagrams/FbdDiagram.ts), [ShmDiagram.ts](file:///c:/Users/Anon/Desktop/Physics-Diagrams/src/lib/diagrams/ShmDiagram.ts))
- Depends on: Graphics Wrapper Layer
- Used by: Controller/Orchestrator Layer

**Graphics Wrapper Layer:**
- Purpose: Provide standard vector drawings, pan settings, Coordinate System conversions, high-DPI scaling checks, and standard physics meshes (springs, pulleys, incline blocks).
- Contains: `src/lib/PhysicsCanvas.ts`
- Depends on: None
- Used by: Diagram Simulation Layer

## Data Flow

**Simulation Run Ticking:**

1. The browser launches the `requestAnimationFrame(simulationLoop)` chain in `src/main.ts`.
2. A delta timestamp `dt` is computed and clamped to a maximum of `0.1s`.
3. If `isPlaying` is true, the active simulation class is stepped forward via `stepSimulation(dt * simSpeed)`.
4. The corresponding diagram class executes updates: updating coordinates, dragging particles, resolving collisions, and integrating forces (e.g. using Euler or RK4 in `ShmDiagram.ts`).
5. `drawActiveSimulation()` clears the canvas and invokes `.draw()` on the active diagram, which utilizes `PhysicsCanvas` coordinate converters (`toScreen()`) to render vector lines, bodies, and grids.
6. Real-time telemetry values are buffered into histories and drawn on the secondary card via `GraphModule.ts`.
7. `updateStatusBar()` updates metrics (Sim Time, Kinetic Energy, Accel, Velocity) in the footer.

**Interactive Code Configuration Changes:**

1. The user alters the JSON text in the interactive configuration editor textarea.
2. The user clicks **Apply** (`#btn-apply-code`).
3. `handleCodeApply()` parses the JSON text. If invalid, the box is colored red and an alert modal shows.
4. If valid, `applyConfig(activeConfig)` is invoked to sync dropdown choices, rebuild sliders, bind variables, reset graph history, and redraw.

## Key Abstractions

**PhysicsCanvas:**
- Purpose: High-level drawing wrapper. Coordinates grid lines, panning, arrows, vectors, spring graphics, pulley graphics, and rotates incline blocks.
- Location: `src/lib/PhysicsCanvas.ts`
- Pattern: Utility Helper Class

**GraphModule:**
- Purpose: Render dynamic history line plots, phase-space trails, and theoretical Rayleigh gas speed distributions.
- Location: `src/lib/diagrams/GraphModule.ts`
- Pattern: Specialized Render Module

**Diagram Modules:**
- Purpose: Individual physics contexts.
- Examples: `FbdDiagram`, `VectorDiagram`, `ShmDiagram`, `WaveDiagram`, `MechanicsDiagram`, `FluidsDiagram`, `GravityDiagram`, `ThermoDiagram`.
- Location: `src/lib/diagrams/`
- Pattern: Encapsulated Physics Model Classes

## Entry Points

**Orchestrator Entry:**
- Location: `src/main.ts` -> `init()`
- Triggers: Registered on window initialization / DOM load.
- Responsibilities: Creates `PhysicsCanvas`, `GraphModule`, instantiates all diagram class models, calls initial preset loading, and starts the recursive `requestAnimationFrame` loop.

## Error Handling

**Configuration Parsing:**
- Inside `handleCodeApply()`, JSON strings are wrapped in a `try/catch` block. If parsing fails or the required `type` parameter is missing, it highlights the editor in red and displays an alert.

---

*Architecture analysis: 2026-06-10*
*Update when major patterns change*
