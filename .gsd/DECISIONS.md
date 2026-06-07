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

