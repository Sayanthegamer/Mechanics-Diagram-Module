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

---

## Phase 2 Decisions

**Date:** 2026-06-08

### Two-Body Orbit Solver
- **Approach**: Option B (Velocity Verlet Integration) was chosen as it is a symplectic integrator that perfectly conserves system energy and angular momentum over long simulation runs, keeping binary orbits visually stable.

### Frame of Reference
- **Approach**: Option 1 (Origin locked to the Barycenter) was chosen. By shifting the rendering origin to match the common center of mass, we keep the orbital path centered, making binary orbit patterns (symmetric ellipses) clear and clean.
