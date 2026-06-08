# Decisions

> Previous milestone decisions archived in `.gsd/milestones/v4.0/DECISIONS.md`

---

## Phase 1 Decisions

**Date:** 2026-06-08

### Scope
- **Point Charge Cap**: Capped at 12 charges. This is sufficient to model dipoles, quadrupoles, and parallel plate approximations, while keeping calculations fast.
- **Overlays**: Support both a grid of field vectors (arrows) and continuous field lines, toggleable via sidebar switches.

### Approach
- **Equipotentials**: Option A (Marching Squares algorithm) on a structured grid of potential values to yield clean, continuous contour lines representing voltage shells.
- **Singularities**: Implement a softening factor $\epsilon^2 = 0.04$ to avoid infinite fields/forces when drawing or probing near point charges.

