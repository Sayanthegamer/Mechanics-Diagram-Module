# Sprint 3 — rethink-carnot

> **Duration**: 2026-06-08 to 2026-06-11
> **Status**: In Progress

## Goal
Redesign the Carnot engine visualization to make it more intuitive and educational by replacing/overlaying the chaotic particles with a smooth gas color field, adding macro heat/work transfer flow arrows, and adding a Temperature-Entropy (T-S) diagram.

## Scope

### Included
- Implement Temperature-Entropy (T-S) coordinate mapping and plotting option on the Carnot graph card.
- Add a smooth, glowing gas color field background inside the piston chamber that changes color dynamically based on temperature (hot orange-red at $T_H$ to cold cyan-blue at $T_C$).
- Draw macro-arrows and text annotations directly in the cylinder to represent heat input ($Q_{\text{in}}$ entering during isothermal expansion), heat output ($Q_{\text{out}}$ leaving during isothermal compression), and work done ($W$ arrows pushing the piston).
- Add a Carnot Cycle simulation speed slider to allow speeding up or slowing down the FSM transitions.

### Explicitly Excluded
- Changing the kinetic theory molecular speed solver or gas diffusion species barrier physics.

## Tasks

| Task | Assignee | Status | Est. Hours |
|------|----------|--------|------------|
| Research and design T-S diagram mapping, gas color field, and flow arrows | Claude | ⬜ Todo | 2 |
| Implement T-S diagram plot in GraphModule.ts and piston overlays in ThermoDiagram.ts | Claude | ⬜ Todo | 4 |
| Add Carnot Speed slider and verify all changes build and compile | Claude | ⬜ Todo | 2 |

## Daily Log

### 2026-06-08
- Sprint created to rethink the Carnot engine representation.
