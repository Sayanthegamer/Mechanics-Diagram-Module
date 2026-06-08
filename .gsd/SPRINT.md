# Sprint — Rework Vertical Loop Simulation

> **Duration**: 2026-06-08 to 2026-06-10
> **Status**: In Progress

## Goal
Rework the vertical loop simulation in `MechanicsDiagram.ts` from a static analytical rotation to an active numerical simulation where the bob responds to gravity and the string can go slack (behaving like a projectile) if tension drops to zero.

## Scope

### Included
- Rework `stepCircular` to use numerical integration tracking the bob's dynamic position/velocity (or angle/angular velocity) and handle string state (taut vs. slack).
- Rework `drawCircular` to draw either a taut string or a slack string, and update the force vectors (Tension, Gravity).
- Add initial velocity and parameter adjustment sliders if necessary.

### Explicitly Excluded
- Modifying other presets (Projectile, Pulley, Collision).

## Tasks

| Task | Assignee | Status | Est. Hours |
|------|----------|--------|------------|
| Design and implement slack-string projectile fallback equations in `MechanicsDiagram.ts` | Claude | [x] Completed | 2 |
| Update rendering for slack string and circular motion UI sliders in `main.ts` | Claude | [x] Completed | 1 |
| Verify correct physics simulation behavior visually in the browser | Claude | [x] Completed | 0.5 |

## Daily Log

### 2026-06-08
- Sprint created.
- Implemented state tracking, Euler-Cromer integration, gravity, tension detection, projectile motion during slack state, and inelastic snap-taut tangent velocity projection in `stepCircular`.
- Refactored `drawCircular` to draw dashed string when slack, use Cartesian coordinates, and update dynamic velocity/tension arrows.
- Verified all behaviors successfully using the browser subagent for different initial speeds (low, intermediate, high).

