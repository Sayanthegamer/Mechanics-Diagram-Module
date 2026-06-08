---
phase: 7
level: 1
researched_at: 2026-06-08
---

# Phase 7 Research: UI Integration, Plotting & Viewport Panning

## Questions Investigated
1. **Viewport Panning Transforms**: How can we implement canvas coordinate panning with minimal impact on existing drawing utilities (`drawGrid`, `drawArrow`, `drawBlock`, etc.)?
2. **Dynamic Multi-Mode Graphing Scaling**: How should the Y-axis range scale when displaying custom curves for Buoyancy, Pascal, Bernoulli, and Viscosity, and what colors/labels represent them best?

## Findings

### Viewport Panning in PhysicsCanvas
To implement panning cleanly without rewriting individual drawing methods, we can modify the coordinate conversion methods in `PhysicsCanvas.ts`:
- **Existing `toScreen` and `toPhysics` conversions**:
  ```typescript
  public toScreen(x: number, y: number): { x: number; y: number } {
    return {
      x: this.originX + x * this.scale,
      y: this.originY - y * this.scale
    };
  }
  ```
- **Recommended offset approach**:
  By storing `panX` and `panY` in `PhysicsCanvas`, and adjusting `originX` / `originY` directly inside `resetOrigin()`:
  ```typescript
  public resetOrigin(): void {
    this.originX = this.canvas.clientWidth / 2 + this.panX;
    this.originY = this.canvas.clientHeight / 2 + this.panY;
  }
  ```
  All drawing calls that use `toScreen()` automatically inherit the pan offsets. This means we do not need to modify any drawing code in `FbdDiagram`, `WaveDiagram`, `FluidsDiagram`, etc.

### Dynamic Plotting in GraphModule
`GraphModule.ts` currently plots a single set of curves based on `FluidsState`. In Bernoulli/Viscosity/Pascal, these fields (`blockY`, `blockVy`) do not represent the actual physical variables of interest.
- **Pascal**: Plot piston offset displacements.
- **Bernoulli**: Plot inlet velocity ($v_1$), throat velocity ($v_2$), and pressure drop ($\Delta P$). Because velocity (m/s) and pressure drop (kPa) are on different scales, we should apply a dynamic scaling boundary that encompasses all active curves.
- **Viscosity**: Plot sphere falling height ($y$), downward speed ($|v_y|$), and the terminal speed limit ($v_t$).

## Decisions Made
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Panning storage | Store `panX`, `panY` directly in `PhysicsCanvas` | Centralizes coordinate conversion logic and prevents code duplication. |
| Panning reset | Reset pan offsets to zero on preset changes | Avoids new presets loading in off-center positions. |
| Graph mode routing | Pass active mode from `main.ts` to `drawFluids` | Allows `GraphModule` to render custom labels/colors without global state. |

## Patterns to Follow
- Use `pc.resetOrigin()` whenever panning changes to update rendering coordinates dynamically.
- Keep the `GraphModule` drawing routines stateless by reading all variables from the `history` log.

## Risks
- **Pan clipping**: If the user pans too far, the simulation will go off-screen.
  - *Mitigation*: Ensure user can drag back, or keep panning bounded (e.g. within $\pm 1000$ pixels).
- **Graph Y-scale collapse**: If data curves are flat, the Y-range might collapse.
  - *Mitigation*: Ensure a minimum Y-range of 1.0 is enforced.

## Ready for Planning
- [x] Questions answered
- [x] Approach selected
- [x] Dependencies identified
