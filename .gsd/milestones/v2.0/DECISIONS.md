# Decisions

> Previous milestone decisions archived in `.gsd/milestones/v1.0/DECISIONS.md`

---

## Phase 5 Decisions

**Date:** 2026-06-07

### Scope
- Separate Hydrostatics presets will be created:
  1. **Buoyancy & Pressure Lab**: Container of fluid with floating/submerged blocks, live water displacement levels, and a draggable hydrostatic pressure probe.
  2. **Pascal Hydraulic Press**: Dual-piston cylinder demonstration showing force amplification and level changes.
- The pressure probe will display both absolute and gauge pressure, allowing toggling of atmospheric pressure.

### Approach
- **Chose:** Option A (Dedicated `src/lib/diagrams/FluidsDiagram.ts` component)
- **Reason:** Fluid physics calculations (density, viscosity, pressure columns, Bernoulli streamlines) are mathematically distinct from rigid-body pulley systems or projectile motion, keeping the codebase clean and modular.

### Constraints
- Ensure physical damping/drag in the fluid simulation is parameterized to stabilize floating block oscillations.

## Phase 7 Decisions

**Date:** 2026-06-08

### Scope
- **Interactive Graphs:** Implement real-time plotting for Hydrodynamics presets.
  - **Bernoulli Pipe Flow:** Graph Inlet Speed ($v_1$), Throat Speed ($v_2$), and Throat/Inlet Pressure Drop ($\Delta P$) over time.
  - **Viscosity Cylinder:** Graph Sphere Position ($y$), Sphere Downward Speed ($|v_y|$), and the Terminal Velocity ($v_t$) as a reference line.
- **Canvas Panning:** Allow users to pan the simulation viewport by clicking and dragging on any empty space of the canvas (not occupied by drag handles).
- **Todo Integration:** Moved the "make simulation space pannable/scrollable" todo item from the backlogged maintenance list into the active scope of Phase 7.

### Approach
- Keep the graphs as time-series plots to align with `GraphModule`'s structural design, which updates dynamically over time as the simulation steps forward.
- Implement canvas panning inside `PhysicsCanvas.ts` (using offsets `panX` and `panY`), making it universally available across all simulation modules.
