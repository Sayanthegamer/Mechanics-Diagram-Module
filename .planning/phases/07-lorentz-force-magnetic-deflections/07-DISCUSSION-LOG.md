# Phase 7: Lorentz Force & Magnetic Deflections - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-10
**Phase:** 07-lorentz-force-magnetic-deflections
**Areas discussed:** Particle Gun Interaction/Controls, Magnetic Field Visual Mode, Trajectory Trails, Collisions

---

## Particle Gun Interaction/Controls

| Option | Description | Selected |
|--------|-------------|----------|
| Draggable Interactive Gun | Drag and aim the gun directly on the canvas | |
| Sidebar Manual Controls | Adjust parameters using sliders and press Fire | |
| Hybrid Controls | Support both a draggable gun on canvas and manual sliders in the sidebar | ✓ |

**User's choice:** Hybrid Controls (draggable interactive gun + manual controls/sliders).
**Notes:** The user wants it interactable but wants to keep the manual controls just in case.

---

## Magnetic Field Visual Mode

| Option | Description | Selected |
|--------|-------------|----------|
| Symbols Only | Grid of $\times$ and $\bullet$ symbols representing B-field into/out of page | |
| Lines Only | Smooth field lines showing the shape/strength of the B-field | |
| Interactive Toggle | A slider for B-field value and a toggle mode to switch rendering between symbols and lines | ✓ |

**User's choice:** Mode switch between symbols and lines with a sidebar slider.
**Notes:** Switch between the modes of x and . and actual magnetic field lines, and keep the slider control.

---

## Trajectory Trails

| Option | Description | Selected |
|--------|-------------|----------|
| Real-time Telemetry Trail | Solid trails tracing paths of particles, cleared on reset | ✓ |
| Continuous Infinite Trails | Infinite trail history without reset | |

**User's choice:** Solid trails cleared upon reset, with real-time speed/coordinate telemetry graphing.
**Notes:** Telemetry wired to GraphModule, traces cleared when reset is clicked.

---

## Collisions

| Option | Description | Selected |
|--------|-------------|----------|
| Textbook Contact Absorption | Annihilation/absorption of a particle when it collides with a static point charge | ✓ |
| Elastic Bounce | Particle bounces off the charge center | |

**User's choice:** Textbook contact absorption/annihilation.
**Notes:** Make it like whatever our textbooks contain.

---

## the agent's Discretion

- Color choice for trajectory trails.
- Particle gun graphical asset representation.
- Numerical integration step sizing.

## Deferred Ideas

- AC/DC Circuit engine solvers (deferred to Phase 8).

---

*Phase: 07-lorentz-force-magnetic-deflections*
*Discussion log generated: 2026-06-10*
