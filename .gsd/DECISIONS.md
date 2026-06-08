# Decisions

> Previous milestone decisions archived in `.gsd/milestones/v3.0/DECISIONS.md`

---

## Phase 1 Decisions

**Date:** 2026-06-08

### Scope
- **Particle Species**: Bi-disperse species (Heavy/Red and Light/Blue particles) to clearly illustrate differences in speed distributions and diffusion.
- **Particle Count ($N$)**: Controlled from 10 to 150 particles to keep 60fps performance optimal.
- **Volume Change**: Real-time adjustable right-hand boundary wall via both dynamic sidebar slider and direct canvas click-and-drag.

### Approach
- **Integration & Collisions**: Verlet integration combined with naive $O(N^2)$ elastic pairwise collision checking and instant velocity scaling for temperature updates. Pressure is calculated dynamically by accumulating wall collision momentum transfers.

