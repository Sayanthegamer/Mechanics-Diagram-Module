# Decisions

> Previous milestone decisions archived in `.gsd/milestones/v2.0/DECISIONS.md`

---

## Phase 1 Decisions

**Date:** 2026-06-08

### Keplerian Orbit Solver
- **Approach**: Option A (Newton-Raphson numerical iteration) was chosen to solve Kepler's equation $M = E - e\sin E$ for high accuracy and stability even at higher eccentricities ($e \le 0.8$).

### Kepler's 2nd Law Visualization
- **Aesthetic**: Render multiple shaded sectors (wedges) drawn at fixed time intervals as the planet orbits. Shaded sectors will persist and alternate colors to clearly illustrate the equal-area principle (shorter and wider wedges near perihelion, longer and thinner wedges near aphelion).
- **Controls**: Add a checkbox/toggle "Show Sector Sweeps" in the controls sidebar.
